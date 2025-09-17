#!/usr/bin/env python3
"""
Check what users exist in the system
"""

from pymongo import MongoClient
import bcrypt

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['civic_reporting']
users_collection = db['users']

print("📋 Users in the system:")
print("=" * 50)

users = users_collection.find({})
for user in users:
    print(f"Email: {user['email']}")
    print(f"Name: {user['name']}")
    print(f"Role: {user['role']}")
    if 'category' in user:
        print(f"Category: {user['category']}")
    print("-" * 30)

print("\n🔑 Testing login with admin credentials...")

# Test admin login
admin_user = users_collection.find_one({'email': 'admin@civicreport.com'})
if admin_user:
    print(f"✅ Admin user found: {admin_user['name']}")
    # Test password
    if bcrypt.checkpw('admin123'.encode('utf-8'), admin_user['password']):
        print("✅ Admin password is correct")
    else:
        print("❌ Admin password is incorrect")
else:
    print("❌ Admin user not found")

print("\n🔑 Testing login with staff credentials...")

# Test staff login
staff_user = users_collection.find_one({'email': 'road.staff@civicreport.com'})
if staff_user:
    print(f"✅ Road staff user found: {staff_user['name']}")
    # Test password
    if bcrypt.checkpw('road123'.encode('utf-8'), staff_user['password']):
        print("✅ Road staff password is correct")
    else:
        print("❌ Road staff password is incorrect")
else:
    print("❌ Road staff user not found")

# Create a simple test user with known credentials
print("\n👤 Creating simple test user...")
test_user_data = {
    'name': 'Simple Test User',
    'email': 'simple@test.com',
    'password': bcrypt.hashpw('test123'.encode('utf-8'), bcrypt.gensalt()),
    'phone': '1234567890',
    'role': 'user',
    'created_at': None
}

try:
    # Check if user already exists
    existing = users_collection.find_one({'email': 'simple@test.com'})
    if existing:
        print("✅ Test user already exists: simple@test.com")
    else:
        users_collection.insert_one(test_user_data)
        print("✅ Created test user: simple@test.com / test123")
except Exception as e:
    print(f"❌ Error creating test user: {e}")

print("\n🎯 Use these credentials for testing:")
print("Admin: admin@civicreport.com / admin123")
print("Staff: road.staff@civicreport.com / road123")
print("User: simple@test.com / test123")
