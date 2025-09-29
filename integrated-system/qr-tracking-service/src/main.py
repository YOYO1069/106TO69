import os
import sys

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.extensions import db

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'qr_tracking_secret_key_2024'

# 啟用 CORS 以支援跨域請求
CORS(app)

# 資料庫配置
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Import models after db is initialized to avoid circular imports
from src.models.user import User
from src.models.qr_code import QRCode, QRScan, UserSubscription

# 創建資料庫表
with app.app_context():
    db.create_all()

# 註冊藍圖
from src.routes.user import user_bp
from src.routes.qr_api import qr_bp
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(qr_bp, url_prefix='/api')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# 健康檢查端點
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'service': 'qr-tracking-service'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

