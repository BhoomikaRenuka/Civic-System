#!/usr/bin/env python3
"""
Test admin endpoint directly
"""

import requests
import json

API_BASE = 'http://localhost:5000'

def test_admin_login_and_reports():
    """Test admin login and reports"""
    try:
        # First login as admin
        print("1. Testing admin login...")
        response = requests.post(f'{API_BASE}/login', json={
            'email': 'admin@civicreport.com',
            'password': 'admin123'
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data['access_token']
            print(f"✅ Admin login successful: {data['user']['name']}")
            
            # Test admin reports endpoint
            print("\n2. Testing admin reports endpoint...")
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f'{API_BASE}/admin/reports', headers=headers)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Admin reports working: {len(data['issues'])} issues found")
                return True
            else:
                print(f"❌ Admin reports failed: {response.status_code}")
                return False
        else:
            print(f"❌ Admin login failed: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_staff_endpoint():
    """Test staff endpoint"""
    try:
        # Login as staff
        print("\n3. Testing staff login...")
        response = requests.post(f'{API_BASE}/login', json={
            'email': 'road.staff@civicreport.com',
            'password': 'road123'
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data['access_token']
            print(f"✅ Staff login successful: {data['user']['name']}")
            
            # Test staff reports endpoint
            print("\n4. Testing staff reports endpoint...")
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f'{API_BASE}/staff/reports', headers=headers)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Staff reports working: {len(data['issues'])} issues found")
                return True
            else:
                print(f"❌ Staff reports failed: {response.status_code}")
                return False
        else:
            print(f"❌ Staff login failed: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Testing Admin and Staff Endpoints")
    print("=" * 50)
    
    admin_working = test_admin_login_and_reports()
    staff_working = test_staff_endpoint()
    
    print("\n" + "=" * 50)
    print("SUMMARY:")
    print(f"Admin Endpoint: {'✅ Working' if admin_working else '❌ Failed'}")
    print(f"Staff Endpoint: {'✅ Working' if staff_working else '❌ Failed'}")
