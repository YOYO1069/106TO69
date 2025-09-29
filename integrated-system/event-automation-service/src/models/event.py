from datetime import datetime
import uuid
from src.extensions import db

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, nullable=False) # Assuming user_id is an integer from an external system
    name = db.Column(db.String(200), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)  # 手遊, 信用卡, 產品抽獎
    url = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    tracking_status = db.Column(db.String(20), default='active')  # active, completed, expired
    auto_register_enabled = db.Column(db.Boolean, default=False)
    last_checked_at = db.Column(db.DateTime, nullable=True)
    next_check_at = db.Column(db.DateTime, nullable=True)
    registration_status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    reward_info = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'event_type': self.event_type,
            'url': self.url,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'tracking_status': self.tracking_status,
            'auto_register_enabled': self.auto_register_enabled,
            'last_checked_at': self.last_checked_at.isoformat() if self.last_checked_at else None,
            'next_check_at': self.next_check_at.isoformat() if self.next_check_at else None,
            'registration_status': self.registration_status,
            'description': self.description,
            'location': self.location,
            'reward_info': self.reward_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class AutomationLog(db.Model):
    __tablename__ = 'automation_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # success, failed, pending
    message = db.Column(db.Text, nullable=True)
    screenshot_url = db.Column(db.Text, nullable=True)
    execution_time = db.Column(db.Float, nullable=True)  # 執行時間（秒）
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'status': self.status,
            'message': self.message,
            'screenshot_url': self.screenshot_url,
            'execution_time': self.execution_time,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class EventNotification(db.Model):
    __tablename__ = 'event_notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    notification_type = db.Column(db.String(20), nullable=False)  # email, line, sms, push
    recipient = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(200), nullable=True)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, sent, failed
    scheduled_time = db.Column(db.DateTime, nullable=True)
    sent_time = db.Column(db.DateTime, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'notification_type': self.notification_type,
            'recipient': self.recipient,
            'subject': self.subject,
            'content': self.content,
            'status': self.status,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'sent_time': self.sent_time.isoformat() if self.sent_time else None,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EventTemplate(db.Model):
    __tablename__ = 'event_templates'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    url_pattern = db.Column(db.Text, nullable=True)
    automation_script = db.Column(db.Text, nullable=True)  # Selenium 腳本
    notification_templates = db.Column(db.JSON, nullable=True)  # 通知模板
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'event_type': self.event_type,
            'description': self.description,
            'url_pattern': self.url_pattern,
            'automation_script': self.automation_script,
            'notification_templates': self.notification_templates,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserEventSubscription(db.Model):
    __tablename__ = 'user_event_subscriptions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, nullable=False) # Assuming user_id is an integer from an external system
    plan_name = db.Column(db.String(50), nullable=False)  # Free, Basic, Premium
    max_events = db.Column(db.Integer, default=5)
    auto_register_enabled = db.Column(db.Boolean, default=False)
    notification_channels = db.Column(db.JSON, nullable=True)  # 可用的通知管道
    status = db.Column(db.String(20), default='active')  # active, cancelled, expired
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    auto_renew = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_name': self.plan_name,
            'max_events': self.max_events,
            'auto_register_enabled': self.auto_register_enabled,
            'notification_channels': self.notification_channels,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'auto_renew': self.auto_renew,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
