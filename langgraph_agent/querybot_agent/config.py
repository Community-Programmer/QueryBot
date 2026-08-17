"""
Agent configuration.

Centralises every environment-dependent value. The dataset service URL in
particular was previously hard-coded to ``http://localhost:3001``, which meant
the agent could never reach the service from a container or another host.
"""
import os
from dataclasses import dataclass, field


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, ''))
    except ValueError:
        return default


def _float_env(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, ''))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    """Runtime settings resolved from the environment."""

    # Dataset service
    sqlite_service_url: str = field(
        default_factory=lambda: os.environ.get('SQLITE_SERVICE_URL', 'http://localhost:3001').rstrip('/')
    )
    service_token: str = field(default_factory=lambda: os.environ.get('SERVICE_TOKEN', ''))
    request_timeout: int = field(default_factory=lambda: _int_env('SQLITE_REQUEST_TIMEOUT', 60))

    # Model. Groq retires models fairly often, so this is overridable and the
    # default is a currently-served one; check console.groq.com/docs/models if a
    # run fails with model_not_found.
    groq_model: str = field(
        default_factory=lambda: os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b')
    )
    temperature: float = field(default_factory=lambda: _float_env('TEMPERATURE', 0.0))
    max_retries: int = field(default_factory=lambda: _int_env('LLM_MAX_RETRIES', 2))

    # Chart generation
    charts_dir: str = field(default_factory=lambda: os.environ.get('CHART_OUTPUT_DIR', 'generated_charts'))
    chart_timeout: int = field(default_factory=lambda: _int_env('CHART_TIMEOUT', 120))
    chart_image_name: str = field(
        default_factory=lambda: os.environ.get('CHART_EXECUTOR_IMAGE', 'querybot-chart-executor')
    )
    # Docker isolates chart code from the host. Disabling it runs generated code
    # in-process and is intended only for environments without a Docker daemon.
    chart_docker_enabled: bool = field(
        default_factory=lambda: os.environ.get('CHART_DOCKER_ENABLED', 'true').lower() != 'false'
    )

    # Query limits
    max_result_rows: int = field(default_factory=lambda: _int_env('MAX_RESULT_ROWS', 5000))
    # Rows sent to the model for analysis; the full set still reaches the client.
    llm_sample_rows: int = field(default_factory=lambda: _int_env('LLM_SAMPLE_ROWS', 30))

    # How many times a failing query is rewritten using the database's error
    # message as feedback. Two repairs recovers most fixable failures; beyond that
    # the model tends to loop on the same mistake, so it is not worth the latency.
    max_sql_repairs: int = field(default_factory=lambda: _int_env('MAX_SQL_REPAIRS', 2))

    # Follow-up question suggestions after each answer.
    suggest_followups: bool = field(
        default_factory=lambda: os.environ.get('SUGGEST_FOLLOWUPS', 'true').lower() != 'false'
    )

    @property
    def auth_headers(self) -> dict[str, str]:
        return {'Authorization': f'Bearer {self.service_token}'} if self.service_token else {}


settings = Settings()
