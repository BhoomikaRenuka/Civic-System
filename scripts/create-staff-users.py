#!/usr/bin/env python3
"""
Create staff users for different categories in the Civic Issue Reporting System
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_staff_users():
    """Create staff users for different categories"""
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['civic_issues']
        users_collection = db['users']
        
        # Staff users data
        staff_users = [
            {
                'name': 'Road Maintenance Staff',
                'email': 'road.staff@civicreport.com',
                'password': 'road123',
                'role': 'staff',
                'category': 'Road'
            },
            {
                'name': 'Street Lighting Staff',
                'email': 'lighting.staff@civicreport.com',
                'password': 'lighting123',
                'role': 'staff',
                'category': 'Electricity'
            },
            {
                'name': 'Waste Management Staff',
                'email': 'waste.staff@civicreport.com',
                'password': 'waste123',
                'role': 'staff',
                'category': 'Waste'
            },
            {
                'name': 'Water Department Staff',
                'email': 'water.staff@civicreport.com',
                'password': 'water123',
                'role': 'staff',
                'category': 'Water'
            },
            {
                'name': 'General Services Staff',
                'email': 'general.staff@civicreport.com',
                'password': 'general123',
                'role': 'staff',
                'category': 'Other'
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for staff_data in staff_users:
            # Check if staff user already exists
            existing_staff = users_collection.find_one({'email': staff_data['email']})
            
            if existing_staff:
                print(f"⚠️  Staff user {staff_data['email']} already exists, updating...")
                # Update existing user
                users_collection.update_one(
                    {'email': staff_data['email']},
                    {
                        '$set': {
                            'name': staff_data['name'],
                            'role': staff_data['role'],
                            'category': staff_data['category'],
                            'updated_at': datetime.utcnow()
                        }
                    }
                )
                updated_count += 1
            else:
                # Create new staff user
                hashed_password = generate_password_hash(staff_data['password'])
                user_document = {
                    'name': staff_data['name'],
                    'email': staff_data['email'],
                    'password': hashed_password,
                    'role': staff_data['role'],
                    'category': staff_data['category'],
                    'created_at': datetime.utcnow()
                }
                
                result = users_collection.insert_one(user_document)
                print(f"✅ Created staff user: {staff_data['name']} ({staff_data['category']})")
                print(f"   Email: {staff_data['email']}")
                print(f"   Password: {staff_data['password']}")
                print(f"   ID: {result.inserted_id}")
                print()
                created_count += 1
        
        print("=" * 60)
        print(f"📊 Staff User Creation Summary:")
        print(f"   Created: {created_count} new staff users")
        print(f"   Updated: {updated_count} existing staff users")
        print()
        
        print("🔑 Staff Login Credentials:")
        print("=" * 60)
        for staff_data in staff_users:
            print(f"📋 {staff_data['category']} Department:")
            print(f"   Email: {staff_data['email']}")
            print(f"   Password: {staff_data['password']}")
            print(f"   Name: {staff_data['name']}")
            print()
        
        print("⚠️  IMPORTANT SECURITY NOTES:")
        print("   1. Change all default passwords after first login!")
        print("   2. These credentials are for development/testing only")
        print("   3. Use strong passwords in production")
        print()
        
        print("🎯 Staff Access Permissions:")
        print("   - Road Staff: Can only view/update Road category issues")
        print("   - Lighting Staff: Can only view/update Electricity category issues")
        print("   - Waste Staff: Can only view/update Waste category issues")
        print("   - Water Staff: Can only view/update Water category issues")
        print("   - General Staff: Can only view/update Other category issues")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating staff users: {e}")
        return False

def verify_staff_creation():
    """Verify that staff users were created correctly"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['civic_issues']
        users_collection = db['users']
        
        # Count staff users by category
        staff_users = list(users_collection.find({'role': 'staff'}))
        
        print("\n🔍 Verification Results:")
        print("=" * 40)
        
        categories = {}
        for staff in staff_users:
            category = staff.get('category', 'Unknown')
            if category not in categories:
                categories[category] = []
            categories[category].append(staff)
        
        for category, staff_list in categories.items():
            print(f"📂 {category}: {len(staff_list)} staff member(s)")
            for staff in staff_list:
                print(f"   - {staff['name']} ({staff['email']})")
        
        print(f"\n📊 Total staff users: {len(staff_users)}")
        client.close()
        
    except Exception as e:
        print(f"❌ Error verifying staff creation: {e}")

if __name__ == "__main__":
    print("🏗️  Creating Staff Users for Civic Issue Reporting System")
    print("=" * 60)
    
    if create_staff_users():
        verify_staff_creation()
        print("\n✅ Staff user creation completed successfully!")
    else:
        print("\n❌ Staff user creation failed!")
        sys.exit(1)
