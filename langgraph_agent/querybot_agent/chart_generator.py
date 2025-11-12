"""
Chart Generator Module - Uses Python REPL to generate visualizations locally.


This module contains tools and agents for generating charts using matplotlib,
seaborn, pandas, and numpy, and saving them as image files.
"""


from typing import Annotated, Dict, Any
from langchain_core.tools import tool
from langchain_experimental.utilities import PythonREPL
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from langgraph.graph import END
from querybot_agent.llm_manager import LLMManager
import os
import uuid
from datetime import datetime



class ChartGenerator:
    """Generates charts locally using Python REPL and saves them as images."""
    
    def __init__(self):
        self.llm_manager = LLMManager()
        self.repl = PythonREPL()
        self.charts_dir = "generated_charts"
        # Create charts directory if it doesn't exist
        if not os.path.exists(self.charts_dir):
            os.makedirs(self.charts_dir)
    
    def create_chart_agent(self):
        """Create a ReAct agent specialized for chart generation."""
        
        # Create the tool as a proper function
        @tool
        def python_repl_tool(code: Annotated[str, "The python code to execute to generate your chart."]) -> str:
            """
            Execute Python code using a Python REPL (Read-Eval-Print Loop).
            
            Args:
                code (str): The Python code to execute for chart generation.
                
            Returns:
                str: The result of the executed code or an error message if execution fails.
            """
            try:
                result = self.repl.run(code)
            except BaseException as e:
                return f"Failed to execute. Error: {repr(e)}"
            
            result_str = f"Successfully executed:\n```python\n{code}\n```\nStdout: {result}"
            return result_str + "\n\nIf you have completed the chart generation task, respond with FINAL ANSWER."
        
        chart_task = """Create clear and visually appealing charts using matplotlib, seaborn, pandas, and numpy. Follow these rules:


1. **Setup Environment**: Import required libraries at the beginning:
    - import pandas as pd
    - import numpy as np 
    - import matplotlib.pyplot as plt
    - import seaborn as sns


2. **Styling**: Apply these styles for professional charts:
    - sns.set_context("notebook") for readable text
    - sns.set_theme() or sns.set_style("whitegrid") for clean appearance
    - Use accessible color palettes like sns.color_palette("husl")


3. **Chart Types**: Choose appropriate visualizations:
    - Line plots: sns.lineplot() for trends over time
    - Bar plots: sns.barplot() for categorical comparisons  
    - Scatter plots: sns.scatterplot() for relationships between variables
    - Heatmaps: sns.heatmap() for correlation matrices


4. **Professional Formatting**:
    - Add meaningful titles using plt.title()
    - Label axes with units using plt.xlabel() and plt.ylabel()
    - Add legends when needed using plt.legend()
    - Ensure chart width is no more than 1000px using plt.figure(figsize=(10, 6))


5. **Data Enhancement**:
    - Annotate key points with plt.annotate() when relevant
    - Use appropriate tick formatting for axes
    - Handle missing data appropriately


6. **File Saving**: 
    - Save charts as high-quality PNG files using plt.savefig()
    - Use bbox_inches='tight' and dpi=300 for quality
    - Generate unique filenames using timestamps or UUIDs
    - Save to the 'generated_charts' directory


7. **Final Steps**:
    - Always call plt.show() to display the chart
    - Clear the figure with plt.clf() or plt.close() after saving


Goal: Produce accurate, engaging, and professional charts that are saved as high-quality image files.
"""


        # Get the LLM from LLMManager
        llm = self.llm_manager.llm
        
        # Create the agent with the Python REPL tool
        chart_agent = create_react_agent(
            llm,
            [python_repl_tool],
            prompt=self._make_system_prompt(chart_task)
        )
        
        return chart_agent
    
    def _make_system_prompt(self, suffix: str) -> str:
        """Generate a system prompt for the chart generation agent.
        
        Args:
            suffix (str): Additional context or instructions to append to the base system prompt.
            
        Returns:
            str: The complete system prompt.
        """
        return (
            "You are a data visualization expert, specializing in creating professional charts and graphs."
            " Use the provided Python REPL tool to generate high-quality visualizations."
            " Your goal is to create clear, informative, and visually appealing charts that effectively"
            " communicate the data insights. Always save your charts as image files."
            " If you successfully complete the chart generation task,"
            " prefix your response with FINAL ANSWER so the system knows to stop."
            f"\n{suffix}"
        )
    
    def generate_chart(self, state: dict) -> dict:
        """
        Generate a chart based on the visualization type and data.
        
        Args:
            state (dict): The current state containing visualization type and results
            
        Returns:
            dict: Updated state with chart_image_path or error information
        """
        visualization = state.get('visualization', 'none')
        results = state.get('results', [])
        question = state.get('question', '')
        
        # Skip chart generation if visualization is none or no data
        if visualization == "none" or not results:
            return {"chart_image_path": None, "chart_generation_error": None}
        
        try:
            # Create unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            chart_filename = f"chart_{timestamp}_{str(uuid.uuid4())[:8]}.png"
            chart_path = os.path.join(self.charts_dir, chart_filename)
            
            # Prepare data and generate chart code
            chart_code = self._generate_chart_code(visualization, results, question, chart_path, state)
            
            # Create and invoke the chart agent
            chart_agent = self.create_chart_agent()
            
            # Prepare the message for the agent
            messages = [
                HumanMessage(content=f"""
Please generate a {visualization} chart for the following data and question:


Question: {question}
Visualization Type: {visualization}
Data: {results}
Save Path: {chart_path}


{chart_code}


Please execute this code to generate and save the chart. Make sure to follow all the styling guidelines.
""")
            ]
            
            # Invoke the chart agent
            response = chart_agent.invoke({"messages": messages})
            
            # Check if chart was successfully created
            if os.path.exists(chart_path):
                return {
                    "chart_image_path": chart_path,
                    "chart_generation_error": None
                }
            else:
                return {
                    "chart_image_path": None,
                    "chart_generation_error": "Chart file was not created successfully"
                }
                
        except Exception as e:
            return {
                "chart_image_path": None,
                "chart_generation_error": f"Error generating chart: {str(e)}"
            }
    
    def _generate_chart_code(self, visualization: str, results: list, question: str, save_path: str, state: dict = None) -> str:
        """
        Generate advanced Python code for creating optimized chart types using seaborn and matplotlib.
        
        Args:
            visualization (str): Type of visualization to create
            results (list): Data to visualize
            question (str): Original question for context
            save_path (str): Path where to save the chart
            state (dict): Additional state information including seaborn function
            
        Returns:
            str: Python code for generating the chart
        """
        # Get enhanced visualization info from state
        seaborn_func = (state or {}).get('seaborn_function', 'sns.barplot') if state else 'sns.barplot'
        
        # Convert results to string format for code generation
        if isinstance(results, str):
            try:
                results = eval(results)
            except:
                pass
        
        code_template = f"""
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')


# Set up professional styling
plt.style.use('default')
sns.set_theme(style="whitegrid", palette="husl")
sns.set_context("notebook", font_scale=1.2, rc={{"lines.linewidth": 2}})


# Data preparation
data = {results}


# Create DataFrame with intelligent column naming
if data and len(data) > 0:
    num_cols = len(data[0])
    if num_cols == 2:
        df = pd.DataFrame(data, columns=['Category', 'Value'])
    elif num_cols == 3:
        df = pd.DataFrame(data, columns=['Category', 'Subcategory', 'Value'])
    else:
        # Dynamic column naming
        cols = [f'Column_{{i+1}}' for i in range(num_cols)]
        df = pd.DataFrame(data, columns=cols)
    
    # Clean data
    df = df.dropna()
    print(f"Data shape: {{df.shape}}")
    print(f"Data columns: {{df.columns.tolist()}}")
else:
    print("No data available for visualization")
    exit()


# Create figure with optimal size
plt.figure(figsize=(12, 8))


"""
        
        # Generate chart-specific code based on visualization type and seaborn function
        if visualization == "line":
            code_template += """
# Enhanced Line Plot
if df.shape[1] >= 2:
    if 'Subcategory' in df.columns:
        # Multi-line plot with categories
        sns.lineplot(data=df, x='Category', y='Value', hue='Subcategory', 
                    marker='o', markersize=8, linewidth=2.5)
        plt.legend(title='Legend', bbox_to_anchor=(1.05, 1), loc='upper left')
    else:
        # Single line plot
        sns.lineplot(data=df, x='Category', y='Value', 
                    marker='o', markersize=8, linewidth=3, color='#2E86AB')


plt.title(f'Line Chart: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('Categories', fontsize=12, fontweight='bold')
plt.ylabel('Values', fontsize=12, fontweight='bold')
plt.xticks(rotation=45, ha='right')
plt.grid(True, alpha=0.3)
"""


        elif visualization in ["bar", "horizontal_bar"]:
            if visualization == "horizontal_bar":
                code_template += """
# Enhanced Horizontal Bar Plot
if 'Subcategory' in df.columns:
    # Grouped horizontal bars
    sns.barplot(data=df, y='Category', x='Value', hue='Subcategory', 
               orient='h', dodge=True, palette='viridis')
    plt.legend(title='Legend', bbox_to_anchor=(1.05, 1), loc='upper left')
else:
    # Simple horizontal bars
    bars = sns.barplot(data=df, y='Category', x='Value', 
                      orient='h', palette='rocket')
    
    # Add value labels
    for i, bar in enumerate(bars.patches):
        width = bar.get_width()
        plt.text(width + max(df['Value'])*0.01, bar.get_y() + bar.get_height()/2, 
                f'{width:.1f}', ha='left', va='center', fontweight='bold')


plt.title(f'Horizontal Bar Chart: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('Values', fontsize=12, fontweight='bold')
plt.ylabel('Categories', fontsize=12, fontweight='bold')
"""
            else:
                code_template += """
# Enhanced Vertical Bar Plot
if 'Subcategory' in df.columns:
    # Grouped vertical bars
    ax = sns.barplot(data=df, x='Category', y='Value', hue='Subcategory', 
                    dodge=True, palette='Set2')
    plt.legend(title='Legend', bbox_to_anchor=(1.05, 1), loc='upper left')
else:
    # Simple vertical bars with enhanced styling
    ax = sns.barplot(data=df, x='Category', y='Value', palette='viridis')
    
    # Add value labels on bars
    for i, bar in enumerate(ax.patches):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + max(df['Value'])*0.01,
               f'{height:.1f}', ha='center', va='bottom', fontweight='bold')


plt.title(f'Bar Chart: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('Categories', fontsize=12, fontweight='bold')
plt.ylabel('Values', fontsize=12, fontweight='bold')
plt.xticks(rotation=45, ha='right')
"""


        elif visualization == "pie":
            code_template += """
# Enhanced Pie Chart
if df.shape[1] >= 2:
    # Create pie chart with modern styling
    colors = sns.color_palette('Set3', len(df))
    wedges, texts, autotexts = plt.pie(df['Value'], labels=df['Category'], 
                                     autopct='%1.1f%%', startangle=90, 
                                     colors=colors, explode=[0.05]*len(df),
                                     shadow=True, textprops={'fontsize': 10})
    
    # Enhance text styling
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')


plt.title(f'Pie Chart: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.axis('equal')
"""


        elif visualization == "scatter":
            code_template += """
# Enhanced Scatter Plot
if df.shape[1] >= 2:
    if 'Subcategory' in df.columns and df.shape[1] >= 3:
        # Colored scatter by category
        sns.scatterplot(data=df, x='Category', y='Value', hue='Subcategory', 
                     s=150, alpha=0.8, edgecolors='black', linewidth=0.5)
        plt.legend(title='Legend', bbox_to_anchor=(1.05, 1), loc='upper left')
    else:
        # Simple scatter with trend line
        sns.scatterplot(data=df, x='Category', y='Value', 
                     s=150, alpha=0.8, color='#FF6B6B', edgecolors='black')
        
        # Add trend line if data is numeric
        try:
            x_numeric = pd.to_numeric(df['Category'], errors='coerce')
            if not x_numeric.isna().all():
                sns.regplot(data=df, x='Category', y='Value', scatter=False, 
                         color='red', line_kws={'linewidth': 2, 'alpha': 0.7})
        except:
            pass


plt.title(f'Scatter Plot: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('X Values', fontsize=12, fontweight='bold')
plt.ylabel('Y Values', fontsize=12, fontweight='bold')
plt.xticks(rotation=45, ha='right')
"""


        elif visualization == "heatmap":
            code_template += """
# Enhanced Heatmap
if df.shape[1] >= 3:
    # Pivot for heatmap if possible
    try:
        pivot_df = df.pivot(index='Category', columns='Subcategory', values='Value')
        sns.heatmap(pivot_df, annot=True, cmap='YlOrRd', fmt='.1f', 
                 cbar_kws={'shrink': 0.8}, square=True, linewidths=0.5)
    except:
        # Correlation heatmap for numeric data
        numeric_df = df.select_dtypes(include=[np.number])
        if not numeric_df.empty:
            corr_matrix = numeric_df.corr()
            sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0, 
                     square=True, fmt='.2f', cbar_kws={'shrink': 0.8})


plt.title(f'Heatmap: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
"""


        elif visualization == "box":
            code_template += """
# Enhanced Box Plot
if 'Subcategory' in df.columns:
    sns.boxplot(data=df, x='Category', y='Value', hue='Subcategory', palette='Set2')
    plt.legend(title='Legend', bbox_to_anchor=(1.05, 1), loc='upper left')
else:
    sns.boxplot(data=df, x='Category', y='Value', palette='viridis')


plt.title(f'Box Plot: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('Categories', fontsize=12, fontweight='bold')
plt.ylabel('Values', fontsize=12, fontweight='bold')
plt.xticks(rotation=45, ha='right')
"""


        elif visualization == "histogram":
            code_template += """
# Enhanced Histogram
if 'Value' in df.columns:
    plt.figure(figsize=(12, 6))
    sns.histplot(data=df, x='Value', bins=20, kde=True, alpha=0.7, 
                color='skyblue', edgecolor='black', linewidth=0.5)
    
    # Add statistics
    mean_val = df['Value'].mean()
    plt.axvline(mean_val, color='red', linestyle='--', linewidth=2, 
                label=f'Mean: {mean_val:.2f}')
    plt.legend()


plt.title(f'Histogram: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('Values', fontsize=12, fontweight='bold')
plt.ylabel('Frequency', fontsize=12, fontweight='bold')
"""


        else:
            # Enhanced generic plot
            code_template += """
# Enhanced Generic Plot
if df.shape[1] >= 2:
    if df['Category'].dtype in ['object', 'category']:
        # Categorical x-axis
        sns.barplot(data=df, x='Category', y='Value', palette='viridis')
    else:
        # Continuous x-axis
        sns.lineplot(data=df, x='Category', y='Value', marker='o', markersize=8)
else:
    # Single column plot
    plt.plot(df.iloc[:, 0], marker='o', linewidth=2, markersize=6)
    plt.ylabel('Values', fontsize=12, fontweight='bold')
    plt.xlabel('Index', fontsize=12, fontweight='bold')


plt.title(f'Data Visualization: """ + question.replace("'", "\\'") + """', fontsize=16, fontweight='bold', pad=20)
plt.xticks(rotation=45, ha='right')
"""


        code_template += f"""
# Final styling and save
plt.tight_layout()


# Ensure the directory exists
import os
os.makedirs(os.path.dirname('{save_path}'), exist_ok=True)


# Save with high quality
plt.savefig('{save_path}', dpi=300, bbox_inches='tight', 
           facecolor='white', edgecolor='none')
plt.close()  # Close to free memory


print(f"Enhanced chart saved successfully to: {save_path}")
print(f"Chart type: {visualization}")
print(f"Used seaborn function approach: {seaborn_func}")
"""
        
        return code_template



def chart_generation_node(state: Dict[str, Any]):
    """
    LangGraph node function for chart generation.
    
    Args:
        state (Dict[str, Any]): The current state of the workflow
        
    Returns:
        Dict: Updated state with chart information
    """
    chart_generator = ChartGenerator()
    result = chart_generator.generate_chart(state)
    
    return result