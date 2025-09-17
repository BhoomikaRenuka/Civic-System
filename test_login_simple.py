#!/usr/bin/env python3
"""
Simple login test
"""

import requests
import json

API_BASE = 'http://localhost:5000'

def test_admin_login():
    """Test admin login"""
    try:
        response = requests.post(f'{API_BASE}/login', json={
            'email': 'admin@civicreport.com',
            'password': 'admin123'
        })
        
        print(f"Admin login response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            return response.json()['access_token']
        return None
    except Exception as e:
        print(f"Admin login error: {e}")
        return None

def test_staff_login():
    """Test staff login"""
    try:
        response = requests.post(f'{API_BASE}/login', json={
            'email': 'road.staff@civicreport.com',
            'password': 'road123'
        })
        
        print(f"Staff login response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            return response.json()['access_token']
        return None
    except Exception as e:
        print(f"Staff login error: {e}")
        return None

def test_staff_reports(token):
    """Test staff reports endpoint"""
    try:
        response = requests.get(f'{API_BASE}/staff/reports', 
            headers={'Authorization': f'Bearer {token}'}
        )
        
        print(f"Staff reports response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Staff reports error: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Simple Login Test")
    print("=" * 30)
    
    # Test admin login
    print("\n1. Testing Admin Login...")
    admin_token = test_admin_login()
    
    # Test staff login
    print("\n2. Testing Staff Login...")
    staff_token = test_staff_login()
    
    # Test staff functionality
    if staff_token:
        print("\n3. Testing Staff Reports...")
        test_staff_reports(staff_token)
    
    print("\n✅ Login tests completed")
