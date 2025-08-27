# db.py
import sqlite3
import os
import sys

def resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller .exe"""
    try:
        base_path = sys._MEIPASS  # khi chạy trong exe
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# Đảm bảo data folder tồn tại bên ngoài exe
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, "students.db")

def ensure_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # classes table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        teacher TEXT NOT NULL,
        description TEXT
    );
    """)

    # students table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        class_id INTEGER,
        FOREIGN KEY (class_id) REFERENCES classes(id)
    );
    """)

    # tickets table - monthly ticket
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        month TEXT NOT NULL,       -- YYYY-MM
        is_paid INTEGER DEFAULT 0, -- 0 = chưa, 1 = đã đóng
        qr_filename TEXT,          -- tên file QR png
        FOREIGN KEY (student_id) REFERENCES students(id),
        UNIQUE(student_id, month)
    );
    """)

    # attendance table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        date TEXT NOT NULL,        -- YYYY-MM-DD
        status TEXT DEFAULT 'present',
        FOREIGN KEY (student_id) REFERENCES students(id)
    );
    """)

    conn.commit()
    conn.close()

def get_connection():
    ensure_db()
    return sqlite3.connect(DB_PATH, check_same_thread=False)

# Sinh ID học sinh: class_name + số thứ tự 3 chữ số
def generate_student_id(conn, class_id):
    cur = conn.cursor()
    class_id = class_id.strip().upper().replace(" ", "")

    # tìm max số thứ tự hiện có
    cur.execute("SELECT id FROM students WHERE class_id=?", (class_id,))
    ids = [s[0] for s in cur.fetchall()]
    numbers = []
    for sid in ids:
        if sid.startswith(class_id):
            try:
                numbers.append(int(sid[len(class_id):]))
            except:
                pass
    next_num = (max(numbers) + 1) if numbers else 1
    return f"{class_id}{next_num:03d}"
