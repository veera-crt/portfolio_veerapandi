import random
import time
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Store OTPs in memory: {email: (otp, expiry_time)}
otp_store = {}
OTP_EXPIRY_SECONDS = 240  # 4 minutes

# --- CONFIGURATION ---
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
APP_PASSWORD = os.getenv("APP_PASSWORD", "")
RECEIVER_EMAIL = os.getenv("RECEIVER_EMAIL", "")

@app.route('/', methods=['GET'])
def home():
    return app.send_static_file('index.html')

@app.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.json
        user_email = data.get('email')
        if not user_email:
            return jsonify({"success": False, "message": "Email is required"}), 400
        
        # Simple local rate limiting (can be added if needed)
        
        otp = str(random.randint(100000, 999999))
        expiry = time.time() + OTP_EXPIRY_SECONDS
        otp_store[user_email] = (otp, expiry)

        # Create the OTP email
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = user_email
        msg['Subject'] = "Verification OTP - Portfolio Contact"
        
        body = f"""
        Hello,
        
        Your verification OTP is: {otp}
        This OTP is valid for 4 minutes.
        
        If you didn't request this, please ignore this email.
        """
        msg.attach(MIMEText(body, 'plain'))
        
        # Send the email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return jsonify({"success": True, "message": "OTP sent to your email"}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"success": False, "message": f"Server Error: {str(e)}"}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        user_email = data.get('email')
        otp_received = data.get('otp')
        
        if not all([user_email, otp_received]):
            return jsonify({"success": False, "message": "Email and OTP are required"}), 400
            
        stored_data = otp_store.get(user_email)
        if not stored_data:
            return jsonify({"success": False, "message": "No OTP found for this email"}), 400
            
        stored_otp, expiry = stored_data
        
        if time.time() > expiry:
            otp_store.pop(user_email, None)
            return jsonify({"success": False, "message": "OTP has expired. Please request a new one."}), 400
            
        if otp_received == stored_otp: 
            # Optionally mark as verified or leave it for the frontend to manage
            # We can keep it in store marked as verified if needed, or just return success
            # Here I'll just return success and the frontend will manage the flag
            otp_store.pop(user_email, None) # Remove it after successful verification
            return jsonify({"success": True, "message": "OTP verified successfully!"}), 200
        else:
            return jsonify({"success": False, "message": "Incorrect OTP"}), 400

    except Exception as e:
        print(f"Error: {str(e)}")
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

        # Create the email
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL
        msg['Subject'] = f"New Portfolio Inquiry: {purpose} from {name}"

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
        msg.attach(MIMEText(body, 'plain'))

        # Send the email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()

        return jsonify({"success": True, "message": "Email sent successfully!"}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"success": False, "message": f"Server Error: {str(e)}"}), 500

if __name__ == '__main__':
    # Running on port 5001 to avoid common occupation on port 5000 (macOS AirPlay issue)
    app.run(debug=True, port=5001)
