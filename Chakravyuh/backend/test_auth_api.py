#!/usr/bin/env python3
"""
Test script to verify Auth API endpoints including user update functionality.
Run the FastAPI backend first: uvicorn app.main:app --host 0.0.0.0 --port 8001
"""

import requests
import json
from typing import Optional

BASE_URL = "http://127.0.0.1:8001"

class AuthAPITester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.headers = {
            "Content-Type": "application/json",
        }
    
    def print_response(self, title: str, response: requests.Response, show_body: bool = True):
        """Pretty print API response"""
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}")
        print(f"Status Code: {response.status_code}")
        try:
            data = response.json()
            if show_body:
                print(f"Response:\n{json.dumps(data, indent=2)}")
            return data
        except:
            print(f"Response: {response.text}")
            return None
    
    def register_user(self, name: str, email: str, password: str, role: str = "peon", school_id: Optional[int] = None):
        """Register a new user"""
        url = f"{BASE_URL}/api/v1/auth/register"
        data = {
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "school_id": school_id
        }
        
        response = requests.post(url, json=data, headers=self.headers)
        result = self.print_response("REGISTER USER", response)
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ Registration successful")
            return result
        else:
            print("❌ Registration failed")
            return None
    
    def login(self, email: str, password: str):
        """Login and get token"""
        url = f"{BASE_URL}/api/v1/auth/login"
        data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(url, json=data, headers=self.headers)
        result = self.print_response("LOGIN", response)
        
        if response.status_code == 200:
            print("✅ Login successful")
            self.token = result.get("access_token")
            self.user_id = result.get("user_id")
            self.headers["Authorization"] = f"Bearer {self.token}"
            return result
        else:
            print("❌ Login failed")
            return None
    
    def get_current_user(self):
        """Get current user info"""
        url = f"{BASE_URL}/api/v1/auth/me"
        
        response = requests.get(url, headers=self.headers)
        result = self.print_response("GET CURRENT USER", response)
        
        if response.status_code == 200:
            print("✅ Retrieved current user info")
            return result
        else:
            print("❌ Failed to get current user")
            return None
    
    def update_user(self, user_id: int, name: Optional[str] = None, role: Optional[str] = None, school_id: Optional[int] = None):
        """Update user information"""
        url = f"{BASE_URL}/api/v1/auth/users/{user_id}"
        data = {}
        
        if name is not None:
            data["name"] = name
        if role is not None:
            data["role"] = role
        if school_id is not None:
            data["school_id"] = school_id
        
        print(f"\n🔄 Updating user {user_id} with: {json.dumps(data, indent=2)}")
        response = requests.put(url, json=data, headers=self.headers)
        result = self.print_response(f"UPDATE USER {user_id}", response)
        
        if response.status_code == 200:
            print("✅ User update successful")
            return result
        else:
            print("❌ User update failed")
            return None
    
    def list_users(self):
        """List all users (principals only)"""
        url = f"{BASE_URL}/api/v1/auth/users"
        
        response = requests.get(url, headers=self.headers)
        result = self.print_response("LIST ALL USERS", response)
        
        if response.status_code == 200:
            print(f"✅ Retrieved {len(result) if isinstance(result, list) else 0} users")
            if isinstance(result, list):
                for user in result:
                    print(f"  - ID: {user.get('id')}, Name: {user.get('name')}, Role: {user.get('role')}, School: {user.get('school_id')}")
            return result
        else:
            print("❌ Failed to list users")
            return None
    
    def get_user(self, user_id: int):
        """Get specific user by ID"""
        url = f"{BASE_URL}/api/v1/auth/users/{user_id}"
        
        response = requests.get(url, headers=self.headers)
        result = self.print_response(f"GET USER {user_id}", response)
        
        if response.status_code == 200:
            print("✅ Retrieved user info")
            return result
        else:
            print("❌ Failed to get user")
            return None


def main():
    """Run API tests"""
    tester = AuthAPITester()
    
    print("\n" + "="*60)
    print("  TESTING AUTH API - USER UPDATE FUNCTIONALITY")
    print("="*60)
    
    # Test 1: Register a new user
    print("\n📝 TEST 1: Register new user")
    reg_result = tester.register_user(
        name="API Test User",
        email="apitest@example.com",
        password="TestPassword123!",
        role="peon",
        school_id=1
    )
    
    if not reg_result:
        print("\n⚠️ Registration failed, testing with login...")
        # Try to login with existing user for testing
        tester.login("admin@school.com", "admin123")
        if tester.token:
            tester.user_id = 1
    else:
        # Login with newly registered user
        test_user_id = reg_result.get("id")
        print("\n🔑 TEST 2: Login with new user")
        tester.login("apitest@example.com", "TestPassword123!")
    
    # Test 2: Get current user
    if tester.token:
        print("\n👤 TEST 3: Get current user info")
        current_user = tester.get_current_user()
        
        # Test 3: Update current user
        print("\n✏️  TEST 4: Update current user")
        print(f"Current user ID: {tester.user_id}")
        updated_user = tester.update_user(
            user_id=tester.user_id,
            name="API Test User Updated",
            role="principal",
            school_id=5
        )
        
        if updated_user:
            print(f"\n✅ User update verified:")
            print(f"   Old Name: API Test User -> New: {updated_user.get('name')}")
            print(f"   Old Role: peon -> New: {updated_user.get('role')}")
            print(f"   Old School: 1 -> New: {updated_user.get('school_id')}")
        
        # Test 4: Get user by ID to verify update
        print("\n🔍 TEST 5: Get user by ID to verify update")
        verified_user = tester.get_user(tester.user_id)
        
        if verified_user:
            if (verified_user.get('name') == "API Test User Updated" and
                verified_user.get('role') == "principal" and
                verified_user.get('school_id') == 5):
                print("✅ ALL UPDATES VERIFIED IN API RESPONSE!")
            else:
                print("❌ Updates don't match")
        
        # Test 5: List users (if principal)
        if verified_user and verified_user.get('role') == 'principal':
            print("\n📋 TEST 6: List all users (principal access)")
            all_users = tester.list_users()
    
    print("\n" + "="*60)
    print("  ✅ API TESTING COMPLETED")
    print("="*60)


if __name__ == "__main__":
    import sys
    
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to FastAPI backend at http://127.0.0.1:8001")
        print("   Please make sure the backend is running:")
        print("   cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8001")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
