from flask import Blueprint, jsonify, request, session
from src.models.user import User, RFQ, Bid, Project, Milestone, db
from blockchain.contract_service import create_rfq_onchain, str_keccak, to_unix_seconds
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
@role_required('bidder')
def get_rfqs():
    rfqs = RFQ.query.all()
    return jsonify([rfq.to_dict() for rfq in rfqs])

@user_bp.route('/rfqs', methods=['POST'])
@role_required('owner')
def create_rfq():
    data = request.json

    # On-chain transaction
    try:
        deadline_secs = to_unix_seconds(data.get('deadline'))
        scope_hash = str_keccak(data.get('scope', ''))

        onchain = create_rfq_onchain(
            title=data.get('title', ''),
            scope_hash=scope_hash,
            deadline_secs=deadline_secs,
            category=data.get('category', ''),
            budget=int(data.get('budget_max') or data.get('budget_min') or 0),
            location=data.get('location', '')
        )

        rfq = RFQ(
            owner_id=session['user_id'],
            title=data.get('title', ''),
            scope=data.get('scope', ''),
            deadline=data.get('deadline', ''),
            evaluation_criteria=data.get('evaluation_criteria', ''),
            category=data.get('category'),
            budget_min=data.get('budget_min'),
            budget_max=data.get('budget_max'),
            publish_date=data.get('publish_date'),
            clarification_deadline=data.get('clarification_deadline'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            eligibility_requirements=data.get('eligibility_requirements'),
            evaluation_weights=data.get('evaluation_weights'),
            onchain_id=onchain["rfqId"],
            tx_hash=onchain["txHash"]
        )

        db.session.add(rfq)
        db.session.commit()

        return jsonify(rfq.to_dict()), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

@user_bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    """
    Returns a dashboard summary based on the user's role:
    - Bidder: available RFQs, recent RFQs, my bids, won projects, bid success rate
    - Owner: RFQs created, projects created
    - Admin: user count and list
    """
    user = User.query.get(session['user_id'])
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    # ----------------------
    # Bidder dashboard
    # ----------------------
    if user.role == "bidder":
        # All open RFQs (ordered by deadline)
        available_rfqs = RFQ.query.filter_by(status="open").order_by(RFQ.deadline.asc()).all()
        
        # Last 5 open RFQs (recent)
        recent_rfqs = RFQ.query.filter_by(status="open").order_by(RFQ.publish_date.desc()).limit(5).all()
        
        # All bids by this bidder
        bids = Bid.query.filter_by(bidder_id=user.id).all()
        
        # Include RFQ title for each bid
        bids_with_title = [
            {**bid.to_dict(), "rfq_title": RFQ.query.get(bid.rfq_id).title if RFQ.query.get(bid.rfq_id) else "N/A"}
            for bid in bids
        ]
        
        # Projects where this bidder has won (joined via bid)
        projects = Project.query.join(Bid).filter(Bid.bidder_id == user.id).all()
        
        response_data = {
            "role": "bidder",
            "available_rfqs": len(available_rfqs),
            "recent_rfqs": [rfq.to_dict() for rfq in recent_rfqs],
            "bid_count": len(bids),
            "project_count": len(projects),
            "bids": bids_with_title,
            "rfqs": [rfq.to_dict() for rfq in available_rfqs]  # all open RFQs
        }
        return jsonify(response_data)

    # ----------------------
    # Owner dashboard
    # ----------------------
    elif user.role == "owner":
        rfqs = RFQ.query.filter_by(owner_id=user.id).all()
        projects = Project.query.join(RFQ).filter(RFQ.owner_id == user.id).all()
        response_data = {
            "role": "owner",
            "rfq_count": len(rfqs),
            "project_count": len(projects),
            "rfqs": [rfq.to_dict() for rfq in rfqs],
            "projects": [p.to_dict() for p in projects]
        }
        return jsonify(response_data)

    # ----------------------
    # Admin dashboard
    # ----------------------
    elif user.role == "admin":
        users = User.query.all()
        response_data = {
            "role": "admin",
            "user_count": len(users),
            "users": [u.to_dict() for u in users]
        }
        return jsonify(response_data)

    # ----------------------
    # Unknown role
    # ----------------------
    return jsonify({"error": "Unknown role"}), 400
