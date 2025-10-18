from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from models import db, User, Email
from passlib.hash import bcrypt
from dotenv import load_dotenv
from flask_cors import CORS
import os
import jwt
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

CORS(app, resources={r"/*": {"origins": "*"}})

# Создание таблиц при первом запуске
with app.app_context():
    db.create_all()

# Хелпер для аутентификации (упрощенно)
def authenticate(email, password):
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.verify(password, user.password_hash):
        return user
    return None

# Регистрация
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.hash(data['password'])
    
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password
    )

    is_confirmed = cache.get(data['email']+"_confirmed")
    if not is_confirmed:
        return jsonify({"error": "Email not confirmed"}), 400
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')

# Вход (возвращает JWT токен)
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = authenticate(data['email'], data['password'])
    if user:
        payload = {
            "uuid": str(user.uuid),
            "exp": datetime.utcnow() + timedelta(hours=4)  # Токен действует 4 час
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return jsonify({"token": token}), 200
    return jsonify({"error": "Invalid credentials"}), 401

# Добавление email (требует аутентификации через JWT)
@app.route('/emails', methods=['POST'])
def add_email():
    token = request.headers.get('Authorization')
    if token and token.startswith("Bearer "):
        token = token.split(" ")[1]

    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        # Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_uuid = payload['uuid']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(user_uuid)
    print(user)
    print(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json()
    print(data)
    if not verify_email(data.get('temp')[0], data.get('temp')[3]):
        return jsonify({"error": "Email verification failed"}), 400
    if not isinstance(data.get('temp'), list) or not all(isinstance(item, str) for item in data['temp']):
        return jsonify({"error": "Invalid data format. 'temp' must be a one-dimensional array of strings."}), 400

    email = Email(
        temp_emails=data.get('temp', []),
        user_id=user.uuid
    )

    try:
        db.session.add(email)
        db.session.commit()
        return jsonify({"message": "Email added"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

def verify_email(email, user_signature):
    expected_signature = hmac.new(SECRET_KEY.encode(), email.encode(), hashlib.sha256).hexdigest()
    print(expected_signature)
    print(user_signature)
    return hmac.compare_digest(expected_signature, user_signature)

# Получение списка использованных email
@app.route('/emails', methods=['GET'])
def get_emails():
    token = request.headers.get('Authorization')
    if token and token.startswith("Bearer "):
        token = token.split(" ")[1]

    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        # Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_uuid = payload['uuid']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    emails = Email.query.filter_by(user_id=user.uuid).all()
    email_list = [{"temp": email.temp_emails} for email in emails]

    return jsonify(email_list), 200


# Получение списка использованных email
@app.route('/main', methods=['GET'])
def get_main_email():
    token = request.headers.get('Authorization')
    if token and token.startswith("Bearer "):
        token = token.split(" ")[1]

    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        # Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_uuid = payload['uuid']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    main_email = user.email
    email_list = {"main": main_email}

    return jsonify(email_list), 200

import random
import string
import hmac
import hashlib

SECRET_KEY = os.getenv('SECRET_KEY')

@app.route('/gen', methods=['GET'])
def generate():
    length = 10
    characters = string.ascii_lowercase + string.digits
    random_letters = ''.join(random.choice(characters) for _ in range(length))
    print(random_letters)
    signature = hmac.new(SECRET_KEY.encode(), random_letters.encode(), hashlib.sha256).hexdigest()
    print(signature)
    return jsonify({"email": random_letters, "signature": signature})

from flask_mail import Mail, Message
from flask_caching import Cache

# Flask-Caching configuration
app.config['CACHE_TYPE'] = 'SimpleCache'  # You can use other cache types like RedisCache for production
app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # Cache timeout in seconds (5 minutes)
cache = Cache(app)

@app.route('/send-confirmation-code', methods=['POST'])
def send_confirmation_code():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    confirmation_code = ''.join(random.choices(string.digits, k=6))
    try:
        # Store the confirmation code in the cache with the email as the key
        cache.set(email, confirmation_code)

        '''
        msg = Message("Your Confirmation Code", recipients=[email])
        msg.body = f"Your confirmation code is: {confirmation_code}"
        mail.send(msg)'''
        print(confirmation_code)
        return jsonify({"message": "Confirmation code sent"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/verify-confirmation-code', methods=['POST'])
def verify_confirmation_code():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({"error": "Email and code are required"}), 400

    # Retrieve the stored confirmation code from the cache
    stored_code = cache.get(email)

    if stored_code and code == stored_code:
        # Optionally, delete the code from the cache after successful verification
        cache.delete(email)

        # Mark the email as confirmed in the cache
        cache.set(f"{email}_confirmed", True)

        return jsonify({"message": "Code is valid"}), 200
    else:
        return jsonify({"error": "Invalid or expired code"}), 400


if __name__ == '__main__':
    app.run(debug=True)
