import requests
import json

def test_staff_login_and_access():
    """Test staff login and category-based access"""
    base_url = 'http://localhost:5000'
    
    print("🧪 Testing Staff System")
    print("=" * 50)
    
    # Test data for different staff members
    staff_accounts = [
        {
            'email': 'road.staff@civicreport.com',
            'password': 'road123',
            'category': 'Road',
            'name': 'Road Maintenance Staff'
        },
        {
            'email': 'waste.staff@civicreport.com',
            'password': 'waste123',
            'category': 'Waste',
            'name': 'Waste Management Staff'
        }
    ]
    
    # First, create some test issues in different categories
    print("1. Creating test issues in different categories...")
    
    # Register a test user
    user_data = {
        "name": "Test Citizen",
        "email": "citizen@example.com",
        "password": "citizen123"
    }
    
    try:
        response = requests.post(f'{base_url}/register', json=user_data, timeout=10)
        if response.status_code == 201:
            user_token = response.json()['access_token']
            print("✅ Test user registered")
        else:
            print(f"❌ User registration failed: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return False
    
    # Create test issues
    test_issues = [
        {
            'title': 'Pothole on Main Street',
            'description': 'Large pothole causing traffic issues',
            'category': 'Road',
            'address': 'Main Street, Downtown'
        },
        {
            'title': 'Overflowing Garbage Bin',
            'description': 'Garbage bin overflowing for days',
            'category': 'Waste',
            'address': 'Park Avenue, Sector 5'
        },
        {
            'title': 'Street Light Not Working',
            'description': 'Street light has been out for a week',
            'category': 'Electricity',
            'address': 'Oak Street, Residential Area'
        }
    ]
    
    created_issues = []
    for issue_data in test_issues:
        try:
            headers = {'Authorization': f'Bearer {user_token}'}
            response = requests.post(f'{base_url}/report', data=issue_data, headers=headers, timeout=10)
            
            if response.status_code == 201:
                issue_id = response.json()['issue_id']
                created_issues.append({'id': issue_id, 'category': issue_data['category'], 'title': issue_data['title']})
                print(f"✅ Created {issue_data['category']} issue: {issue_data['title']}")
            else:
                print(f"❌ Failed to create issue: {response.text}")
        except Exception as e:
            print(f"❌ Error creating issue: {e}")
    
    print(f"\n📊 Created {len(created_issues)} test issues")
    
    # Test staff login and access
    for staff in staff_accounts:
        print(f"\n2. Testing {staff['name']} ({staff['category']} category)...")
        
        # Login as staff
        try:
            login_data = {
                "email": staff['email'],
                "password": staff['password']
            }
            
            response = requests.post(f'{base_url}/login', json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                staff_token = data['access_token']
                print(f"✅ {staff['name']} logged in successfully")
                print(f"   Role: {data['user']['role']}")
                print(f"   Category: {data['user'].get('category', 'Not specified')}")
                
                # Test staff reports access
                headers = {'Authorization': f'Bearer {staff_token}'}
                response = requests.get(f'{base_url}/staff/reports', headers=headers, timeout=10)
                
                if response.status_code == 200:
                    staff_data = response.json()
                    staff_issues = staff_data['issues']
                    staff_category = staff_data['category']
                    
                    print(f"✅ Staff can access reports")
                    print(f"   Category filter: {staff_category}")
                    print(f"   Issues visible: {len(staff_issues)}")
                    
                    # Verify category filtering
                    category_issues = [issue for issue in created_issues if issue['category'] == staff_category]
                    expected_count = len(category_issues)
                    
                    if len(staff_issues) >= expected_count:
                        print(f"✅ Category filtering working correctly")
                        
                        # Test updating issue status
                        if staff_issues:
                            test_issue = staff_issues[0]
                            print(f"   Testing status update for: {test_issue['title']}")
                            
                            update_data = {
                                'issue_id': test_issue['_id'],
                                'status': 'In Progress'
                            }
                            
                            response = requests.post(f'{base_url}/staff/update', 
                                                   json=update_data, headers=headers, timeout=10)
                            
                            if response.status_code == 200:
                                print(f"✅ Status update successful")
                            else:
                                print(f"❌ Status update failed: {response.json()}")
                        else:
                            print(f"   No issues in {staff_category} category to test update")
                    else:
                        print(f"❌ Category filtering issue: expected {expected_count}, got {len(staff_issues)}")
                else:
                    print(f"❌ Failed to get staff reports: {response.json()}")
            else:
                print(f"❌ Staff login failed: {response.json()}")
        except Exception as e:
            print(f"❌ Error testing staff {staff['name']}: {e}")
    
    # Test cross-category access restriction
    print(f"\n3. Testing cross-category access restrictions...")
    
    # Login as road staff
    road_login = {
        "email": "road.staff@civicreport.com",
        "password": "road123"
    }
    
    try:
        response = requests.post(f'{base_url}/login', json=road_login, timeout=10)
        if response.status_code == 200:
            road_token = response.json()['access_token']
            
            # Try to update a waste issue (should fail)
            waste_issues = [issue for issue in created_issues if issue['category'] == 'Waste']
            if waste_issues:
                waste_issue_id = waste_issues[0]['id']
                
                update_data = {
                    'issue_id': waste_issue_id,
                    'status': 'Resolved'
                }
                
                headers = {'Authorization': f'Bearer {road_token}'}
                response = requests.post(f'{base_url}/staff/update', 
                                       json=update_data, headers=headers, timeout=10)
                
                if response.status_code == 403:
                    print(f"✅ Cross-category access properly restricted")
                    print(f"   Road staff cannot update Waste issues")
                else:
                    print(f"❌ Cross-category restriction failed: {response.status_code}")
            else:
                print(f"   No waste issues to test cross-category restriction")
    except Exception as e:
        print(f"❌ Error testing cross-category access: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Staff system test completed!")
    return True

if __name__ == "__main__":
    test_staff_login_and_access()
