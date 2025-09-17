import requests
import json

def test_user_registration_and_submission():
    """Test user registration and issue submission"""
    base_url = 'http://localhost:5000'
    
    print("🧪 Testing User Registration and Issue Submission")
    print("=" * 50)
    
    # Step 1: Register a new user
    print("1. Registering a new user...")
    user_data = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f'{base_url}/register', json=user_data, timeout=10)
        if response.status_code == 201:
            data = response.json()
            print("✅ User registered successfully!")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Name: {data['user']['name']}")
            user_token = data['access_token']
        else:
            print(f"❌ Registration failed: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False
    
    # Step 2: Submit an issue
    print("\n2. Submitting an issue...")
    issue_data = {
        'title': 'Test Road Issue',
        'description': 'This is a test road issue for debugging',
        'category': 'Road',
        'address': '123 Test Street, Test City'
    }
    
    try:
        headers = {'Authorization': f'Bearer {user_token}'}
        response = requests.post(f'{base_url}/report', data=issue_data, headers=headers, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Issue submitted successfully!")
            print(f"   Issue ID: {data['issue_id']}")
            return True
        else:
            print(f"❌ Issue submission failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Issue submission error: {e}")
        return False

def test_admin_login():
    """Test admin login"""
    print("\n3. Testing admin login...")
    admin_data = {
        "email": "admin@civicreport.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post('http://localhost:5000/login', json=admin_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful!")
            print(f"   Admin: {data['user']['name']} ({data['user']['role']})")
            return data['access_token']
        else:
            print(f"❌ Admin login failed: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        return None

def test_view_issues(admin_token):
    """Test viewing issues as admin"""
    print("\n4. Testing issue viewing...")
    try:
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.get('http://localhost:5000/admin/reports', headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data['issues'])} issues in database")
            for issue in data['issues']:
                print(f"   - {issue['title']} ({issue['category']}) by {issue['user_name']}")
            return True
        else:
            print(f"❌ Failed to get issues: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting issues: {e}")
        return False

if __name__ == "__main__":
    # Test user registration and submission
    if test_user_registration_and_submission():
        # Test admin functionality
        admin_token = test_admin_login()
        if admin_token:
            test_view_issues(admin_token)
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")
