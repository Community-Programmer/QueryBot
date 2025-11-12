#!/usr/bin/env python3
"""
Example script demonstrating how to use base64 encoded chart images 
from the Enhanced QueryBot agent.
"""

import base64
import io
# from PIL import Image  # Commented out for now
# from querybot_agent.agent import QueryBotAgent  # Commented out for now


def save_base64_image(base64_data: str, filename: str = "chart.png"):
    """
    Save a base64 encoded image to a file.
    
    Args:
        base64_data (str): Base64 encoded image data
        filename (str): Output filename
    """
    try:
        # Decode base64 data
        image_data = base64.b64decode(base64_data)
        
        # Save to file
        with open(filename, 'wb') as f:
            f.write(image_data)
        
        print(f"✅ Image saved as {filename}")
        return True
    except Exception as e:
        print(f"❌ Error saving image: {e}")
        return False


def display_base64_image(base64_data: str):
    """
    Display a base64 encoded image using PIL.
    
    Args:
        base64_data (str): Base64 encoded image data
    """
    print("💡 To display images, install Pillow: pip install Pillow")
    print("Then uncomment the PIL import and this function")
    # try:
    #     # Decode base64 data
    #     image_data = base64.b64decode(base64_data)
    #     
    #     # Create PIL Image from bytes
    #     from PIL import Image
    #     image = Image.open(io.BytesIO(image_data))
    #     
    #     # Display image (opens in default image viewer)
    #     image.show()
    #     print("✅ Image displayed")
    #     return True
    # except Exception as e:
    #     print(f"❌ Error displaying image: {e}")
    #     return False


def convert_base64_to_data_url(base64_data: str, image_format: str = "png") -> str:
    """
    Convert base64 image data to a data URL for web usage.
    
    Args:
        base64_data (str): Base64 encoded image data
        image_format (str): Image format (png, jpg, etc.)
        
    Returns:
        str: Data URL string
    """
    return f"data:image/{image_format};base64,{base64_data}"


def main():
    """Demonstrate base64 chart image usage."""
    print("🚀 Enhanced QueryBot Base64 Chart Example")
    print("=" * 50)
    
    # Example usage (you'll need a real database UUID)
    # agent = QueryBotAgent()
    # result = agent.query("Show me sales by product", "your-database-uuid")
    
    # For demonstration, let's show how to handle the response
    print("\n📋 Example Response Structure:")
    example_response = {
        "answer": "Based on your question 'Show me sales by product'...",
        "visualization": "bar",
        "visualization_reason": "Bar chart optimal for categorical comparison",
        "chart_image_base64": "iVBORw0KGgoAAAANSUhEUgAA...actual_base64_data...",
        "chart_generation_error": None,
        "insights": "📊 Key Insights: • Product A leads with 34% of sales",
        "formatted_table": None,
        "data_narrative": "Sales data reveals strong performance...",
        "insights_error": None
    }
    
    print(f"Answer: {example_response['answer'][:50]}...")
    print(f"Visualization: {example_response['visualization']}")
    print(f"Has Chart Data: {'Yes' if example_response['chart_image_base64'] else 'No'}")
    
    print("\n💡 How to use base64 chart data:")
    
    # Example 1: Save to file
    print("\n1️⃣ Save chart to file:")
    print("```python")
    print("if result['chart_image_base64']:")
    print("    save_base64_image(result['chart_image_base64'], 'my_chart.png')")
    print("```")
    
    # Example 2: Display directly
    print("\n2️⃣ Display chart directly:")
    print("```python") 
    print("if result['chart_image_base64']:")
    print("    display_base64_image(result['chart_image_base64'])")
    print("```")
    
    # Example 3: Use in web applications
    print("\n3️⃣ Use in web applications:")
    print("```python")
    print("if result['chart_image_base64']:")
    print("    data_url = convert_base64_to_data_url(result['chart_image_base64'])")
    print("    # Use data_url in HTML: <img src='{data_url}' alt='Chart'>")
    print("```")
    
    # Example 4: Send via API/JSON
    print("\n4️⃣ Send via API/JSON:")
    print("```python")
    print("import json")
    print("response_json = json.dumps(result)  # Base64 data included")
    print("# Send response_json via REST API, WebSocket, etc.")
    print("```")
    
    print("\n✨ Benefits of Base64 Encoding:")
    print("  • No file system dependencies")
    print("  • Easy to send over HTTP/JSON APIs")
    print("  • Can be embedded directly in HTML")
    print("  • Works in serverless environments")
    print("  • No temporary file cleanup needed")
    
    print("\n📏 Base64 Size Information:")
    print("  • Base64 encoding increases size by ~33%")
    print("  • Typical chart: ~50-200KB → ~67-267KB base64")
    print("  • Consider compression for large charts")
    
    print("\n🔧 Advanced Usage:")
    print("```python")
    print("# Compress base64 data if needed")
    print("import gzip, base64")
    print("compressed = gzip.compress(base64.b64decode(chart_data))")
    print("compressed_b64 = base64.b64encode(compressed).decode()")
    print("```")


if __name__ == "__main__":
    main()