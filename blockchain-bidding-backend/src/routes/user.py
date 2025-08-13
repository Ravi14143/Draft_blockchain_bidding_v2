from flask import Blueprint, jsonify, request, session
from src.models.user import User, RFQ, Bid, Project, Milestone, db
from functools import wraps

user_bp = Blueprint('user', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Authentication required'}), 401
            user = User.query.get(session['user_id'])
            if not user or user.role != role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Authentication routes
@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(username=data['username'], role=data['role'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        return jsonify(user.to_dict())
    return jsonify({'error': 'Invalid credentials'}), 401

@user_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'})

@user_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    user = User.query.get(session['user_id'])
    return jsonify(user.to_dict())

# RFQ routes
@user_bp.route('/rfqs', methods=['GET'])
@login_required
def get_rfqs():
    rfqs = RFQ.query.all()
    return jsonify([rfq.to_dict() for rfq in rfqs])

@user_bp.route('/rfqs', methods=['POST'])
@role_required('owner')
def create_rfq():
    data = request.json
    rfq = RFQ(
        owner_id=session['user_id'],
        title=data['title'],
        scope=data['scope'],
        deadline=data['deadline'],
        evaluation_criteria=data['evaluation_criteria']
    )
    db.session.add(rfq)
    db.session.commit()
    return jsonify(rfq.to_dict()), 201

@user_bp.route('/rfqs/<int:rfq_id>', methods=['GET'])
@login_required
def get_rfq(rfq_id):
    rfq = RFQ.query.get_or_404(rfq_id)
    return jsonify(rfq.to_dict())

@user_bp.route('/rfqs/<int:rfq_id>/bids', methods=['GET'])
@login_required
def get_rfq_bids(rfq_id):
    user = User.query.get(session['user_id'])
    rfq = RFQ.query.get_or_404(rfq_id)
    
    # Only owner can see all bids
    if user.role == 'owner' and rfq.owner_id == user.id:
        bids = Bid.query.filter_by(rfq_id=rfq_id).all()
    elif user.role == 'bidder':
        # Bidders can only see their own bids
        bids = Bid.query.filter_by(rfq_id=rfq_id, bidder_id=user.id).all()
    else:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    return jsonify([bid.to_dict() for bid in bids])

# Bid routes
@user_bp.route('/bids', methods=['POST'])
@role_required('bidder')
def create_bid():
    data = request.json
    bid = Bid(
        rfq_id=data['rfq_id'],
        bidder_id=session['user_id'],
        price=data['price'],
        timeline=data['timeline'],
        qualifications=data['qualifications'],
        document_hash=data.get('document_hash', 'hash_placeholder')
    )
    db.session.add(bid)
    db.session.commit()
    return jsonify(bid.to_dict()), 201

@user_bp.route('/my-bids', methods=['GET'])
@role_required('bidder')
def get_my_bids():
    bids = Bid.query.filter_by(bidder_id=session['user_id']).all()
    return jsonify([bid.to_dict() for bid in bids])

@user_bp.route('/bids/<int:bid_id>/select', methods=['POST'])
@role_required('owner')
def select_winner(bid_id):
    bid = Bid.query.get_or_404(bid_id)
    rfq = RFQ.query.get_or_404(bid.rfq_id)
    
    if rfq.owner_id != session['user_id']:
        return jsonify({'error': 'Not authorized'}), 403
    
    # Create project
    project = Project(rfq_id=rfq.id, winner_bid_id=bid.id)
    rfq.status = 'closed'
    bid.status = 'selected'
    
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201

# Project routes
@user_bp.route('/projects', methods=['GET'])
@login_required
def get_projects():
    user = User.query.get(session['user_id'])
    if user.role == 'owner':
        projects = Project.query.join(RFQ).filter(RFQ.owner_id == user.id).all()
    elif user.role == 'bidder':
        projects = Project.query.join(Bid).filter(Bid.bidder_id == user.id).all()
    else:  # admin
        projects = Project.query.all()
    
    return jsonify([project.to_dict() for project in projects])

@user_bp.route('/projects/<int:project_id>', methods=['GET'])
@login_required
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify(project.to_dict())

@user_bp.route('/projects/<int:project_id>/milestones', methods=['GET'])
@login_required
def get_project_milestones(project_id):
    milestones = Milestone.query.filter_by(project_id=project_id).all()
    return jsonify([milestone.to_dict() for milestone in milestones])

@user_bp.route('/milestones', methods=['POST'])
@role_required('bidder')
def create_milestone():
    data = request.json
    milestone = Milestone(
        project_id=data['project_id'],
        description=data['description'],
        due_date=data['due_date'],
        document_hash=data.get('document_hash', 'hash_placeholder')
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify(milestone.to_dict()), 201

@user_bp.route('/milestones/<int:milestone_id>/approve', methods=['POST'])
@role_required('owner')
def approve_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id)
    milestone.status = 'approved'
    db.session.commit()
    return jsonify(milestone.to_dict())

# Admin routes
@user_bp.route('/users', methods=['GET'])
@role_required('admin')
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204



