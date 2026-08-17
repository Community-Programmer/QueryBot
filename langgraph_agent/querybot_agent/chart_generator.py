"""
Chart generation.

Two execution paths, chosen by how much the code can be trusted:

**Deterministic template — rendered in-process.** The plotting body is selected
from a fixed set of our own templates, and the data and title are injected as
JSON literals, so nothing the user or the model supplies ever becomes code. There
is no untrusted input to isolate, and rendering directly means charts work
without a Docker daemon.

**Model-written code — rendered in a container.** Used only when the template
fails to produce an image. This code is genuinely untrusted, so it runs with no
network, capped memory and CPU, a timeout and a non-root user. When Docker is
unavailable this path is simply skipped.
"""
import base64
import json
import logging
import os
import threading
import uuid
from datetime import datetime
from typing import Annotated, Any, Dict, Optional

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from querybot_agent.config import settings
from querybot_agent.docker_code_executor import DockerPythonREPL
from querybot_agent.llm_manager import LLMManager

logger = logging.getLogger(__name__)


class ChartGenerator:
    """Renders query results into a chart image."""

    def __init__(self) -> None:
        self.llm_manager = LLMManager()
        self.charts_dir = settings.charts_dir
        os.makedirs(self.charts_dir, exist_ok=True)

        self.repl: Optional[DockerPythonREPL] = None
        self.unavailable_reason: Optional[str] = None

        if not settings.chart_docker_enabled:
            # Not an error: templates still render in-process. Only the
            # model-written fallback is unavailable.
            self.unavailable_reason = 'The chart sandbox is disabled (CHART_DOCKER_ENABLED=false).'
            return

        # A missing Docker daemon must not take the whole run down: previously the
        # executor's constructor raised, so every chart question failed outright
        # instead of returning an answer without a chart.
        try:
            self.repl = DockerPythonREPL(
                image_name=settings.chart_image_name,
                timeout=settings.chart_timeout,
            )
            if not self.repl.validate_installation():
                logger.info('Building the chart executor image; this runs once.')
                if not self.repl.build_image():
                    self.repl = None
                    self.unavailable_reason = 'Could not build the chart executor Docker image.'
        except Exception as exc:  # noqa: BLE001 - degrade instead of failing the run
            logger.warning('Docker unavailable, charts disabled: %s', exc)
            self.repl = None
            self.unavailable_reason = f'Docker is not available: {exc}'

    @property
    def sandbox_available(self) -> bool:
        """Whether model-written code can be executed. Not needed for templates."""
        return self.repl is not None

    def generate_chart(self, state: dict) -> dict:
        """Produce a chart for the current results, or explain why it could not."""
        visualization = state.get('visualization', 'none')
        results = state.get('results') or []
        question = state.get('question', '')

        if visualization in ('none', None, '') or not results:
            return {'chart_image_base64': None, 'chart_generation_error': None}

        chart_filename = (
            f'chart_{datetime.now().strftime("%Y%m%d_%H%M%S")}_{uuid.uuid4().hex[:8]}.png'
        )
        chart_path = os.path.join(self.charts_dir, chart_filename)

        try:
            if self.sandbox_available:
                # Prefer the sandbox when it exists: it also bounds runaway
                # memory on a pathological result set.
                code = self._build_chart_code(
                    visualization, results, question, f'/app/output/{chart_filename}'
                )
                output = self.repl.run(code, output_dir=self.charts_dir)  # type: ignore[union-attr]
                encoded = self._read_and_cleanup(chart_path)
                if encoded:
                    return {'chart_image_base64': encoded, 'chart_generation_error': None}

                logger.info('Template produced no file in the sandbox, asking the model: %s', output)
                return self._generate_with_agent(
                    visualization, results, question, chart_filename, chart_path
                )

            # No sandbox: render the template here. Safe because the template
            # carries no untrusted code, only JSON-encoded data.
            code = self._build_chart_code(visualization, results, question, chart_path)
            self._render_in_process(code)

            encoded = self._read_and_cleanup(chart_path)
            if encoded:
                return {'chart_image_base64': encoded, 'chart_generation_error': None}

            # The model fallback writes its own code, which must not run
            # in-process, so there is nothing further to try.
            return {
                'chart_image_base64': None,
                'chart_generation_error': 'The chart could not be rendered from this data.',
            }

        except Exception as exc:  # noqa: BLE001 - reported to the user, not raised
            logger.exception('Chart generation failed')
            return {'chart_image_base64': None, 'chart_generation_error': f'Chart generation failed: {exc}'}

    def _render_in_process(self, code: str) -> None:
        """
        Execute a template-generated script in this process.

        Only ever called with output from `_build_chart_code`, whose plotting body
        comes from a fixed set of templates and whose data and title are JSON
        literals — no caller-supplied text becomes code. Model-written code is
        never passed here.

        pyplot keeps global figure state and is not thread-safe, so concurrent
        runs are serialised.
        """
        with _render_lock:
            namespace: dict[str, Any] = {'__name__': '__querybot_chart__'}
            try:
                exec(compile(code, '<chart-template>', 'exec'), namespace)  # noqa: S102
            except SystemExit:
                # The template raises SystemExit when the data cleans to nothing.
                logger.info('Chart template exited early: no plottable rows')
            finally:
                # A template that raised part-way through would otherwise leak an
                # open figure into the next render.
                try:
                    import matplotlib.pyplot as plt

                    plt.close('all')
                except Exception:  # noqa: BLE001
                    pass

    def _read_and_cleanup(self, chart_path: str) -> Optional[str]:
        """Base64-encode the rendered chart and remove the file from disk."""
        if not os.path.exists(chart_path):
            return None

        try:
            with open(chart_path, 'rb') as handle:
                encoded = base64.b64encode(handle.read()).decode('utf-8')
        finally:
            try:
                os.remove(chart_path)
            except OSError:
                logger.debug('Could not remove temporary chart file %s', chart_path)

        return encoded

    def _generate_with_agent(
        self,
        visualization: str,
        results: list,
        question: str,
        chart_filename: str,
        chart_path: str,
    ) -> dict:
        """Ask the model to write the plotting code when the template did not work."""
        try:
            agent = self._create_chart_agent()
            agent.invoke(
                {
                    'messages': [
                        HumanMessage(
                            content=(
                                f'Create a {visualization} chart answering: {question}\n\n'
                                f'Data (list of rows): {json.dumps(results[:200], default=str)}\n\n'
                                f'Save it to exactly "/app/output/{chart_filename}".'
                            )
                        )
                    ]
                }
            )

            encoded = self._read_and_cleanup(chart_path)
            if encoded:
                return {'chart_image_base64': encoded, 'chart_generation_error': None}

            return {
                'chart_image_base64': None,
                'chart_generation_error': 'The chart could not be rendered from this data.',
            }
        except Exception as exc:  # noqa: BLE001
            logger.exception('Agent chart generation failed')
            return {'chart_image_base64': None, 'chart_generation_error': f'Chart generation failed: {exc}'}

    def _create_chart_agent(self):
        """Build a ReAct agent whose only tool is the sandboxed Python executor."""
        repl = self.repl
        charts_dir = self.charts_dir

        @tool
        def docker_python_executor(
            code: Annotated[str, 'Python code that renders and saves the chart.']
        ) -> str:
            """Run Python in an isolated Docker container with no network access."""
            try:
                return str(repl.run(code, output_dir=charts_dir))  # type: ignore[union-attr]
            except Exception as exc:  # noqa: BLE001
                return f'Execution failed: {exc!r}'

        system_prompt = (
            'You are a data visualization expert. Write Python that renders a clear, '
            'professional chart using pandas, numpy, matplotlib and seaborn, then run it '
            'with the docker_python_executor tool.\n'
            '- The container has no network access and 512MB of memory.\n'
            "- The matplotlib backend is already set to 'Agg'; never call plt.show().\n"
            '- Save the figure to the exact path given in the request, under /app/output.\n'
            '- Use plt.figure(figsize=(12, 8)), label the axes, add a title, and call '
            'plt.tight_layout() before saving with dpi=150 and bbox_inches="tight".\n'
            '- Call plt.close() after saving.\n'
            'Reply with FINAL ANSWER once the file has been written.'
        )

        return create_react_agent(self.llm_manager.llm, [docker_python_executor], prompt=system_prompt)

    def _build_chart_code(
        self,
        visualization: str,
        results: list,
        question: str,
        output_path: str,
    ) -> str:
        """
        Build the plotting script.

        Values are injected as JSON literals rather than interpolated into
        generated f-strings. The previous approach embedded the raw question into
        an f-string in the generated code, so any question containing a brace
        produced invalid Python and any apostrophe risked breaking out of the
        literal.

        `output_path` is where the figure is written: a path inside the container
        mount for the sandbox, or a local path when rendering in-process.
        """
        title = json.dumps(f'{visualization.replace("_", " ").title()}: {question}'[:120])
        data_literal = json.dumps(results, default=str)
        output_literal = json.dumps(output_path.replace('\\', '/'))

        preamble = f'''
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

sns.set_theme(style="whitegrid", palette="husl")
sns.set_context("notebook", font_scale=1.1)

DATA = json.loads({json.dumps(data_literal)})
TITLE = {title}
OUTPUT_PATH = {output_literal}

# Derived from the output path so the same template works inside the container
# mount and against a local directory.
os.makedirs(os.path.dirname(OUTPUT_PATH) or ".", exist_ok=True)

if not DATA:
    raise SystemExit("No data to plot")

# Name columns by position: two columns read as category/value, three add a series.
COLUMN_COUNT = len(DATA[0]) if isinstance(DATA[0], (list, tuple)) else 1
if COLUMN_COUNT == 2:
    df = pd.DataFrame(DATA, columns=["Category", "Value"])
elif COLUMN_COUNT == 3:
    df = pd.DataFrame(DATA, columns=["Category", "Series", "Value"])
else:
    df = pd.DataFrame(DATA, columns=[f"Column_{{i + 1}}" for i in range(COLUMN_COUNT)])

# Values arrive from JSON as strings when SQLite stored them as text.
if "Value" in df.columns:
    df["Value"] = pd.to_numeric(df["Value"], errors="coerce")

df = df.dropna()
if df.empty:
    raise SystemExit("No usable rows after cleaning")

plt.figure(figsize=(12, 8))
has_series = "Series" in df.columns
'''

        bodies = {
            'line': '''
if has_series:
    sns.lineplot(data=df, x="Category", y="Value", hue="Series", marker="o")
    plt.legend(title="Series", bbox_to_anchor=(1.02, 1), loc="upper left")
else:
    sns.lineplot(data=df, x="Category", y="Value", marker="o", linewidth=2.5)
plt.xticks(rotation=45, ha="right")
plt.xlabel("Category")
plt.ylabel("Value")
''',
            'horizontal_bar': '''
if has_series:
    sns.barplot(data=df, y="Category", x="Value", hue="Series", orient="h")
    plt.legend(title="Series", bbox_to_anchor=(1.02, 1), loc="upper left")
else:
    sns.barplot(data=df, y="Category", x="Value", hue="Category", legend=False, orient="h")
plt.xlabel("Value")
plt.ylabel("Category")
''',
            'pie': '''
totals = df.groupby("Category")["Value"].sum().sort_values(ascending=False)
# Too many slices are unreadable; group the tail into "Other".
if len(totals) > 8:
    head = totals.head(7)
    totals = pd.concat([head, pd.Series({"Other": totals.iloc[7:].sum()})])
plt.pie(
    totals.values,
    labels=totals.index.astype(str),
    autopct="%1.1f%%",
    startangle=90,
    colors=sns.color_palette("husl", len(totals)),
)
plt.axis("equal")
''',
            'scatter': '''
df["Category"] = pd.to_numeric(df["Category"], errors="coerce")
df = df.dropna()
if has_series:
    sns.scatterplot(data=df, x="Category", y="Value", hue="Series", s=120, alpha=0.85)
    plt.legend(title="Series", bbox_to_anchor=(1.02, 1), loc="upper left")
else:
    sns.regplot(data=df, x="Category", y="Value", scatter_kws={"s": 120, "alpha": 0.85})
plt.xlabel("X")
plt.ylabel("Y")
''',
            'histogram': '''
sns.histplot(data=df, x="Value", bins=min(30, max(5, len(df) // 2)), kde=True)
mean_value = df["Value"].mean()
plt.axvline(mean_value, color="crimson", linestyle="--", linewidth=2, label=f"Mean: {mean_value:,.2f}")
plt.legend()
plt.xlabel("Value")
plt.ylabel("Frequency")
''',
            'box': '''
if has_series:
    sns.boxplot(data=df, x="Category", y="Value", hue="Series")
else:
    sns.boxplot(data=df, x="Category", y="Value", hue="Category", legend=False)
plt.xticks(rotation=45, ha="right")
''',
            'heatmap': '''
if has_series:
    pivot = df.pivot_table(index="Category", columns="Series", values="Value", aggfunc="sum")
else:
    pivot = df.set_index("Category")[["Value"]]
sns.heatmap(pivot, annot=True, fmt=".1f", cmap="YlGnBu", linewidths=0.5)
''',
        }

        default_body = '''
if has_series:
    sns.barplot(data=df, x="Category", y="Value", hue="Series")
    plt.legend(title="Series", bbox_to_anchor=(1.02, 1), loc="upper left")
else:
    ax = sns.barplot(data=df, x="Category", y="Value", hue="Category", legend=False)
    for container in ax.containers:
        ax.bar_label(container, fmt="%.1f", padding=2, fontsize=9)
plt.xticks(rotation=45, ha="right")
plt.xlabel("Category")
plt.ylabel("Value")
'''

        body = bodies.get(visualization, default_body)

        epilogue = '''
plt.title(TITLE, fontsize=15, fontweight="bold", pad=16)
plt.tight_layout()
plt.savefig(OUTPUT_PATH, dpi=150, bbox_inches="tight", facecolor="white")
plt.close()
print(f"Chart written to {OUTPUT_PATH}")
'''

        return preamble + body + epilogue


# Constructing a ChartGenerator probes Docker and may build an image, which is
# far too expensive to repeat for every chart. The instance is created once and
# shared; the lock keeps concurrent runs from racing on the image build.
_generator: Optional[ChartGenerator] = None
_generator_lock = threading.Lock()

# pyplot's figure registry is process-global, so in-process rendering has to be
# serialised across concurrent runs.
_render_lock = threading.Lock()


def get_chart_generator() -> ChartGenerator:
    """Return the process-wide chart generator, creating it on first use."""
    global _generator
    if _generator is None:
        with _generator_lock:
            if _generator is None:
                _generator = ChartGenerator()
    return _generator


def chart_generation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node that renders a chart for the current results."""
    return get_chart_generator().generate_chart(state)
