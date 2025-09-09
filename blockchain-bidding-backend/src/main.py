import os
import sys
from datetime import timedelta
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_session import Session   # NEW

# Add project root to Python path so "src" is always found
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
sys.path.insert(0, PROJECT_ROOT)

from src.models.user import db
from src.routes.user import user_bp

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session & cookie settings
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)



# CORS config
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    supports_credentials=True
)

# Init DB
db.init_app(app)
with app.app_context():
    db.create_all()

# Register routes
app.register_blueprint(user_bp, url_prefix='/api')


# Serve frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
