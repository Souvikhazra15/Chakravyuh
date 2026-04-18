#!/usr/bin/env python3
"""
Quick test to check if endpoint is reachable
"""

import requests

API_BASE = 'http://127.0.0.1:8000'

# Test 1: Check if API is alive
print("Testing if API is running...")
try:
    response = requests.get(f'{API_BASE}/health', timeout=5)
    print(f"Health check: {response.status_code}")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")

# Test 2: Check FastAPI docs
print("\nFetching Swagger docs to see registered endpoints...")
try:
    response = requests.get(f'{API_BASE}/openapi.json', timeout=5)
    if response.status_code == 200:
        openapi = response.json()
        print(f"\nRegistered paths:")
        for path in sorted(openapi['paths'].keys()):
            print(f"  {path}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Try the analyze endpoint
print("\n\nTesting /api/v1/analyze endpoint...")
try:
    payload = {
        'csv_data': [
            {'school_id': 1, 'category': 'plumbing', 'condition_score': 0.7}
        ]
    }
    response = requests.post(f'{API_BASE}/api/v1/analyze', json=payload, timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
