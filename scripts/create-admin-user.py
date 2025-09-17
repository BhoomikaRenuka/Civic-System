from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['civic_issues']
users_collection = db['users']

# Admin user data
admin_data = {
    'name': 'Admin User',
    'email': 'admin@civicreport.com',
    'password': generate_password_hash('admin123'),  # Change this password in production
    'role': 'admin',
    'created_at': datetime.utcnow()
}

# Check if admin already exists
existing_admin = users_collection.find_one({'email': admin_data['email']})

if existing_admin:
    print(f"Admin user with email {admin_data['email']} already exists")
else:
    # Create admin user
    result = users_collection.insert_one(admin_data)
    print(f"Admin user created successfully with ID: {result.inserted_id}")
    print(f"Email: {admin_data['email']}")
    print("Password: admin123")
    print("\n⚠️  IMPORTANT: Change the default password after first login!")

print("\nAdmin user setup complete!")
