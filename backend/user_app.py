from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from bson import ObjectId
from datetime import datetime, timedelta
import os
import uuid

from common import initialize_database

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'uploads'

jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

client, db, users_collection, issues_collection, notifications_collection = initialize_database()

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Minimal user-facing routes (register/login/report/myreports/issues/notifications)
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    if not email or not password or not name:
        return jsonify({'error': 'Missing required fields'}), 400
    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 400
    hashed_password = generate_password_hash(password)
    user_data = {'name': name, 'email': email, 'password': hashed_password, 'role': 'user', 'created_at': datetime.utcnow()}
    result = users_collection.insert_one(user_data)
    access_token = create_access_token(identity=str(result.inserted_id))
    return jsonify({'message': 'User registered successfully','access_token': access_token,'user': {'id': str(result.inserted_id),'name': name,'email': email,'role': 'user'}}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
    user = users_collection.find_one({'email': email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=str(user['_id']))
    return jsonify({'message': 'Login successful','access_token': access_token,'user': {'id': str(user['_id']),'name': user['name'],'email': user['email'],'role': user['role']}}), 200


@app.route('/report', methods=['POST'])
@jwt_required()
def submit_report():
    user_id = get_jwt_identity()
    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            image_filename = unique_filename
    title = request.form.get('title')
    description = request.form.get('description')
    category = request.form.get('category')
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    address = request.form.get('address')
    if not title or not description or not category:
        return jsonify({'error': 'Missing required fields'}), 400
    issue_data = {'user_id': user_id,'title': title,'description': description,'category': category,'status': 'Pending','image': image_filename,'location': {'latitude': float(latitude) if latitude else None,'longitude': float(longitude) if longitude else None,'address': address},'created_at': datetime.utcnow(),'updated_at': datetime.utcnow()}
    result = issues_collection.insert_one(issue_data)
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    socketio.emit('notification', {'title': 'New Issue Reported','message': f"New issue reported by {user['name']}: {title}",'type': 'new_issue','issue_id': str(result.inserted_id),'status': 'Pending','created_at': issue_data['created_at'].isoformat()}, room='admins')
    return jsonify({'message': 'Issue reported successfully','issue_id': str(result.inserted_id)}), 201


@app.route('/myreports', methods=['GET'])
@jwt_required()
def get_my_reports():
    user_id = get_jwt_identity()
    issues = list(issues_collection.find({'user_id': user_id}).sort('created_at', -1))
    for issue in issues:
        issue['_id'] = str(issue['_id'])
        issue['created_at'] = issue['created_at'].isoformat()
        issue['updated_at'] = issue['updated_at'].isoformat()
    return jsonify({'issues': issues}), 200


@app.route('/issues', methods=['GET'])
def get_all_issues():
    category = request.args.get('category')
    status = request.args.get('status')
    query = {}
    if category:
        query['category'] = category
    if status:
        query['status'] = status
    issues = list(issues_collection.find(query).sort('created_at', -1))
    for issue in issues:
        user = users_collection.find_one({'_id': ObjectId(issue['user_id'])})
        issue['user_name'] = user['name'] if user else 'Unknown'
        issue['_id'] = str(issue['_id'])
        issue['created_at'] = issue['created_at'].isoformat()
        issue['updated_at'] = issue['updated_at'].isoformat()
    return jsonify({'issues': issues}), 200


@app.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    limit = int(request.args.get('limit', '20'))
    notifications = list(notifications_collection.find({'user_id': user_id}).sort('created_at', -1).limit(limit))
    for n in notifications:
        n['_id'] = str(n['_id'])
        n['created_at'] = n['created_at'].isoformat()
    unread_count = notifications_collection.count_documents({'user_id': user_id, 'read': False})
    return jsonify({'notifications': notifications, 'unread_count': unread_count}), 200


@app.route('/notifications/mark-read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    notification_ids = data.get('ids')
    query = {'user_id': user_id, 'read': False}
    if notification_ids and isinstance(notification_ids, list):
        object_ids = [ObjectId(nid) for nid in notification_ids]
        query['_id'] = {'$in': object_ids}
    result = notifications_collection.update_many(query, {'$set': {'read': True}})
    return jsonify({'updated': result.modified_count}), 200


# Internal endpoint to emit user-targeted notification from admin app
@app.route('/internal/emit_user_notification', methods=['POST'])
def internal_emit_user_notification():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    title = data.get('title')
    message = data.get('message')
    payload = data.get('payload', {})
    if not user_id or not title or not message:
        return jsonify({'error': 'Missing fields'}), 400
    socketio.emit('notification', { 'title': title, 'message': message, **payload }, room=f'user_{user_id}')
    return jsonify({'emitted': True}), 200


@socketio.on('connect')
def handle_connect():
    emit('connected', {'message': 'Connected to user server'})


@socketio.on('join_room')
def handle_join_room(data):
    room = data['room']
    join_room(room)
    emit('joined_room', {'room': room})


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)


