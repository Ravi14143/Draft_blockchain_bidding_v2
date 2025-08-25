from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' | 'owner' | 'bidder'
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {"id": self.id, "username": self.username, "role": self.role}

class RFQ(db.Model):
    __tablename__ = 'rfqs'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Off-chain metadata
    title = db.Column(db.String(255), nullable=False)
    scope = db.Column(db.Text, nullable=False)
    deadline = db.Column(db.String(64), nullable=False)  # keep ISO string for UI
    evaluation_criteria = db.Column(db.Text, nullable=False)

    category = db.Column(db.String(120))
    budget_min = db.Column(db.Integer)
    budget_max = db.Column(db.Integer)
    publish_date = db.Column(db.String(64))
    clarification_deadline = db.Column(db.String(64))
    start_date = db.Column(db.String(64))
    end_date = db.Column(db.String(64))
    eligibility_requirements = db.Column(db.Text)
    evaluation_weights = db.Column(db.String(255))

    # On-chain references
    onchain_id = db.Column(db.Integer)
    tx_hash = db.Column(db.String(80))

    status = db.Column(db.String(20), default="open")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
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
            "created_at": self.created_at.isoformat()
        }

class Bid(db.Model):
    __tablename__ = 'bids'
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id'), nullable=False)
    bidder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    timeline = db.Column(db.String(120), nullable=False)
    qualifications = db.Column(db.Text, nullable=False)
    document_hash = db.Column(db.String(120), default="hash_placeholder")
    status = db.Column(db.String(20), default="submitted")

    def to_dict(self):
        return {
            "id": self.id, "rfq_id": self.rfq_id, "bidder_id": self.bidder_id,
            "price": self.price, "timeline": self.timeline, "qualifications": self.qualifications,
            "document_hash": self.document_hash, "status": self.status
        }

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id'), nullable=False)
    winner_bid_id = db.Column(db.Integer, db.ForeignKey('bids.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "rfq_id": self.rfq_id,
            "winner_bid_id": self.winner_bid_id, "created_at": self.created_at.isoformat()
        }

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
            "id": self.id, "project_id": self.project_id, "description": self.description,
            "due_date": self.due_date, "document_hash": self.document_hash, "status": self.status
        }
