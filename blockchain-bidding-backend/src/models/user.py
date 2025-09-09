from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from datetime import datetime
from sqlalchemy.orm import relationship

db = SQLAlchemy()

# -----------------------------
# User model
# -----------------------------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    
    # Bidder-specific fields
    name = db.Column(db.String(150))
    email = db.Column(db.String(150), unique=True)
    phone = db.Column(db.String(50))
    company = db.Column(db.String(150))
    address = db.Column(db.String(250))
    avatar_url = db.Column(db.String(250))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="scrypt")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "company": self.company,
            "address": self.address,
            "avatar_url": self.avatar_url
        }



# -----------------------------
# RFQ models
# -----------------------------
class RFQ(db.Model):
    __tablename__ = 'rfqs'

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Off-chain metadata
    title = db.Column(db.String(255), nullable=False)
    scope = db.Column(db.Text, nullable=False)
    deadline = db.Column(db.String(64), nullable=False)
    evaluation_criteria = db.Column(db.Text, nullable=False)

    category = db.Column(db.String(120))
    budget_min = db.Column(db.Integer)
    budget_max = db.Column(db.Integer)
    publish_date = db.Column(db.String(64))
    clarification_deadline = db.Column(db.String(64))
    start_date = db.Column(db.String(64))
    end_date = db.Column(db.String(64))
    eligibility_requirements = db.Column(db.Text)
    evaluation_weights = db.Column(db.String(255))  # JSON string

    # On-chain references
    onchain_id = db.Column(db.Integer)
    tx_hash = db.Column(db.String(80))

    status = db.Column(db.String(20), default="open")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    bids = relationship("Bid", backref="rfq", lazy="dynamic", cascade="all, delete-orphan")
    files = relationship("RFQFile", backref="rfq", cascade="all, delete-orphan")

    @property
    def bid_count(self):
        return self.bids.count()

    @property
    def submission_status(self):
        if not self.deadline:
            return "no deadline set"
        try:
            deadline_dt = datetime.fromisoformat(self.deadline)
            return "submission closed" if datetime.utcnow() > deadline_dt else "submission open"
        except ValueError:
            return "invalid deadline"

    def to_dict(self, include_bids=False, include_files=False):
        data = {
            "id": self.id,
            "owner_id": self.owner_id,
            "title": self.title,
            "scope": self.scope,
            "deadline": self.deadline,
            "evaluation_criteria": self.evaluation_criteria,
            "category": self.category,
            "budget_min": self.budget_min,
            "budget_max": self.budget_max,
            "publish_date": self.publish_date,
            "clarification_deadline": self.clarification_deadline,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "eligibility_requirements": self.eligibility_requirements,
            "evaluation_weights": self.evaluation_weights,
            "onchain_id": self.onchain_id,
            "tx_hash": self.tx_hash,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "bid_count": self.bid_count,
            "submission_status": self.submission_status
        }
        if include_bids:
            data["bids"] = [b.to_dict() for b in self.bids.all()]
        if include_files:
            data["files"] = [f.to_dict() for f in self.files]
        return data


class RFQFile(db.Model):
    __tablename__ = "rfq_files"
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey("rfqs.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def extract_text(self):
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return f.read()
        except:
            return ""

    def to_dict(self):
        return {
            "id": self.id,
            "rfq_id": self.rfq_id,
            "filename": self.filename,
            "filepath": self.filepath,
            "uploaded_at": self.uploaded_at.isoformat()
        }

# -----------------------------
# Bid models
# -----------------------------
class Bid(db.Model):
    __tablename__ = 'bids'
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id'), nullable=False)
    bidder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    timeline = db.Column(db.String(120), nullable=False)
    qualifications = db.Column(db.Text, nullable=False)

    document_hash = db.Column(db.String(120), default="hash_placeholder")
    onchain_id = db.Column(db.Integer)
    tx_hash = db.Column(db.String(80))

    status = db.Column(db.String(32), default="submitted")

    # Evaluation
    phase1_status = db.Column(db.String(20), default="pending")
    phase1_report = db.Column(db.JSON, default={})
    phase2_status = db.Column(db.String(20), default="pending")
    phase2_score = db.Column(db.Float)
    phase2_breakdown = db.Column(db.JSON, default={})
    red_flags = db.Column(db.JSON, default={})

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    files = relationship("BidFile", backref="bid", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "rfq_id": self.rfq_id,
            "bidder_id": self.bidder_id,
            "price": self.price,
            "timeline": self.timeline,
            "qualifications": self.qualifications,
            "document_hash": self.document_hash,
            "onchain_id": self.onchain_id,
            "tx_hash": self.tx_hash,
            "status": self.status,
            "phase1_status": self.phase1_status,
            "phase1_report": self.phase1_report,
            "phase2_status": self.phase2_status,
            "phase2_score": self.phase2_score,
            "phase2_breakdown": self.phase2_breakdown,
            "red_flags": self.red_flags,
            "created_at": self.created_at.isoformat(),
            "files": [f.to_dict() for f in self.files]
        }


# src/models/user.py
class BidFile(db.Model):
    __tablename__ = "bid_files"

    id = db.Column(db.Integer, primary_key=True)
    bid_id = db.Column(db.Integer, db.ForeignKey("bids.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    bid = db.relationship("Bid", backref="files")

    def to_dict(self):
        return {
            "id": self.id,
            "bid_id": self.bid_id,
            "filename": self.filename,
            "filepath": self.filepath,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


# -----------------------------
# Project model
# -----------------------------
class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id'), nullable=False)
    winner_bid_id = db.Column(db.Integer, db.ForeignKey('bids.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "rfq_id": self.rfq_id,
            "winner_bid_id": self.winner_bid_id,
            "created_at": self.created_at.isoformat()
        }


# -----------------------------
# Milestone model
# -----------------------------
class Milestone(db.Model):
    __tablename__ = 'milestones'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    due_date = db.Column(db.String(64), nullable=False)
    document_hash = db.Column(db.String(120), default="hash_placeholder")
    status = db.Column(db.String(20), default="pending")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "description": self.description,
            "due_date": self.due_date,
            "document_hash": self.document_hash,
            "status": self.status
        }


# -----------------------------
# Clarification workflow
# -----------------------------
class ClarificationThread(db.Model):
    __tablename__ = 'clarification_threads'
    id = db.Column(db.Integer, primary_key=True)
    bid_id = db.Column(db.Integer, db.ForeignKey('bids.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default="open")  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)

    def to_dict(self, include_messages=False):
        data = {
            "id": self.id,
            "bid_id": self.bid_id,
            "owner_id": self.owner_id,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None
        }
        if include_messages:
            msgs = ClarificationMessage.query.filter_by(
                thread_id=self.id
            ).order_by(ClarificationMessage.created_at.asc()).all()
            data["messages"] = [m.to_dict() for m in msgs]
        return data


class ClarificationMessage(db.Model):
    __tablename__ = 'clarification_messages'
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey('clarification_threads.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'owner' | 'bidder'
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "thread_id": self.thread_id,
            "sender_id": self.sender_id,
            "role": self.role,
            "message": self.message,
            "created_at": self.created_at.isoformat()
        }
