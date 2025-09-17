from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from bson import ObjectId
from datetime import datetime, timedelta
import os
import uuid
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Email configuration
EMAIL_CONFIG = {
    'SMTP_SERVER': 'smtp.gmail.com',
    'SMTP_PORT': 587,
    'EMAIL_ADDRESS': 'civicreport.system@gmail.com',  # Replace with your email
    'EMAIL_PASSWORD': 'your-app-password',  # Replace with your app password
    'USE_TLS': True
}
app.config['UPLOAD_FOLDER'] = 'uploads'

# Initialize extensions
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

def initialize_database():
    """Initialize MongoDB connection and create necessary indexes"""
    try:
        # MongoDB connection with timeout
        client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Get database and collections (automatically created if they don't exist)
        db = client['civic_issues']
        users_collection = db['users']
        issues_collection = db['issues']
        notifications_collection = db['notifications']
        
        # Create indexes for better performance (only created if they don't exist)
        try:
            # User collection indexes
            users_collection.create_index([("email", ASCENDING)], unique=True, background=True)
            users_collection.create_index([("role", ASCENDING)], background=True)
            
            # Issues collection indexes
            issues_collection.create_index([("user_id", ASCENDING)], background=True)
            issues_collection.create_index([("status", ASCENDING)], background=True)
            issues_collection.create_index([("category", ASCENDING)], background=True)
            issues_collection.create_index([("created_at", DESCENDING)], background=True)
            issues_collection.create_index([("location.address", "text")], background=True)
            
            # Notifications collection indexes
            notifications_collection.create_index([("user_id", ASCENDING)], background=True)
            notifications_collection.create_index([("read", ASCENDING)], background=True)
            notifications_collection.create_index([("created_at", DESCENDING)], background=True)
            print("✅ Database indexes created/verified")
            
        except Exception as e:
            print(f"⚠️  Index creation warning: {e}")
        
        return client, db, users_collection, issues_collection, notifications_collection
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("Please ensure MongoDB is running on localhost:27017")
        raise
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        raise

# Initialize database connection
try:
    client, db, users_collection, issues_collection, notifications_collection = initialize_database()
except Exception as e:
    print("Failed to initialize database. Exiting...")
    exit(1)

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Email sending function
def send_email_notification(to_email, subject, body):
    """Send email notification in a separate thread"""
    def send_email():
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = EMAIL_CONFIG['EMAIL_ADDRESS']
            msg['To'] = to_email
            msg['Subject'] = subject

            # Add body to email
            msg.attach(MIMEText(body, 'html'))

            # Create SMTP session
            server = smtplib.SMTP(EMAIL_CONFIG['SMTP_SERVER'], EMAIL_CONFIG['SMTP_PORT'])
            if EMAIL_CONFIG['USE_TLS']:
                server.starttls()  # Enable security

            # Login with sender's email and password
            server.login(EMAIL_CONFIG['EMAIL_ADDRESS'], EMAIL_CONFIG['EMAIL_PASSWORD'])

            # Send email
            text = msg.as_string()
            server.sendmail(EMAIL_CONFIG['EMAIL_ADDRESS'], to_email, text)
            server.quit()

            print(f"✅ Email sent successfully to {to_email}")

        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")

    # Send email in background thread
    email_thread = threading.Thread(target=send_email)
    email_thread.daemon = True
    email_thread.start()

# Authentication Routes
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        role = data.get('role', 'user')  # Allow role specification
        category = data.get('category')  # For staff users

        if not email or not password or not name:
            return jsonify({'error': 'Missing required fields'}), 400

        # Validate role
        if role not in ['user', 'admin', 'staff']:
            return jsonify({'error': 'Invalid role'}), 400

        # For staff, category is required
        if role == 'staff' and not category:
            return jsonify({'error': 'Category is required for staff users'}), 400

        # Check if user already exists
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'User already exists'}), 400

        # Hash password and create user
        hashed_password = generate_password_hash(password)
        user_data = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'role': role,
            'created_at': datetime.utcnow()
        }

        # Add category for staff users
        if role == 'staff':
            user_data['category'] = category

        result = users_collection.insert_one(user_data)

        # Create JWT token with additional claims
        additional_claims = {'role': role}
        if role == 'staff':
            additional_claims['category'] = category

        access_token = create_access_token(
            identity=str(result.inserted_id),
            additional_claims=additional_claims
        )

        user_response = {
            'id': str(result.inserted_id),
            'name': name,
            'email': email,
            'role': role
        }

        if role == 'staff':
            user_response['category'] = category

        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user_response
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        user = users_collection.find_one({'email': email})
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Create JWT token with additional claims
        additional_claims = {'role': user['role']}
        if user['role'] == 'staff' and 'category' in user:
            additional_claims['category'] = user['category']

        access_token = create_access_token(
            identity=str(user['_id']),
            additional_claims=additional_claims
        )

        user_response = {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }

        # Add category for staff users
        if user['role'] == 'staff' and 'category' in user:
            user_response['category'] = user['category']

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user_response
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Issue Reporting Routes
@app.route('/report', methods=['POST'])
@jwt_required()
def submit_report():
    try:
        user_id = get_jwt_identity()
        
        # Handle file upload
        image_filename = None
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                image_filename = unique_filename
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        category = request.form.get('category')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        address = request.form.get('address')
        
        if not title or not description or not category:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create issue document
        issue_data = {
            'user_id': user_id,
            'title': title,
            'description': description,
            'category': category,
            'status': 'Pending',
            'image': image_filename,
            'location': {
                'latitude': float(latitude) if latitude else None,
                'longitude': float(longitude) if longitude else None,
                'address': address
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = issues_collection.insert_one(issue_data)
        issue_data['_id'] = str(result.inserted_id)
        
        # Get user info for broadcast
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        issue_data['user_name'] = user['name']
        
        # Notify only admins about new issue
        try:
            socketio.emit('notification', {
                'title': 'New Issue Reported',
                'message': f"New issue reported by {user['name']}: {title}",
                'type': 'new_issue',
                'issue_id': str(result.inserted_id),
                'status': 'Pending',
                'created_at': issue_data['created_at'].isoformat()
            }, room='admins')
            print("Admin notification emitted to room 'admins'")
        except Exception as e:
            print(f"Failed to emit admin notification: {e}")
        
        return jsonify({
            'message': 'Issue reported successfully',
            'issue_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/myreports', methods=['GET'])
@jwt_required()
def get_my_reports():
    try:
        user_id = get_jwt_identity()
        issues = list(issues_collection.find({'user_id': user_id}).sort('created_at', -1))
        
        # Convert ObjectId to string and format dates
        for issue in issues:
            issue['_id'] = str(issue['_id'])
            issue['created_at'] = issue['created_at'].isoformat()
            issue['updated_at'] = issue['updated_at'].isoformat()
        
        return jsonify({'issues': issues}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/issues', methods=['GET'])
def get_all_issues():
    try:
        # Get query parameters for filtering
        category = request.args.get('category')
        status = request.args.get('status')
        
        # Build query
        query = {}
        if category:
            query['category'] = category
        if status:
            query['status'] = status
        
        issues = list(issues_collection.find(query).sort('created_at', -1))
        
        # Add user names and format data
        for issue in issues:
            user = users_collection.find_one({'_id': ObjectId(issue['user_id'])})
            issue['user_name'] = user['name'] if user else 'Unknown'
            issue['_id'] = str(issue['_id'])
            issue['created_at'] = issue['created_at'].isoformat()
            issue['updated_at'] = issue['updated_at'].isoformat()
        
        return jsonify({'issues': issues}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Staff Routes
@app.route('/staff/reports', methods=['GET'])
@jwt_required()
def get_staff_reports():
    try:
        from flask_jwt_extended import get_jwt

        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        user_category = claims.get('category')

        # Verify staff access
        if user_role != 'staff':
            return jsonify({'error': 'Staff access required'}), 403

        if not user_category:
            return jsonify({'error': 'Staff category not found'}), 403

        # Get query parameters
        status = request.args.get('status')
        location = request.args.get('location')

        # Build query - filter by staff category
        query = {'category': user_category}
        if status:
            query['status'] = status
        if location:
            query['location.address'] = {'$regex': location, '$options': 'i'}

        issues = list(issues_collection.find(query).sort('created_at', -1))

        # Add user names and format data
        for issue in issues:
            user = users_collection.find_one({'_id': ObjectId(issue['user_id'])})
            issue['user_name'] = user['name'] if user else 'Unknown'
            issue['user_email'] = user['email'] if user else 'Unknown'
            issue['_id'] = str(issue['_id'])
            issue['created_at'] = issue['created_at'].isoformat()
            issue['updated_at'] = issue['updated_at'].isoformat()

        return jsonify({
            'issues': issues,
            'category': user_category,
            'total_count': len(issues)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/staff/update', methods=['POST'])
@jwt_required()
def staff_update_issue_status():
    try:
        from flask_jwt_extended import get_jwt

        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        user_category = claims.get('category')

        # Verify staff access
        if user_role != 'staff':
            return jsonify({'error': 'Staff access required'}), 403

        data = request.get_json()
        issue_id = data.get('issue_id')
        new_status = data.get('status')

        if not issue_id or not new_status:
            return jsonify({'error': 'Missing issue_id or status'}), 400

        if new_status not in ['Pending', 'In Progress', 'Resolved']:
            return jsonify({'error': 'Invalid status'}), 400

        # Get the issue first to verify category access
        issue = issues_collection.find_one({'_id': ObjectId(issue_id)})
        if not issue:
            return jsonify({'error': 'Issue not found'}), 404

        # Verify staff can only update issues in their category
        if issue['category'] != user_category:
            return jsonify({'error': 'Access denied: Issue not in your category'}), 403

        # Update issue
        result = issues_collection.update_one(
            {'_id': ObjectId(issue_id)},
            {
                '$set': {
                    'status': new_status,
                    'updated_at': datetime.utcnow(),
                    'updated_by': user_id,
                    'updated_by_role': 'staff'
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Issue not found'}), 404

        # Get updated issue for broadcast
        updated_issue = issues_collection.find_one({'_id': ObjectId(issue_id)})
        issue_user = users_collection.find_one({'_id': ObjectId(updated_issue['user_id'])})
        staff_user = users_collection.find_one({'_id': ObjectId(user_id)})

        # Create notification for the issue reporter
        notification = {
            'user_id': updated_issue['user_id'],
            'type': 'issue_status',
            'title': 'Issue Status Updated',
            'message': f"Your issue '{updated_issue['title']}' is now {new_status} (Updated by {staff_user['name']} - {user_category} Staff)",
            'issue_id': issue_id,
            'status': new_status,
            'read': False,
            'created_at': datetime.utcnow()
        }
        notifications_collection.insert_one(notification)

        # Send email notification to the issue reporter
        if issue_user and issue_user.get('email'):
            email_subject = f"Issue Status Update - {updated_issue['title']}"
            email_body = f"""
            <html>
            <body>
                <h2>Your Civic Issue Status Has Been Updated</h2>
                <p>Dear {issue_user['name']},</p>

                <p>We wanted to inform you that the status of your reported issue has been updated:</p>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3>Issue Details:</h3>
                    <p><strong>Title:</strong> {updated_issue['title']}</p>
                    <p><strong>New Status:</strong> <span style="color: #007bff; font-weight: bold;">{new_status}</span></p>
                    <p><strong>Updated by:</strong> {staff_user['name']} ({user_category} Department)</p>
                    <p><strong>Date:</strong> {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>

                <p>Thank you for helping improve our community by reporting this issue.</p>

                <p>Best regards,<br>
                Civic Issue Reporting System</p>
            </body>
            </html>
            """
            send_email_notification(issue_user['email'], email_subject, email_body)

        # Broadcast status update
        socketio.emit('status_update', {
            'issue_id': issue_id,
            'status': new_status,
            'title': updated_issue['title'],
            'user_name': issue_user['name'] if issue_user else 'Unknown',
            'updated_by': f"{staff_user['name']} ({user_category} Staff)"
        })

        # Emit user-targeted notification
        try:
            room_name = f"user_{updated_issue['user_id']}"
            socketio.emit('user_notification', {
                'title': updated_issue['title'],
                'message': f"Your issue '{updated_issue['title']}' status has been updated to: {new_status}",
                'type': 'issue_status',
                'issue_id': issue_id,
                'status': new_status,
                'updated_by': f"{staff_user['name']} ({user_category} Staff)",
                'created_at': datetime.utcnow().isoformat()
            }, room=room_name)

            # Also emit to all users (for the user's dashboard)
            socketio.emit('user_notification', {
                'title': updated_issue['title'],
                'message': f"Your issue '{updated_issue['title']}' status has been updated to: {new_status}",
                'type': 'issue_status',
                'issue_id': issue_id,
                'status': new_status,
                'user_id': updated_issue['user_id'],
                'updated_by': f"{staff_user['name']} ({user_category} Staff)",
                'created_at': datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Failed to emit user notification: {e}")

        return jsonify({'message': 'Status updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin Routes
@app.route('/admin/reports', methods=['GET'])
@jwt_required()
def get_admin_reports():
    try:
        user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters
        category = request.args.get('category')
        status = request.args.get('status')
        location = request.args.get('location')
        
        # Build query
        query = {}
        if category:
            query['category'] = category
        if status:
            query['status'] = status
        if location:
            query['location.address'] = {'$regex': location, '$options': 'i'}
        
        issues = list(issues_collection.find(query).sort('created_at', -1))
        
        # Add user names and format data
        for issue in issues:
            user = users_collection.find_one({'_id': ObjectId(issue['user_id'])})
            issue['user_name'] = user['name'] if user else 'Unknown'
            issue['user_email'] = user['email'] if user else 'Unknown'
            issue['_id'] = str(issue['_id'])
            issue['created_at'] = issue['created_at'].isoformat()
            issue['updated_at'] = issue['updated_at'].isoformat()
        
        return jsonify({'issues': issues}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/update', methods=['POST'])
@jwt_required()
def update_issue_status():
    try:
        user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        issue_id = data.get('issue_id')
        new_status = data.get('status')
        
        if not issue_id or not new_status:
            return jsonify({'error': 'Missing issue_id or status'}), 400
        
        if new_status not in ['Pending', 'In Progress', 'Resolved']:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Update issue
        result = issues_collection.update_one(
            {'_id': ObjectId(issue_id)},
            {
                '$set': {
                    'status': new_status,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Issue not found'}), 404
        
        # Get updated issue for broadcast
        issue = issues_collection.find_one({'_id': ObjectId(issue_id)})
        issue_user = users_collection.find_one({'_id': ObjectId(issue['user_id'])})
        
        # Create notification for the issue reporter
        notification = {
            'user_id': issue['user_id'],
            'type': 'issue_status',
            'title': 'Issue Status Updated',
            'message': f"Your issue '{issue['title']}' is now {new_status}",
            'issue_id': issue_id,
            'status': new_status,
            'read': False,
            'created_at': datetime.utcnow()
        }
        notifications_collection.insert_one(notification)

        # Send email notification to the issue reporter
        if issue_user and issue_user.get('email'):
            email_subject = f"Issue Status Update - {issue['title']}"
            email_body = f"""
            <html>
            <body>
                <h2>Your Civic Issue Status Has Been Updated</h2>
                <p>Dear {issue_user['name']},</p>

                <p>We wanted to inform you that the status of your reported issue has been updated:</p>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3>Issue Details:</h3>
                    <p><strong>Title:</strong> {issue['title']}</p>
                    <p><strong>New Status:</strong> <span style="color: #007bff; font-weight: bold;">{new_status}</span></p>
                    <p><strong>Updated by:</strong> {user['name']} (Administrator)</p>
                    <p><strong>Date:</strong> {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>

                <p>Thank you for helping improve our community by reporting this issue.</p>

                <p>Best regards,<br>
                Civic Issue Reporting System</p>
            </body>
            </html>
            """
            send_email_notification(issue_user['email'], email_subject, email_body)

        # Broadcast status update globally (for admins/dashboards)
        socketio.emit('status_update', {
            'issue_id': issue_id,
            'status': new_status,
            'title': issue['title'],
            'user_name': issue_user['name'] if issue_user else 'Unknown'
        })

        # Emit user-targeted notification to the reporter's room
        try:
            room_name = f"user_{issue['user_id']}"
            socketio.emit('user_notification', {
                'title': issue['title'],
                'message': f"Your issue '{issue['title']}' status has been updated to: {new_status}",
                'type': 'issue_status',
                'issue_id': issue_id,
                'status': new_status,
                'updated_by': f"{user['name']} (Administrator)",
                'created_at': datetime.utcnow().isoformat()
            }, room=room_name)

            # Also emit to all users (for the user's dashboard)
            socketio.emit('user_notification', {
                'title': issue['title'],
                'message': f"Your issue '{issue['title']}' status has been updated to: {new_status}",
                'type': 'issue_status',
                'issue_id': issue_id,
                'status': new_status,
                'user_id': issue['user_id'],
                'updated_by': f"{user['name']} (Administrator)",
                'created_at': datetime.utcnow().isoformat()
            })
            print(f"User notification emitted for issue {issue_id}")
        except Exception as e:
            print(f"Failed to emit user notification: {e}")
        
        return jsonify({'message': 'Status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Notification Routes
@app.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        user_id = get_jwt_identity()
        limit = int(request.args.get('limit', '20'))
        notifications = list(
            notifications_collection.find({'user_id': user_id}).sort('created_at', -1).limit(limit)
        )
        for n in notifications:
            n['_id'] = str(n['_id'])
            n['created_at'] = n['created_at'].isoformat()
        unread_count = notifications_collection.count_documents({'user_id': user_id, 'read': False})
        return jsonify({'notifications': notifications, 'unread_count': unread_count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/notifications/mark-read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        notification_ids = data.get('ids')
        query = {'user_id': user_id, 'read': False}
        if notification_ids and isinstance(notification_ids, list):
            try:
                object_ids = [ObjectId(nid) for nid in notification_ids]
                query['_id'] = {'$in': object_ids}
            except Exception:
                return jsonify({'error': 'Invalid notification id in ids'}), 400
        result = notifications_collection.update_many(query, {'$set': {'read': True}})
        return jsonify({'updated': result.modified_count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify database connectivity"""
    try:
        # Test database connection
        client.admin.command('ping')
        
        # Get collection stats
        users_count = users_collection.count_documents({})
        issues_count = issues_collection.count_documents({})
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'collections': {
                'users': users_count,
                'issues': issues_count
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'message': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_room')
def handle_join_room(data):
    room = data['room']
    join_room(room)
    print(f"Client joined room: {room}")
    emit('joined_room', {'room': room})

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data['room']
    leave_room(room)
    emit('left_room', {'room': room})

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
