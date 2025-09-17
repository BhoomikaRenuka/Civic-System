from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import uuid
import json

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Initialize extensions
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage (for demonstration - replace with MongoDB in production)
users_db = {}
issues_db = {}
notifications_db = {}

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def initialize_admin_user():
    """Create default admin user"""
    admin_id = str(uuid.uuid4())
    admin_data = {
        'id': admin_id,
        'name': 'Admin User',
        'email': 'admin@civicreport.com',
        'password': generate_password_hash('admin123'),
        'role': 'admin',
        'created_at': datetime.utcnow().isoformat()
    }
    users_db[admin_id] = admin_data
    print("✅ Default admin user created")
    print("Email: admin@civicreport.com")
    print("Password: admin123")

# Initialize admin user
initialize_admin_user()

# Authentication Routes
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        
        if not email or not password or not name:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        for user in users_db.values():
            if user['email'] == email:
                return jsonify({'error': 'User already exists'}), 400
        
        # Hash password and create user
        user_id = str(uuid.uuid4())
        hashed_password = generate_password_hash(password)
        user_data = {
            'id': user_id,
            'name': name,
            'email': email,
            'password': hashed_password,
            'role': 'user',
            'created_at': datetime.utcnow().isoformat()
        }
        
        users_db[user_id] = user_data
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'role': 'user'
            }
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
        
        # Find user by email
        user = None
        for u in users_db.values():
            if u['email'] == email:
                user = u
                break
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user['id'])
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
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
        issue_id = str(uuid.uuid4())
        issue_data = {
            'id': issue_id,
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
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        issues_db[issue_id] = issue_data
        
        # Get user info for broadcast
        user = users_db.get(user_id)
        issue_data['user_name'] = user['name'] if user else 'Unknown'
        
        # Notify admins about new issue
        try:
            socketio.emit('notification', {
                'title': 'New Issue Reported',
                'message': f"New issue reported by {user['name']}: {title}",
                'type': 'new_issue',
                'issue_id': issue_id,
                'status': 'Pending',
                'created_at': issue_data['created_at']
            }, room='admins')
            print("Admin notification emitted")
        except Exception as e:
            print(f"Failed to emit admin notification: {e}")
        
        return jsonify({
            'message': 'Issue reported successfully',
            'issue_id': issue_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/myreports', methods=['GET'])
@jwt_required()
def get_my_reports():
    try:
        user_id = get_jwt_identity()
        user_issues = [issue for issue in issues_db.values() if issue['user_id'] == user_id]
        user_issues.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({'issues': user_issues}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/issues', methods=['GET'])
def get_all_issues():
    try:
        # Get query parameters for filtering
        category = request.args.get('category')
        status = request.args.get('status')
        
        # Filter issues
        filtered_issues = []
        for issue in issues_db.values():
            if category and issue['category'] != category:
                continue
            if status and issue['status'] != status:
                continue
            
            # Add user name
            user = users_db.get(issue['user_id'])
            issue_copy = issue.copy()
            issue_copy['user_name'] = user['name'] if user else 'Unknown'
            filtered_issues.append(issue_copy)
        
        filtered_issues.sort(key=lambda x: x['created_at'], reverse=True)
        return jsonify({'issues': filtered_issues}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'database': 'in-memory',
        'collections': {
            'users': len(users_db),
            'issues': len(issues_db)
        },
        'timestamp': datetime.utcnow().isoformat()
    }), 200

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

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    print("🚀 Starting Civic Issue Reporting System (Simple Version)")
    print("📊 Using in-memory database for demonstration")
    print("🔑 Admin credentials: admin@civicreport.com / admin123")
    print("🌐 Server will run on http://localhost:5000")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
