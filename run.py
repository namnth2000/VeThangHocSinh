# run.py
import threading
import time
import webview
from app import app

def run_flask():
    # khi chạy trong production có thể dùng waitress / gunicorn, đây là dev mode
    app.run(port=5000, debug=False, use_reloader=False)

if __name__ == "__main__":
    t = threading.Thread(target=run_flask, daemon=True)
    t.start()
    # đợi cho flask kịp khởi động
    time.sleep(0.8)
    window = webview.create_window("Vé tháng học sinh", "http://127.0.0.1:5000", width=1100, height=700)
    webview.start()
