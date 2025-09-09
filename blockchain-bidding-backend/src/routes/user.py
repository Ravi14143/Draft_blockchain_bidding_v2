from flask import Blueprint, jsonify, request, session, current_app, send_file
from werkzeug.utils import secure_filename
from datetime import datetime
from functools import wraps
import os, json

# Import models
from src.models.user import User, db, RFQ, Bid, Project, Milestone, ClarificationThread, ClarificationMessage, RFQFile, BidFile

# Import blockchain service
from src.blockchain.contract_service import create_rfq_onchain, submit_bid_onchain, str_keccak, to_unix_seconds

# Import evaluation services
from src.services.evalution import evaluate_phase1, evaluate_phase2

user_bp = Blueprint('user', __name__, url_prefix='/api')


# ---------------------------
# Utility decorators
# ---------------------------
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


# ---------------------------
# Authentication routes
# ---------------------------
@user_bp.route('/register', methods=['POST'])
def register_user():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if not username or not password or not role:
        return jsonify({'error': 'Username, password, and role are required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400

    user = User(
        username=username,
        role=role,
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        company=data.get('company'),
        address=data.get('address'),
        avatar_url=data.get('avatar_url')
    )
    user.set_password(password)
    try:
        db.session.add(user)
        db.session.commit()
        session['user_id'] = user.id
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Registration failed: {str(e)}"}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if user and user.check_password(data.get('password')):
        session['user_id'] = user.id
        return jsonify(user.to_dict())
    return jsonify({'error': 'Invalid credentials'}), 401

@user_bp.route('/logout', methods=['POST'])
@login_required
def logout_user():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'})

@user_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    user = User.query.get(session['user_id'])
    return jsonify(user.to_dict())


# ---------------------------
# File helper
# ---------------------------
def save_file(file, rfq_id):
    upload_dir = os.path.join(
        current_app.config.get("UPLOAD_FOLDER", "uploads"),
        "rfqs", str(rfq_id)
    )
    os.makedirs(upload_dir, exist_ok=True)
    filename = secure_filename(file.filename)
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    rfq_file = RFQFile(rfq_id=rfq_id, filename=filename, filepath=filepath)
    db.session.add(rfq_file)
    return rfq_file


# ---------------------------
# RFQ Routes
# ---------------------------
@user_bp.route('/rfqs', methods=['GET'])
@login_required
def get_rfqs():
    rfqs = RFQ.query.all()
    return jsonify([rfq.to_dict(include_files=True) for rfq in rfqs])


@user_bp.route('/rfqs/<int:rfq_id>', methods=['GET'])
@login_required
def get_rfq(rfq_id):
    rfq = RFQ.query.get_or_404(rfq_id)
    return jsonify(rfq.to_dict(include_files=True))


@user_bp.route('/rfqs/<int:rfq_id>/files/<path:filename>', methods=['GET'])
@login_required
def serve_rfq_file(rfq_id, filename):
    rfq = RFQ.query.get_or_404(rfq_id)
    upload_dir = os.path.join(
        current_app.config.get("UPLOAD_FOLDER", "uploads"),
        "rfqs", str(rfq_id)
    )
    file_path = os.path.join(upload_dir, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    return send_file(file_path, as_attachment=True)


@user_bp.route('/rfqs', methods=['POST'])
@role_required('owner')
def create_rfq():
    try:
        if request.content_type.startswith('multipart/form-data'):
            metadata_str = request.form.get('metadata', '{}')
            data = json.loads(metadata_str)
            files = request.files.getlist('files')
        else:
            data = request.json or {}
            files = []

        # Validate dates
        for field in ["deadline","publish_date","clarification_deadline","start_date","end_date"]:
            if data.get(field):
                datetime.strptime(data[field], "%Y-%m-%d")

        scope_text = data.get('scope', '')
        meta_hash = str_keccak(scope_text)

        budget_min = int(data.get('budget_min', 0) or 0)
        budget_max = int(data.get('budget_max', 0) or 0)
        budget = budget_max or budget_min or 0

        weights_str = data.get("evaluation_weights","")
        if weights_str and "=" in weights_str:
            weights_dict = {k.strip().lower(): float(v.strip()) for k,v in (part.split("=") for part in weights_str.split(",")) if "=" in part}
            weights_str = json.dumps(weights_dict)

        onchain = create_rfq_onchain(
            data.get('title',''), meta_hash, data.get('deadline',''),
            data.get('category',''), budget, data.get('location','')
        )

        rfq_id_chain = onchain.get("rfqId")
        tx_hash = onchain.get("txHash")
        # if not rfq_id_chain or not tx_hash:
        #     return jsonify({"error": "On-chain RFQ creation failed"}), 500

        rfq = RFQ(
            owner_id=session['user_id'],
            title=data.get('title',''),
            scope=scope_text,
            deadline=data.get('deadline'),
            evaluation_criteria=data.get('evaluation_criteria',''),
            category=data.get('category'),
            budget_min=budget_min,
            budget_max=budget_max,
            publish_date=data.get('publish_date'),
            clarification_deadline=data.get('clarification_deadline'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            eligibility_requirements=data.get('eligibility_requirements'),
            evaluation_weights=weights_str,
            onchain_id=rfq_id_chain,
            tx_hash=tx_hash,
            status="open"
        )
        db.session.add(rfq)
        db.session.commit()

        for f in files:
            save_file(f, rfq.id)
        db.session.commit()

        return jsonify(rfq.to_dict(include_files=True)), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"RFQ creation failed: {e}")
        return jsonify({'error': f"RFQ creation failed: {str(e)}"}), 500


# ---------------------------
# Bid Routes
# ---------------------------
@user_bp.route('/bids', methods=['POST'])
@role_required('bidder')
def create_bid():
    try:
        print("Step 1: Parsing request data...")
        if request.content_type.startswith('multipart/form-data'):
            data_str = request.form.get('data', '{}')
            data = json.loads(data_str)
            files = request.files.getlist('files')
            print("Step 1: Success - Request data parsed.")
        else:
            print("Step 1: Failed - Content type is not multipart/form-data")
            return jsonify({"error": "Bid must include a file upload"}), 400

        if not files:
            print("Step 2: Failed - No files uploaded")
            return jsonify({"error": "At least one file (PDF/PPT) is required"}), 400
        print(f"Step 2: {len(files)} file(s) uploaded successfully.")

        # Step 3: Save bid in DB
        print("Step 3: Saving bid to database...")
        from datetime import datetime

        # Convert timeline strings to date objects
        timeline_start_str = data.get('timeline_start')
        timeline_end_str = data.get('timeline_end')

        timeline_start = None
        timeline_end = None

        if timeline_start_str:
            timeline_start = datetime.strptime(timeline_start_str, "%Y-%m-%d").date()
        if timeline_end_str:
            timeline_end = datetime.strptime(timeline_end_str, "%Y-%m-%d").date()

        bid = Bid(
            rfq_id=data['rfq_id'],
            bidder_id=session['user_id'],
            price=data['price'],
            timeline_start=timeline_start,
            timeline_end=timeline_end,
            qualifications=data.get('qualifications', ''),
            status="submitted",
            phase1_status="pending",
            phase2_status="pending"
        )

        db.session.add(bid)
        db.session.flush()
        print(f"Step 3: Success - Bid saved with ID {bid.id}")

        # Step 4: Save files
        print("Step 4: Saving files...")
        upload_dir = os.path.join(
            current_app.config.get("UPLOAD_FOLDER", "uploads"),
            "bids",
            str(bid.id)
        )
        os.makedirs(upload_dir, exist_ok=True)

        for f in files:
            filename = secure_filename(f.filename)
            filepath = os.path.join(upload_dir, filename)
            f.save(filepath)
            bid_file = BidFile(bid_id=bid.id, filename=filename, filepath=filepath)
            db.session.add(bid_file)
            print(f"Step 4: File saved - {filename}")

        db.session.commit()
        print("Step 4: Success - All files saved and committed.")

        # Step 5: Extract text from files
        print("Step 5: Extracting text from files...")
        from PyPDF2 import PdfReader
        import pptx

        text_content = ""
        for bf in bid.files:
            if bf.filename.lower().endswith(".pdf"):
                reader = PdfReader(bf.filepath)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n"
                print(f"Step 5: Text extracted from PDF - {bf.filename}")
            elif bf.filename.lower().endswith(".ppt") or bf.filename.lower().endswith(".pptx"):
                prs = pptx.Presentation(bf.filepath)
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text"):
                            text_content += shape.text + "\n"
                print(f"Step 5: Text extracted from PPT - {bf.filename}")

        bid.qualifications = text_content[:5000]
        db.session.commit()
        print("Step 5: Success - Text extraction complete.")

        # Step 6: Phase 1 Evaluation
        print("Step 6: Running Phase 1 evaluation...")
        p1 = evaluate_phase1(bid.qualifications, bid.rfq_id)
        bid.phase1_status = p1.get("status", "pending")
        bid.phase1_report = {
            "reasons": p1.get("reasons", []),
            "missing": p1.get("missing", []),
            "red_flags": p1.get("red_flags", [])
        }
        bid.red_flags = p1.get("red_flags", []) or []

        if bid.phase1_status == "reject":
            bid.status = "rejected"
            print("Step 6: Phase 1 evaluation failed - Bid rejected.")
        elif bid.phase1_status == "clarify":
            bid.status = "needs_clarification"
            print("Step 6: Phase 1 evaluation needs clarification.")
        else:
            bid.status = "submitted"
            print("Step 6: Phase 1 evaluation passed.")

        db.session.commit()
        print("Step 6: Phase 1 evaluation committed to DB.")

        # Step 7: Phase 2 Evaluation
        if bid.phase1_status == "pass":
            print("Step 7: Running Phase 2 evaluation...")
            p2 = evaluate_phase2(bid)
            bid.phase2_status = p2.get("status", "pending")
            bid.phase2_score = p2.get("score")
            bid.phase2_breakdown = p2.get("breakdown")
            bid.red_flags = list(set((bid.red_flags or []) + p2.get("red_flags", [])))
            db.session.commit()
            print(f"Step 7: Phase 2 evaluation complete - Status: {bid.phase2_status}")
        else:
            print("Step 7: Phase 2 evaluation skipped (Phase 1 not passed).")

        print("Bid submission complete!")
        return jsonify({"bid": bid.to_dict(include_files=True)}), 201

    except Exception as e:
        db.session.rollback()
        print("Error occurred during bid submission!")
        print(str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Bid submission failed: {str(e)}"}), 500


@user_bp.route('/my-bids', methods=['GET','post'])
@role_required('bidder')
def get_my_bids():
    bids = Bid.query.filter_by(bidder_id=session['user_id']).order_by(Bid.created_at.desc()).all()
    return jsonify([bid.to_dict() for bid in bids])


@user_bp.route('/rfqs/<int:rfq_id>/bids', methods=['GET'])
@login_required
def get_rfq_bids(rfq_id):
    user = User.query.get(session['user_id'])
    rfq = RFQ.query.get_or_404(rfq_id)
    if user.role=='owner' and rfq.owner_id==user.id:
        bids = Bid.query.filter_by(rfq_id=rfq_id).order_by(Bid.created_at.desc()).all()
    elif user.role=='bidder':
        bids = Bid.query.filter_by(rfq_id=rfq_id, bidder_id=user.id).order_by(Bid.created_at.desc()).all()
    else:
        return jsonify({'error':'Insufficient permissions'}), 403
    return jsonify([b.to_dict() for b in bids])


# ---------------------------
# Project & Milestones
# ---------------------------
@user_bp.route('/projects', methods=['GET'])
@login_required
def get_projects():
    user = User.query.get(session['user_id'])
    if user.role == 'owner':
        projects = Project.query.join(RFQ).filter(RFQ.owner_id==user.id).all()
    elif user.role == 'bidder':
        projects = Project.query.join(Bid).filter(Bid.bidder_id==user.id).all()
    else:
        projects = Project.query.all()
    return jsonify([p.to_dict() for p in projects])

@user_bp.route('/projects/<int:project_id>', methods=['GET','post'])
@login_required
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify(project.to_dict())

@user_bp.route('/projects/<int:project_id>/milestones', methods=['GET','post'])
@login_required
def get_project_milestones(project_id):
    milestones = Milestone.query.filter_by(project_id=project_id).all()
    return jsonify([milestone.to_dict() for milestone in milestones])


@user_bp.route('/milestones', methods=['POST'])
@role_required('bidder')
def create_milestone():
    data = request.json or {}
    milestone = Milestone(
        project_id=data['project_id'],
        description=data['description'],
        due_date=data['due_date'],
        document_hash=data.get('document_hash','hash_placeholder'),
        status="submitted"
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify(milestone.to_dict()), 201

@user_bp.route('/milestones/<int:milestone_id>/approve', methods=['POST'])
@role_required('owner')
def approve_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id)
    milestone.status='approved'
    milestone.comments=None
    db.session.commit()
    return jsonify(milestone.to_dict())

@user_bp.route('/milestones/<int:milestone_id>/reject', methods=['POST'])
@role_required('owner')
def reject_milestone(milestone_id):
    data = request.json or {}
    comment = data.get('comment')
    if not comment:
        return jsonify({'error':'Rejection comment required'}),400
    milestone = Milestone.query.get_or_404(milestone_id)
    milestone.status='rejected'
    milestone.comments=comment
    db.session.commit()
    return jsonify(milestone.to_dict())

@user_bp.route('/milestones/<int:milestone_id>/resubmit', methods=['POST'])
@role_required('bidder')
def resubmit_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id)
    if milestone.status!='rejected':
        return jsonify({'error':'Only rejected milestones can be resubmitted'}),400
    data = request.json or {}
    milestone.status='submitted'
    milestone.document_hash=data.get('document_hash', milestone.document_hash)
    milestone.comments=None
    db.session.commit()
    return jsonify(milestone.to_dict())


# ---------------------------
# Dashboard
# ---------------------------
@user_bp.route('/dashboard', methods=['GET','post'])
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404

    # ---------------- Bidder Dashboard ----------------
    if user.role == "bidder":
        available_rfqs = RFQ.query.filter_by(status="open").order_by(RFQ.created_at.desc()).all()
        bids = Bid.query.filter_by(bidder_id=user.id).order_by(Bid.created_at.desc()).all()
        projects = Project.query.join(Bid).filter(Bid.bidder_id == user.id, Bid.status == "selected").all()

        return jsonify({
            "role": "bidder",
            "available_rfqs": len(available_rfqs),
            "bid_count": len(bids),
            "project_count": len(projects),
            "recent_rfqs": [r.to_dict() for r in available_rfqs[:5]],
            "bids": [b.to_dict() for b in bids[:5]]
        })

    # ---------------- Owner Dashboard ----------------
    if user.role == "owner":
        rfqs = RFQ.query.filter_by(owner_id=user.id).order_by(RFQ.created_at.desc()).all()
        projects = Project.query.join(RFQ).filter(RFQ.owner_id == user.id).all()
        return jsonify({
            "role": "owner",
            "rfq_count": len(rfqs),
            "project_count": len(projects),
            "rfqs": [r.to_dict() for r in rfqs],
            "projects": [p.to_dict() for p in projects]
        })

    # ---------------- Admin Dashboard ----------------
    if user.role == "admin":
        users = User.query.all()
        return jsonify({
            "role": "admin",
            "user_count": len(users),
            "users": [u.to_dict() for u in users]
        })

    return jsonify({"error": "Unknown role"}), 400



# -----------------------------
# GET bidder profile
# -----------------------------
@user_bp.route('/bidder/profile', methods=['GET'])
@role_required('bidder')
def get_bidder_profile():
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200

# -----------------------------
# PUT bidder profile
# -----------------------------
@user_bp.route('/bidder/profile', methods=['PUT'])
@role_required('bidder')
def update_bidder_profile():
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}

    # Update only allowed fields
    user.name = data.get("name", user.name)
    user.email = data.get("email", user.email)
    user.phone = data.get("phone", user.phone)
    user.company = data.get("company", user.company)
    user.address = data.get("address", user.address)
    user.avatar_url = data.get("avatar_url", user.avatar_url)

    try:
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500