# qrcode_utils.py
import qrcode
import os
from datetime import datetime
import sys

def get_base_dir():
    """Lấy thư mục chạy thực tế (nơi có .exe)"""
    if getattr(sys, 'frozen', False):
        # khi chạy bằng exe
        return os.path.dirname(os.path.abspath(sys.argv[0]))
    else:
        # khi chạy bằng python
        return os.path.abspath(".")

# Đảm bảo thư mục qrcodes tồn tại ngoài exe
QRCODE_DIR = os.path.join(get_base_dir(), "qrcodes")
os.makedirs(QRCODE_DIR, exist_ok=True)

def generate_qr_for_ticket(student_id: int, month: str, payload: str) -> str:
    """
    Tạo QR png cho ticket. payload có thể là JSON/URL/chuỗi bất kỳ.
    Trả về tên file (rel path under qrcodes).
    """
    filename = f"ticket_s{student_id}_{month.replace('-', '')}_{int(datetime.utcnow().timestamp())}.png"
    path = os.path.join(QRCODE_DIR, filename)

    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(path)
    return filename
