import random
import time
import os
import psycopg2
import hashlib  # [SECURE] Added for SHA-256 hashing
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, send_from_directory, make_response
from flask_cors import CORS
from flask_compress import Compress
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask_socketio import SocketIO, join_room, emit

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
Compress(app)  # Enable Gzip compression for all text-based assets (HTML, CSS, JS)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# [FALLBACK] In-memory store if Neon is unreachable
# Use this as secondary storage to ensure service continuity
temp_otp_store = {}

# --- POSTGRES DATABASE INITIALIZATION ---
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    if not DATABASE_URL:
        return None
    try:
        return psycopg2.connect(DATABASE_URL, connect_timeout=5)
    except Exception as e:
        print(f"Database Connection Error: {e}")
        return None

def init_db():
    try:
        print("Initializing database connection in background...")
        conn = get_db_connection()
        if not conn:
            print("No DATABASE_URL found or connection failed. Running with in-memory fallback only.")
            return
            
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS otps (
                email TEXT PRIMARY KEY,
                otp TEXT NOT NULL,
                expiry DOUBLE PRECISION NOT NULL
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Database Initialization Error: {e}")
        print("Fallback Active: App is using in-memory OTP storage.")

OTP_EXPIRY_SECONDS = 240  # 4 minutes

# --- CONFIGURATION ---
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "").strip()
# Clean up spaces from Google App Password if present
APP_PASSWORD = os.getenv("APP_PASSWORD", "").replace(" ", "")
RECEIVER_EMAIL = os.getenv("RECEIVER_EMAIL", "").strip()

def send_email_task(to_email, subject, body):
    """Function to send emails in a background task."""
    try:
        print(f"Attempting email dispatch to: {to_email}")
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Added 10s timeout to prevent hanging connections
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Background Dispatch Successful: {to_email}")
    except Exception as e:
        print(f"Background Email Error for {to_email}: {str(e)}")

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def custom_static(filename):
    """Saves static files with high cache-control headers for maximum speed."""
    response = make_response(send_from_directory(app.static_folder, filename))
    # Cache for 1 year (31,536,000 seconds)
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    return response

@app.route('/tictactoe')
def tictactoe():
    return render_template('tictactoe.html')

@app.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.json
        user_email = data.get('email')
        if not user_email:
            return jsonify({"success": False, "message": "Email is required"}), 400
        
        # Generation
        otp = str(random.randint(100000, 999999))
        expiry = time.time() + OTP_EXPIRY_SECONDS

        # [SECURE] Hash the OTP immediately before storing it
        otp_hash = hashlib.sha256(otp.encode()).hexdigest()

        # [DATABASE] Try to push to Neon, fallback to memory if error
        db_success = False
        try:
            conn = get_db_connection()
            if conn:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO otps (email, otp, expiry)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (email) DO UPDATE 
                    SET otp = EXCLUDED.otp, expiry = EXCLUDED.expiry
                """, (user_email, otp_hash, expiry))
                conn.commit()
                cur.close()
                conn.close()
                db_success = True
                print(f"OTP stored in Neon for {user_email}")
        except Exception as db_err:
            print(f"Neon Database Storage Error: {db_err}")

        if not db_success:
            # Store in local memory if DB fails
            temp_otp_store[user_email] = {"otp": otp_hash, "expiry": expiry}
            print(f"OTP stored in Memory for {user_email}")

        # Synchronous dispatch for critical OTP integrity
        body = f"Hello,\n\nYour verification OTP is: {otp}\nThis OTP is valid for 4 minutes.\n\nIf you didn't request this, please ignore this email."
        subject = "Verification OTP - Portfolio Contact"
        send_email_task(user_email, subject, body)
        
        return jsonify({
            "success": True, 
            "message": "OTP dispatched" + (" and stored in Neon" if db_success else " (Stored in Memory Fallback)")
        }), 200

    except Exception as e:
        print(f"Send OTP Error: {str(e)}")
        return jsonify({"success": False, "message": f"Server Error: {str(e)}"}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        user_email = data.get('email')
        otp_received = data.get('otp')
        
        if not all([user_email, otp_received]):
            return jsonify({"success": False, "message": "Email and OTP are required"}), 400
            
        hashed_input = hashlib.sha256(otp_received.encode()).hexdigest()
        stored_hash = None
        expiry = None
        source = None

        # 1. Try to fetch from Neon
        try:
            conn = get_db_connection()
            if conn:
                cur = conn.cursor()
                cur.execute("SELECT otp, expiry FROM otps WHERE email = %s", (user_email,))
                record = cur.fetchone()
                if record:
                    stored_hash, expiry = record
                    source = "db"
                cur.close()
                conn.close()
        except Exception as db_err:
            print(f"Neon Retrieval Error during verification: {db_err}")

        # 2. Try memory if not found in DB
        if not stored_hash and user_email in temp_otp_store:
            record = temp_otp_store[user_email]
            stored_hash = record["otp"]
            expiry = record["expiry"]
            source = "memory"

        if not stored_hash:
            return jsonify({"success": False, "message": "No OTP found for this email"}), 400
            
        if time.time() > expiry:
            # Cleanup expired OTP
            if source == "db":
                try:
                    conn = get_db_connection()
                    cur = conn.cursor()
                    cur.execute("DELETE FROM otps WHERE email = %s", (user_email,))
                    conn.commit()
                    conn.close()
                except: pass
            else:
                temp_otp_store.pop(user_email, None)
            return jsonify({"success": False, "message": "OTP has expired. Please request a new one."}), 400
            
        # [SECURE] Compare hashed input
        if hashed_input == stored_hash: 
            # Cleanup on success
            if source == "db":
                try:
                    conn = get_db_connection()
                    cur = conn.cursor()
                    cur.execute("DELETE FROM otps WHERE email = %s", (user_email,))
                    conn.commit()
                    conn.close()
                except: pass
            else:
                temp_otp_store.pop(user_email, None)
            return jsonify({"success": True, "message": "OTP verified successfully!"}), 200
        else:
            return jsonify({"success": False, "message": "Incorrect OTP"}), 400

    except Exception as e:
        print(f"Verify OTP Error: {str(e)}")
        return jsonify({"success": False, "message": f"Server Error: {str(e)}"}), 500

@app.route('/contact', methods=['POST'])
def contact():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        purpose = data.get('purpose')
        message = data.get('message', 'No additional message.')

        if not all([name, email, phone, purpose]):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Create the notification email
        subject = f"New Portfolio Inquiry: {purpose} from {name}"
        body = f"""
        New Contact Form Submission:
        ---------------------------
        Name: {name}
        Email: {email}
        Phone: {phone}
        Purpose: {purpose}
        
        Message:
        {message}
        """

        # Synchronous dispatch for critical enquiry reliability
        send_email_task(RECEIVER_EMAIL, subject, body)

        return jsonify({"success": True, "message": "Enquiry received! Transmission underway."}), 200

    except Exception as e:
        print(f"Contact Error: {str(e)}")
        return jsonify({"success": False, "message": f"Server Error: {str(e)}"}), 500

# --- SOCKET.IO EVENTS FOR TIC TAC TOE ---
@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('joined', {'symbol': 'X' if random.random() > 0.5 else 'O'}, room=request.sid)
    emit('start', room=room, include_self=False)

@socketio.on('move')
def on_move(data):
    room = data['room']
    emit('move', data, room=room, include_self=False)

if __name__ == '__main__':
    # Running on port 5001 to avoid common occupation on port 5000 (macOS AirPlay issue)
    print("Pre-flight checklist: Starting background init...")
    
    # Start DB initialization in the background so it doesn't block startup
    socketio.start_background_task(init_db)
    
    print("Launching verification server on port 5001...")
    socketio.run(app, debug=True, port=5001)
    