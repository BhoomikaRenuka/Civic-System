from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
import requests

from common import initialize_database

USER_SERVICE_URL = 'http://localhost:5000'

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "*"}})

client, db, users_collection, issues_collection, notifications_collection = initialize_database()


@app.route('/admin/reports', methods=['GET'])
@jwt_required()
def get_admin_reports():
    user_id = get_jwt_identity()
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    category = request.args.get('category')
    status = request.args.get('status')
    location = request.args.get('location')

    query = {}
    if category:
        query['category'] = category
    if status:
        query['status'] = status
    if location:
        query['location.address'] = {'$regex': location, '$options': 'i'}

    issues = list(issues_collection.find(query).sort('created_at', -1))
    for issue in issues:
        u = users_collection.find_one({'_id': ObjectId(issue['user_id'])})
        issue['user_name'] = u['name'] if u else 'Unknown'
        issue['user_email'] = u['email'] if u else 'Unknown'
        issue['_id'] = str(issue['_id'])
        issue['created_at'] = issue['created_at'].isoformat()
        issue['updated_at'] = issue['updated_at'].isoformat()
    return jsonify({'issues': issues}), 200


@app.route('/admin/update', methods=['POST'])
@jwt_required()
def update_issue_status():
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

    result = issues_collection.update_one({'_id': ObjectId(issue_id)}, {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}})
    if result.matched_count == 0:
        return jsonify({'error': 'Issue not found'}), 404

    issue = issues_collection.find_one({'_id': ObjectId(issue_id)})
    issue_user = users_collection.find_one({'_id': ObjectId(issue['user_id'])})

    # Store notification for user
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

    # Ask user service to emit to that user's room
    try:
        requests.post(f"{USER_SERVICE_URL}/internal/emit_user_notification", json={
            'user_id': issue['user_id'],
            'title': 'Issue Status Updated',
            'message': f"Your issue '{issue['title']}' is now {new_status}",
            'payload': {
                'type': 'issue_status',
                'issue_id': issue_id,
                'status': new_status,
                'created_at': datetime.utcnow().isoformat(),
            },
        }, timeout=2)
    except Exception as e:
        print(f"Failed to notify user service: {e}")

    return jsonify({'message': 'Status updated successfully'}), 200


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)


