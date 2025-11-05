from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy import func
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    emails = db.relationship('Email', backref='user', lazy=True)
    deactivated = db.relationship('Deactivated', backref='user', lazy=True)

class Email(db.Model):
    __tablename__ = 'emails'
    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data = db.Column(JSONB, default={})
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.uuid'), nullable=False)


class Deactivated(db.Model):
    """Store deactivated email names and the user they belonged to.

    Table name: `deactivated` (as requested). Columns:
    - uuid: primary key
    - email: the local-part / name of the email (string)
    - user_id: FK to users.uuid
    """
    __tablename__ = 'deactivated'

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # store the full email data (same shape as Email.temp_emails) as JSONB
    data = db.Column(JSONB, nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.uuid'), nullable=False)