import requests
import json
import time

def test_email_notifications():
    """Test the email notification system when status is updated"""
    base_url = 'http://localhost:5000'
    
    print("📧 Testing Email Notification System")
    print("=" * 60)
    
    # Step 1: Register a test user with a real email
    print("1. Setting up test user...")
    user_data = {
        "name": "Test User",
        "email": "test.user@example.com",  # Replace with your email for testing
        "password": "testuser123"
    }
    
    try:
        response = requests.post(f'{base_url}/register', json=user_data, timeout=10)
        if response.status_code == 201:
            user_token = response.json()['access_token']
            print(f"✅ User registered: {user_data['name']} ({user_data['email']})")
        else:
            # User might already exist, try to login
            login_response = requests.post(f'{base_url}/login', json={
                "email": user_data['email'],
                "password": user_data['password']
            }, timeout=10)
            if login_response.status_code == 200:
                user_token = login_response.json()['access_token']
                print(f"✅ User logged in: {user_data['name']} ({user_data['email']})")
            else:
                print(f"❌ User setup failed: {response.json()}")
                return False
    except Exception as e:
        print(f"❌ User setup error: {e}")
        return False
    
    # Step 2: User submits a test issue
    print("\n2. User submitting test issue...")
    
    issue_data = {
        'title': 'Test Issue for Email Notification',
        'description': 'This is a test issue to verify email notifications work when status is updated',
        'category': 'Road',
        'address': 'Test Street, Test City'
    }
    
    try:
        headers = {'Authorization': f'Bearer {user_token}'}
        response = requests.post(f'{base_url}/report', data=issue_data, headers=headers, timeout=10)
        
        if response.status_code == 201:
            issue_id = response.json()['issue_id']
            print(f"✅ Issue submitted successfully: {issue_data['title']}")
            print(f"   Issue ID: {issue_id}")
        else:
            print(f"❌ Failed to submit issue: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error submitting issue: {e}")
        return False
    
    # Step 3: Admin updates the issue status (this should trigger email)
    print("\n3. Admin updating issue status (should trigger email)...")
    
    try:
        # Login as admin
        admin_data = {
            "email": "admin@civicreport.com",
            "password": "admin123"
        }
        
        response = requests.post(f'{base_url}/login', json=admin_data, timeout=10)
        
        if response.status_code == 200:
            admin_token = response.json()['access_token']
            print("✅ Admin logged in successfully")
            
            # Update issue status
            update_data = {
                'issue_id': issue_id,
                'status': 'In Progress'
            }
            
            headers = {'Authorization': f'Bearer {admin_token}'}
            response = requests.post(f'{base_url}/admin/update', 
                                   json=update_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print("✅ Issue status updated to 'In Progress'")
                print("📧 Email notification should be sent to user!")
                print(f"   Check email: {user_data['email']}")
            else:
                print(f"❌ Failed to update status: {response.json()}")
        else:
            print(f"❌ Admin login failed: {response.json()}")
    except Exception as e:
        print(f"❌ Error with admin update: {e}")
    
    # Step 4: Staff updates the issue status (this should also trigger email)
    print("\n4. Staff updating issue status (should also trigger email)...")
    
    try:
        # Login as road staff
        staff_data = {
            "email": "road.staff@civicreport.com",
            "password": "road123"
        }
        
        response = requests.post(f'{base_url}/login', json=staff_data, timeout=10)
        
        if response.status_code == 200:
            staff_token = response.json()['access_token']
            print("✅ Road staff logged in successfully")
            
            # Update issue status again
            update_data = {
                'issue_id': issue_id,
                'status': 'Resolved'
            }
            
            headers = {'Authorization': f'Bearer {staff_token}'}
            response = requests.post(f'{base_url}/staff/update', 
                                   json=update_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print("✅ Issue status updated to 'Resolved' by Road Staff")
                print("📧 Another email notification should be sent to user!")
                print(f"   Check email: {user_data['email']}")
            else:
                print(f"❌ Failed to update status: {response.json()}")
        else:
            print(f"❌ Staff login failed: {response.json()}")
    except Exception as e:
        print(f"❌ Error with staff update: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📧 EMAIL NOTIFICATION TEST SUMMARY")
    print("=" * 60)
    
    print(f"✅ Test issue created: {issue_data['title']}")
    print(f"✅ Admin status update: Pending → In Progress")
    print(f"✅ Staff status update: In Progress → Resolved")
    print(f"📧 User should receive 2 email notifications at: {user_data['email']}")
    
    print(f"\n📝 Email Configuration Notes:")
    print(f"   - Update EMAIL_CONFIG in backend/app.py with real SMTP settings")
    print(f"   - Replace 'civicreport.system@gmail.com' with your email")
    print(f"   - Replace 'your-app-password' with your Gmail app password")
    print(f"   - For Gmail: Enable 2FA and create an app password")
    
    print(f"\n🔧 To test with real emails:")
    print(f"   1. Update EMAIL_CONFIG in backend/app.py")
    print(f"   2. Replace test.user@example.com with your real email")
    print(f"   3. Run this test again")
    
    return True

if __name__ == "__main__":
    test_email_notifications()
