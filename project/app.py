from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from models import db, User, Email, Deactivated
from passlib.hash import bcrypt
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
import os
import jwt
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Enable CORS and explicitly allow the Authorization header used by the frontend
app.config['CORS_HEADERS'] = 'Content-Type,Authorization'
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])

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
    if not data or 'data' not in data:
        return jsonify({"error": "Invalid payload. Expecting key 'data' with email array."}), 400
    if not isinstance(data.get('data'), list) or not all(isinstance(item, str) for item in data['data']):
        return jsonify({"error": "Invalid data format. 'data' must be a one-dimensional array of strings."}), 400

    # Verify signature if present (index 3)
    try:
        if not verify_email(data.get('data')[0], data.get('data')[3]):
            return jsonify({"error": "Email verification failed"}), 400
    except Exception:
        # if signature not present or verify fails due to structure, continue to error above
        return jsonify({"error": "Email verification failed or malformed data"}), 400

    email = Email(
        data=data.get('data', []),
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
    email_list = [{"uuid": str(email.uuid), "data": email.data} for email in emails]

    return jsonify({"emails": email_list}), 200


# Получение главного email
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


@app.route('/change-email', methods=['POST'])
def change_email():
    """Change the authenticated user's main email.

    Expects JSON: { "email": "new@example.com" }
    Requires Authorization: Bearer <token> header. Only updates the user's
    email field after verifying the JWT; returns 200 on success.
    """
    token = request.headers.get('Authorization')
    if token and token.startswith("Bearer "):
        token = token.split(" ")[1]

    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_uuid = payload['uuid']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    new_email = data.get('email')
    if not new_email or not isinstance(new_email, str):
        return jsonify({"error": "Invalid payload. Expecting key 'email' with new address."}), 400

    # Minimal normalization
    new_email = new_email.strip()

    try:
        user.email = new_email
        db.session.commit()
        return jsonify({"message": "Email changed", "email": new_email}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Добавление email (требует аутентификации через JWT)
@app.route('/deactivate', methods=['POST'])
def deactivate_email():
    """Deactivate an email alias for the authenticated user.

    Expects JSON: { "data": "localpart" }

    Authentication: looks for JWT in cookie named 'token', falling back to
    Authorization: Bearer <token> header. Verifies the token, ensures the
    email belongs to the authenticated user, then creates a Deactivated record
    and removes the original Email rows for that user/email.
    """
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
    print("USER AND USER ID: ")
    print(user)
    print(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    payload = request.get_json() or {}
    print(payload)

    # Accept either full 'data' (array/dict) or legacy 'email' string
    entry = None
    email_local = None
    if 'data' in payload:
        entry = payload.get('data')
        # determine local-part from entry
        if isinstance(entry, list) and len(entry) > 0:
            email_local = str(entry[0]).lower()
        elif isinstance(entry, dict):
            email_local = str(entry.get('email') or entry.get('local') or '').lower()
        else:
            return jsonify({"error": "Invalid data format. 'data' must be an array or object."}), 400
    else:
        return jsonify({"error": "Invalid payload. Provide 'data' or 'email'."}), 400

    # Find the Email row that belongs to this user and matches the given local-part or exact data
    user_emails = Email.query.filter_by(user_id=user.uuid).all()
    target = None
    for e in user_emails:
        try:
            temp = e.data[0]
            if temp == email_local:
                target = e
        except Exception:
            continue

    if not target:
        return jsonify({"error": "Email not found or does not belong to the user"}), 404

    # Create Deactivated record (store full email data as JSONB)
    try:
        # prefer caller-provided entry (from payload) but fall back to the Email row's stored data
        if entry is None:
            entry = target.temp_emails

        # Avoid duplicate deactivated entries by checking stored data
        already = None
        existing = Deactivated.query.filter_by(user_id=user.uuid).all()
        for r in existing:
            try:
                ddata = r.data
                if isinstance(ddata, list) and len(ddata) > 0 and str(ddata[0]).lower() == email_local:
                    already = r
                    break
                if isinstance(ddata, dict) and (str(ddata.get('email','')).lower() == email_local or str(ddata.get('local','')).lower() == email_local):
                    already = r
                    break
            except Exception:
                continue

        if already:
            # still delete the original Email row if present
            db.session.delete(target)
            db.session.commit()
            return jsonify({"message": "Email already deactivated"}), 200

        d = Deactivated(data=entry, user_id=user.uuid)
        db.session.add(d)
        # remove the Email row from emails table
        db.session.delete(target)
        db.session.commit()
        return jsonify({"message": "Email deactivated"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/deactivated', methods=['GET'])
def get_deactivated_emails():
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

    deactivated_rows = Deactivated.query.filter_by(user_id=user.uuid).all()
    # return stored data along with uuid for each deactivated entry (no created_at)
    email_list = []
    for d in deactivated_rows:
        item = {
            "uuid": str(d.uuid),
            "data": d.data,
        }
        email_list.append(item)

    return jsonify(email_list), 200


@app.route('/activate', methods=['POST'])
def activate_email():
    """Activate an email previously deactivated.

    Expects JSON: { "email": "localpart" , "service": "optional service name", "serviceUrl": "optional" }
    Auth via Authorization: Bearer <token> header.
    """
    token = request.headers.get('Authorization')
    if token and token.startswith("Bearer "):
        token = token.split(" ")[1]

    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_uuid = payload['uuid']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.get_json() or {}
    # Require full data array in payload (no legacy 'email' support)
    if 'data' not in payload or not isinstance(payload.get('data'), list):
        return jsonify({"error": "Invalid payload. Expecting key 'data' with email array."}), 400

    entry = payload.get('data')
    # extract local-part
    if not entry or not isinstance(entry, list) or len(entry) == 0:
        return jsonify({"error": "Invalid data array."}), 400
    email_local = str(entry[0]).lower()

    # Find the Deactivated row that exactly matches this data for the user
    drow = None
    deactivated_rows = Deactivated.query.filter_by(user_id=user.uuid).all()
    for d in deactivated_rows:
        try:
            if d.data == entry:
                drow = d
                break
        except Exception:
            continue

    if not drow:
        return jsonify({"error": "Deactivated entry not found for this data"}), 404

    # Prevent adding duplicate active email by local-part
    existing_emails = Email.query.filter_by(user_id=user.uuid).all()
    for e in existing_emails:
        try:
            temp = e.data
            if isinstance(temp, list) and len(temp) > 0 and str(temp[0]).lower() == email_local:
                return jsonify({"error": "Email already active"}), 400
        except Exception:
            continue

    # Use provided entry as-is when creating the active Email record
    try:
        new_email = Email(data=entry, user_id=user.uuid)
        db.session.add(new_email)
        # remove deactivated row
        db.session.delete(drow)
        db.session.commit()
        return jsonify({"message": "Email activated", "data": entry}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
'''
@app.route('/deactivate', methods=['POST'])
def deactivate_email():
    """Deactivate an email alias for the authenticated user.

    Expects JSON: { "email": "localpart" }

    Authentication: looks for JWT in cookie named 'token', falling back to
    Authorization: Bearer <token> header. Verifies the token, ensures the
    email belongs to the authenticated user, then creates a Deactivated record
    and removes the original Email rows for that user/email.
    """
    # Accept token from cookie first, then Authorization header
    token = request.cookies.get('token')
    if not token:
        token_hdr = request.headers.get('Authorization')
        if token_hdr and token_hdr.startswith('Bearer '):
            token = token_hdr.split(' ')[1]

    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_uuid = payload['uuid']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    raw_email = data.get('email')
    if not raw_email:
        return jsonify({"error": "Email is required"}), 400

    # Normalize input: accept either full address or local-part
    raw_email = str(raw_email).strip()
    if '@' in raw_email:
        email_local = raw_email.split('@', 1)[0].lower()
    else:
        email_local = raw_email.lower()

    # Find the first Email row that belongs to this user and matches the local-part
    user_emails = Email.query.filter_by(user_id=user.uuid).all()
    target = None
    for e in user_emails:
        try:
            temp = e.temp_emails
            # temp expected as list where temp[0] is local-part, or as dict with keys 'email'/'local'
            if isinstance(temp, list) and len(temp) > 0 and str(temp[0]).lower() == email_local:
                target = e
                break
            if isinstance(temp, dict) and (str(temp.get('email', '')).lower() == email_local or str(temp.get('local', '')).lower() == email_local):
                target = e
                break
        except Exception:
            continue

    if not target:
        return jsonify({"error": "Email not found or does not belong to the user"}), 404

    try:
        entry = target.temp_emails

        # Get or create the user's Deactivated row (one row per user)
        d = Deactivated.query.filter_by(user_id=user.uuid).first()
        if not d:
            d = Deactivated(deactivated_emails=[entry], user_id=user.uuid)
            db.session.add(d)
        else:
            if not isinstance(d.deactivated_emails, list):
                d.deactivated_emails = [] if d.deactivated_emails is None else [d.deactivated_emails]

            # Avoid duplicates (case-insensitive compare on local-part)
            exists = False
            for existing in d.deactivated_emails:
                try:
                    if isinstance(existing, list) and isinstance(entry, list) and len(existing) > 0 and len(entry) > 0 and str(existing[0]).lower() == str(entry[0]).lower():
                        exists = True
                        break
                    if isinstance(existing, dict) and isinstance(entry, dict) and (str(existing.get('email','')).lower() == str(entry.get('email','')).lower() or str(existing.get('local','')).lower() == str(entry.get('local','')).lower()):
                        exists = True
                        break
                except Exception:
                    continue

            if not exists:
                d.deactivated_emails.append(entry)
            else:
                # Already deactivated; nothing to do
                return jsonify({"message": "Email already deactivated"}), 200

        # delete only the targeted Email row
        db.session.delete(target)
        db.session.commit()
        return jsonify({"message": "Email deactivated"}), 200
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500
'''
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


@app.route('/delete-account', methods=['DELETE', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'Authorization'])
def delete_account():
    """Delete the authenticated user's account and related data.

    Requires Authorization: Bearer <token> header containing a valid JWT.
    Deletes Email and Deactivated records for the user, then deletes the User.
    """
    token = request.headers.get('Authorization')
    if token and token.startswith("Bearer "):
        token = token.split(" ")[1]

    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_uuid = payload['uuid']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # Delete related rows first (safe even if cascade exists)
        Email.query.filter_by(user_id=user.uuid).delete(synchronize_session=False)
        Deactivated.query.filter_by(user_id=user.uuid).delete(synchronize_session=False)
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Account deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
