#!/usr/bin/env python3
"""
Simple CORS test script to verify server configuration.
"""
import requests

def test_cors():
    """Test CORS configuration with credentials."""
    print("Testing CORS configuration...")
    
    # Test health endpoint
    try:
        response = requests.get('http://localhost:5000/health')
        print(f"✅ Health endpoint: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
    
    # Test auth check endpoint  
    try:
        response = requests.get('http://localhost:5000/api/auth/check')
        print(f"✅ Auth check endpoint: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"❌ Auth check endpoint failed: {e}")

if __name__ == "__main__":
    test_cors()