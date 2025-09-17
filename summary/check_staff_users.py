#!/usr/bin/env python3
"""
Check staff users in database
"""

from pymongo import MongoClient
import json

def check_staff_users():
    """Check all staff users in database"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['civic_reporting']
        users_collection = db['users']
        
        print("🔍 CHECKING STAFF USERS IN DATABASE")
        print("=" * 60)
        
        # Find all users first
        all_users = list(users_collection.find({}))
        print(f"Total users in database: {len(all_users)}")
        print()

        print("ALL USERS:")
        for user in all_users:
            print(f"- {user['name']} ({user['email']}) - Role: {user['role']} - Category: {user.get('category', 'None')}")
        print()

        # Find all staff users
        staff_users = list(users_collection.find({'role': 'staff'}))

        print(f"Found {len(staff_users)} staff users:")
        print()
        
        for user in staff_users:
            print(f"📋 {user['name']}")
            print(f"   Email: {user['email']}")
            print(f"   Role: {user['role']}")
            print(f"   Category: {user.get('category', 'Not set')}")
            print(f"   Password: {user.get('password', 'Not visible')}")
            print()
        
        # Check for missing categories
        categories_needed = ['Road', 'Electricity', 'Waste', 'Water', 'Other']
        existing_categories = [user.get('category') for user in staff_users if user.get('category')]
        
        print("📊 CATEGORY COVERAGE:")
        for cat in categories_needed:
            staff_in_cat = [u for u in staff_users if u.get('category') == cat]
            if staff_in_cat:
                print(f"✅ {cat}: {len(staff_in_cat)} staff member(s)")
                for staff in staff_in_cat:
                    print(f"   - {staff['email']}")
            else:
                print(f"❌ {cat}: No staff assigned")
        
        return staff_users
        
    except Exception as e:
        print(f"❌ Error checking staff users: {e}")
        return []

if __name__ == '__main__':
    check_staff_users()
