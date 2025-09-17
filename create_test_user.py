#!/usr/bin/env python3
"""
Create a test user for testing the notification system
"""

import requests
import json

API_BASE = 'http://localhost:5000'

def create_test_user():
    """Create a test user account"""
    try:
        user_data = {
            'name': 'Test User',
            'email': 'testuser@example.com',
            'password': 'password123',
            'phone': '1234567890'
        }
        
        response = requests.post(f'{API_BASE}/register', json=user_data)
        
        if response.status_code == 201:
            print(f"✅ Test user created successfully: {user_data['email']}")
            return True
        elif response.status_code == 400 and 'already exists' in response.json().get('error', ''):
            print(f"✅ Test user already exists: {user_data['email']}")
            return True
        else:
            print(f"❌ Failed to create test user: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return False

def test_login():
    """Test login with the test user"""
    try:
        response = requests.post(f'{API_BASE}/login', json={
            'email': 'testuser@example.com',
            'password': 'password123'
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test user login successful: {data['user']['name']}")
            return True
        else:
            print(f"❌ Test user login failed: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Login test error: {e}")
        return False

if __name__ == '__main__':
    print("Creating test user for notification testing...")
    
    if create_test_user():
        if test_login():
            print("\n🎯 Test user ready for notification testing!")
            print("Use: testuser@example.com / password123")
        else:
            print("❌ Test user created but login failed")
    else:
        print("❌ Failed to create test user")
