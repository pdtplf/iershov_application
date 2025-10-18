from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    emails = db.relationship('Email', backref='user', lazy=True)

class Email(db.Model):
    __tablename__ = 'emails'
    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temp_emails = db.Column(JSONB, default={})
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.uuid'), nullable=False)