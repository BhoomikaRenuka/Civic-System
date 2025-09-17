import requests
import json

def test_backend_connection():
    """Test if the backend is running and MongoDB is connected"""
    try:
        # Test health endpoint
        response = requests.get('http://localhost:5000/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is running successfully!")
            print(f"📊 Database status: {data.get('database', 'unknown')}")
            print(f"👥 Users in database: {data.get('collections', {}).get('users', 0)}")
            print(f"📝 Issues in database: {data.get('collections', {}).get('issues', 0)}")
            return True
        else:
            print(f"❌ Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:5000")
        print("Make sure the backend is running with: python backend/app.py")
        return False
    except Exception as e:
        print(f"❌ Error testing connection: {e}")
        return False

def test_login():
    """Test login with admin credentials"""
    try:
        login_data = {
            "email": "admin@civicreport.com",
            "password": "admin123"
        }
        
        response = requests.post(
            'http://localhost:5000/login',
            json=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful!")
            print(f"👤 User: {data['user']['name']} ({data['user']['role']})")
            return data['access_token']
        else:
            print(f"❌ Login failed: {response.json().get('error', 'Unknown error')}")
            return None
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return None

if __name__ == "__main__":
    print("🔍 Testing Civic Issue Reporting System Backend...")
    print("=" * 50)
    
    # Test backend connection
    if test_backend_connection():
        print("\n🔐 Testing admin login...")
        token = test_login()
        
        if token:
            print("\n🎉 All tests passed! The system is ready to use.")
            print("\n📱 You can now:")
            print("1. Open the test_frontend.html file in your browser")
            print("2. Login with admin@civicreport.com / admin123")
            print("3. Start reporting and managing civic issues!")
        else:
            print("\n⚠️  Backend is running but login failed.")
    else:
        print("\n💡 Troubleshooting steps:")
        print("1. Make sure MongoDB is running")
        print("2. Start the backend with: python backend/app.py")
        print("3. Check if port 5000 is available")
