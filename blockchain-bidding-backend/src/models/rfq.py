from src.models.user import db
from datetime import datetime

class RFQ(db.Model):
    __tablename__ = 'rfqs'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    scope = db.Column(db.Text, nullable=False)
    deadline = db.Column(db.String(50), nullable=False)  # store as ISO string for now
    evaluation_criteria = db.Column(db.Text, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "scope": self.scope,
            "deadline": self.deadline,
            "evaluation_criteria": self.evaluation_criteria,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat()
        }
