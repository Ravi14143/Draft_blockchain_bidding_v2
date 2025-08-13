from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role
        }

class RFQ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    scope = db.Column(db.Text, nullable=False)
    deadline = db.Column(db.String(50), nullable=False)
    evaluation_criteria = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open')
    
    owner = db.relationship('User', backref='rfqs')

    def to_dict(self):
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'title': self.title,
            'scope': self.scope,
            'deadline': self.deadline,
            'evaluation_criteria': self.evaluation_criteria,
            'status': self.status,
            'owner': self.owner.username if self.owner else None
        }

class Bid(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfq.id'), nullable=False)
    bidder_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    timeline = db.Column(db.String(100), nullable=False)
    qualifications = db.Column(db.Text, nullable=False)
    document_hash = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='submitted')
    
    rfq = db.relationship('RFQ', backref='bids')
    bidder = db.relationship('User', backref='bids')

    def to_dict(self):
        return {
            'id': self.id,
            'rfq_id': self.rfq_id,
            'bidder_id': self.bidder_id,
            'price': self.price,
            'timeline': self.timeline,
            'qualifications': self.qualifications,
            'document_hash': self.document_hash,
            'status': self.status,
            'bidder': self.bidder.username if self.bidder else None,
            'rfq_title': self.rfq.title if self.rfq else None
        }

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfq.id'), nullable=False)
    winner_bid_id = db.Column(db.Integer, db.ForeignKey('bid.id'), nullable=False)
    status = db.Column(db.String(20), default='in_progress')
    
    rfq = db.relationship('RFQ', backref='project')
    winner_bid = db.relationship('Bid', backref='project')

    def to_dict(self):
        return {
            'id': self.id,
            'rfq_id': self.rfq_id,
            'winner_bid_id': self.winner_bid_id,
            'status': self.status,
            'rfq_title': self.rfq.title if self.rfq else None,
            'winner_bidder': self.winner_bid.bidder.username if self.winner_bid and self.winner_bid.bidder else None
        }

class Milestone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    due_date = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='pending')
    document_hash = db.Column(db.String(255))
    
    project = db.relationship('Project', backref='milestones')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'description': self.description,
            'due_date': self.due_date,
            'status': self.status,
            'document_hash': self.document_hash
        }
