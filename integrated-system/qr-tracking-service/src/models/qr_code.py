from datetime import datetime
import uuid
from src.extensions import db

class QRCode(db.Model):
    __tablename__ = 'qr_codes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tracking_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    target_content = db.Column(db.String(2048), nullable=False)
    title = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    scan_count = db.Column(db.Integer, default=0)

    user = db.relationship('User', backref=db.backref('qr_codes', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'target_content': self.target_content,
            'title': self.title,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'scan_count': self.scan_count
        }

class QRScan(db.Model):
    __tablename__ = 'qr_scans'

    id = db.Column(db.Integer, primary_key=True)
    qr_code_id = db.Column(db.String(36), db.ForeignKey('qr_codes.id'), nullable=False)
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(100), nullable=True)

    qr_code = db.relationship('QRCode', backref=db.backref('scans', lazy=True))

class UserSubscription(db.Model):
    __tablename__ = 'user_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_name = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='active') # active, inactive, cancelled, expired
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    max_qr_codes = db.Column(db.Integer, default=5)
    max_scans_per_month = db.Column(db.Integer, default=100)

    user = db.relationship('User', backref=db.backref('subscription', uselist=False))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_name': self.plan_name,
            'status': self.status,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_active': self.is_active,
            'max_qr_codes': self.max_qr_codes,
            'max_scans_per_month': self.max_scans_per_month
        }
