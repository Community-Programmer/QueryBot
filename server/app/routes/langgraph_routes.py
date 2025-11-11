"""
LangGraph routes for QueryBot server.
"""
import os
import json
from flask import Blueprint, request, Response, stream_with_context
from langgraph_sdk import get_sync_client

# Create blueprint
langgraph_bp = Blueprint('langgraph', __name__, url_prefix='/api/langgraph')


@langgraph_bp.route('/run', methods=['POST'])
def run_agent():
    """
    Stream response from LangGraph agent.
    
    Expected JSON payload:
    {
        "question": "string",
        "databaseUuid": "string" (optional)
    }
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return {'message': 'No JSON data provided'}, 400
            
        question = data.get('question')
        database_uuid = data.get('databaseUuid')
        
        # Debug: Log the incoming request
        print(f"🔍 DEBUG /run endpoint:")
        print(f"   Received data: {data}")
        print(f"   Question: {question}")
        print(f"   Database UUID from request: {database_uuid}")
        print(f"   UUID type: {type(database_uuid)}")
        
        if not question:
            return {'message': 'Question is required'}, 400
        
        # Default database UUID
        default_database_uuid = '921c838c-541d-4361-8c96-70cb23abd9f5'
        
        # Use the uploaded UUID or fall back to default
        final_uuid = database_uuid if database_uuid else default_database_uuid
        print(f"   Using final UUID: {final_uuid}")
        
        # Get environment variables
        api_key = os.environ.get('LANGSMITH_API_KEY')
        api_url = os.environ.get('LANGGRAPH_API_URL')
        
        if not api_url:
            return {'message': 'LANGGRAPH_API_URL environment variable not set'}, 500
        
        # Initialize LangGraph sync client
        client = get_sync_client(api_key=api_key, url=api_url)
        
        # Define synchronous generator
        def generate():
            try:
                # Create thread
                thread = client.threads.create()
                thread_id = thread['thread_id']
                
                # Prepare input in the format expected by LangGraph
                # Based on documentation, the input should match what your agent expects
                input_data = {
                    'question': question,
                    'uuid': final_uuid
                }
                
                print(f"   Sending to LangGraph: {input_data}")
                
                # Stream response from LangGraph with proper parameters
                stream_response = client.runs.stream(
                    thread_id=thread_id,
                    assistant_id='agent',  # Changed from 'my_agent' to 'agent' as per docs
                    input=input_data,
                    stream_mode='updates'  # Use 'updates' mode as per documentation
                )
                
                # Process the stream
                for chunk in stream_response:
                    try:
                        # Handle different chunk formats
                        if hasattr(chunk, 'data') and chunk.data:
                            # Convert chunk data to dict if it has __dict__
                            if hasattr(chunk.data, '__dict__'):
                                chunk_dict = chunk.data.__dict__
                            else:
                                chunk_dict = chunk.data
                            
                            # Only yield if there's actual data
                            if chunk_dict:
                                yield f"data: {json.dumps(chunk_dict, default=str)}\n\n"
                        
                        elif hasattr(chunk, '__dict__'):
                            # If the chunk itself has data
                            chunk_dict = chunk.__dict__
                            if chunk_dict:
                                yield f"data: {json.dumps(chunk_dict, default=str)}\n\n"
                    
                    except Exception as chunk_error:
                        error_data = {'error': f'Error processing chunk: {str(chunk_error)}'}
                        yield f"data: {json.dumps(error_data)}\n\n"
                
            except Exception as e:
                error_data = {'error': f'Error in stream: {str(e)}'}
                yield f"data: {json.dumps(error_data)}\n\n"
        
        # Return Server-Sent Events response
        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'  # Disable nginx buffering
            }
        )
        
    except Exception as error:
        print(f'Error in run: {error}')
        return {'message': f'Error in run: {str(error)}'}, 500


@langgraph_bp.route('/run-threadless', methods=['POST'])
def run_agent_threadless():
    """
    Stream response from LangGraph agent using threadless run (simpler for testing).
    
    Expected JSON payload:
    {
        "question": "string",
        "databaseUuid": "string" (optional)
    }
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return {'message': 'No JSON data provided'}, 400
            
        question = data.get('question')
        database_uuid = data.get('databaseUuid')
        
        # Debug: Log the incoming request
        print(f"🔍 DEBUG /run-threadless endpoint:")
        print(f"   Received data: {data}")
        print(f"   Question: {question}")
        print(f"   Database UUID from request: {database_uuid}")
        
        if not question:
            return {'message': 'Question is required'}, 400
        
        # Default database UUID
        default_database_uuid = '921c838c-541d-4361-8c96-70cb23abd9f5'
        
        # Use the uploaded UUID or fall back to default
        final_uuid = database_uuid if database_uuid else default_database_uuid
        print(f"   Using final UUID: {final_uuid}")
        
        # Get environment variables
        api_key = os.environ.get('LANGSMITH_API_KEY')
        api_url = os.environ.get('LANGGRAPH_API_URL')
        
        if not api_url:
            return {'message': 'LANGGRAPH_API_URL environment variable not set'}, 500
        
        # Initialize LangGraph sync client
        client = get_sync_client(api_key=api_key, url=api_url)
        
        # Define synchronous generator for threadless run
        def generate():
            try:
                # Prepare input data
                input_data = {
                    'question': question,
                    'uuid': final_uuid
                }
                
                print(f"   Sending to LangGraph (threadless): {input_data}")
                
                # Use threadless run (None as thread_id) - simpler for testing
                stream_response = client.runs.stream(
                    thread_id=None,  # Threadless run
                    assistant_id='agent',
                    input=input_data,
                    stream_mode='updates'
                )
                
                # Process the stream
                for chunk in stream_response:
                    try:
                        # Handle different chunk formats
                        if hasattr(chunk, 'data') and chunk.data is not None:
                            # Convert chunk data to dict if it has __dict__
                            if hasattr(chunk.data, '__dict__'):
                                chunk_dict = chunk.data.__dict__
                            else:
                                chunk_dict = chunk.data
                            
                            # Only yield if there's actual data
                            if chunk_dict:
                                yield f"data: {json.dumps(chunk_dict, default=str)}\n\n"
                        
                        elif hasattr(chunk, '__dict__'):
                            # If the chunk itself has data
                            chunk_dict = chunk.__dict__
                            if chunk_dict:
                                yield f"data: {json.dumps(chunk_dict, default=str)}\n\n"
                    
                    except Exception as chunk_error:
                        error_data = {'error': f'Error processing chunk: {str(chunk_error)}'}
                        yield f"data: {json.dumps(error_data)}\n\n"
                
            except Exception as e:
                error_data = {'error': f'Error in threadless stream: {str(e)}'}
                yield f"data: {json.dumps(error_data)}\n\n"
        
        # Return Server-Sent Events response
        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )
        
    except Exception as error:
        print(f'Error in threadless run: {error}')
        return {'message': f'Error in threadless run: {str(error)}'}, 500


@langgraph_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for LangGraph integration.
    """
    api_key = os.environ.get('LANGSMITH_API_KEY')
    api_url = os.environ.get('LANGGRAPH_API_URL')
    
    status = {
        'langgraph_configured': bool(api_key and api_url),
        'api_key_set': bool(api_key),
        'api_url_set': bool(api_url)
    }
    
    return status, 200


@langgraph_bp.route('/assistants', methods=['GET'])
def list_assistants():
    """
    List available assistants for debugging.
    """
    try:
        api_key = os.environ.get('LANGSMITH_API_KEY')
        api_url = os.environ.get('LANGGRAPH_API_URL')
        
        if not api_url:
            return {'message': 'LANGGRAPH_API_URL environment variable not set'}, 500
        
        # Initialize LangGraph sync client
        client = get_sync_client(api_key=api_key, url=api_url)
        
        # List assistants
        assistants = client.assistants.search()
        return {'assistants': assistants}, 200
        
    except Exception as error:
        return {'message': f'Error listing assistants: {str(error)}'}, 500