# app.py
from flask import Flask, jsonify, request, send_from_directory, render_template
from db import get_connection, ensure_db
from qrcode_utils import generate_qr_for_ticket, QRCODE_DIR
import os
from datetime import datetime

ensure_db()
app = Flask(__name__, static_folder="static", template_folder="templates")

# --- Static / index route ---
@app.route("/")
def index():
    return render_template("index.html")

# --- Serve qrcodes ---
@app.route("/qrcodes/<path:filename>")
def qrcode_file(filename):
    return send_from_directory(QRCODE_DIR, filename)

# --- Classes CRUD ---
@app.route("/api/classes", methods=["GET", "POST"])
def classes_handler():
    conn = get_connection()
    cur = conn.cursor()
    if request.method == "GET":
        cur.execute("SELECT id, name, description FROM classes")
        rows = cur.fetchall()
        conn.close()
        return jsonify([{"id":r[0],"name":r[1],"description":r[2]} for r in rows])
    data = request.json
    cur.execute("INSERT INTO classes (name, description) VALUES (?,?)", (data.get("name"), data.get("description")))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"id": new_id}), 201

@app.route("/api/classes/<int:class_id>", methods=["PUT", "DELETE"])
def class_modify(class_id):
    conn = get_connection()
    cur = conn.cursor()
    if request.method == "PUT":
        data = request.json
        cur.execute("UPDATE classes SET name=?, description=? WHERE id=?", (data.get("name"), data.get("description"), class_id))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    else:
        cur.execute("DELETE FROM classes WHERE id=?", (class_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

# --- Students CRUD ---
@app.route("/api/students", methods=["GET", "POST"])
def students_handler():
    conn = get_connection()
    cur = conn.cursor()
    if request.method == "GET":
        cur.execute("""SELECT s.id, s.name, s.phone, s.class_id, c.name
                       FROM students s LEFT JOIN classes c ON s.class_id = c.id""")
        rows = cur.fetchall()
        conn.close()
        res = []
        for r in rows:
            res.append({
                "id": r[0], "name": r[1], "phone": r[2], "class_id": r[3], "class_name": r[4]
            })
        return jsonify(res)
    data = request.json
    cur.execute("INSERT INTO students (name, phone, class_id) VALUES (?,?,?)",
                (data.get("name"), data.get("phone"), data.get("class_id")))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"id": new_id}), 201

@app.route("/api/students/<int:stud_id>", methods=["PUT", "DELETE"])
def student_modify(stud_id):
    conn = get_connection()
    cur = conn.cursor()
    if request.method == "PUT":
        data = request.json
        cur.execute("UPDATE students SET name=?, phone=?, class_id=? WHERE id=?",
                    (data.get("name"), data.get("phone"), data.get("class_id"), stud_id))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    else:
        cur.execute("DELETE FROM students WHERE id=?", (stud_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

# --- Tickets (create or mark paid, generate QR) ---
@app.route("/api/tickets", methods=["GET", "POST"])
def tickets_handler():
    conn = get_connection()
    cur = conn.cursor()
    if request.method == "GET":
        # optional query student_id or month
        student_id = request.args.get("student_id")
        month = request.args.get("month")
        q = "SELECT id, student_id, month, is_paid, qr_filename FROM tickets WHERE 1=1"
        params = []
        if student_id:
            q += " AND student_id=?"
            params.append(student_id)
        if month:
            q += " AND month=?"
            params.append(month)
        cur.execute(q, params)
        rows = cur.fetchall()
        conn.close()
        return jsonify([{"id":r[0],"student_id":r[1],"month":r[2],"is_paid":bool(r[3]),"qr_filename":r[4]} for r in rows])

    # POST: create ticket record and generate QR if needed
    data = request.json
    student_id = data["student_id"]
    month = data["month"]  # expect YYYY-MM
    is_paid = 1 if data.get("is_paid") else 0

    # payload for QR: simple JSON string - you may change to URL or token
    payload = {
        "student_id": student_id,
        "month": month,
        "issued_at": datetime.utcnow().isoformat()
    }
    import json
    payload_str = json.dumps(payload, ensure_ascii=False)

    # generate qr
    qr_filename = generate_qr_for_ticket(student_id, month, payload_str)

    try:
        cur.execute("INSERT INTO tickets (student_id, month, is_paid, qr_filename) VALUES (?,?,?,?)",
                    (student_id, month, is_paid, qr_filename))
        conn.commit()
    except Exception as e:
        # unique constraint or other error
        conn.close()
        return jsonify({"error": str(e)}), 400

    conn.close()
    return jsonify({"ok": True, "qr_filename": qr_filename}), 201

@app.route("/api/tickets/<int:ticket_id>/pay", methods=["POST"])
def ticket_pay(ticket_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE tickets SET is_paid=1 WHERE id=?", (ticket_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# --- Attendance ---
@app.route("/api/attendance", methods=["GET", "POST"])
def attendance_handler():
    conn = get_connection()
    cur = conn.cursor()
    if request.method == "GET":
        # optional date filter
        date = request.args.get("date")
        q = "SELECT id, student_id, date, status FROM attendance WHERE 1=1"
        params = []
        if date:
            q += " AND date=?"
            params.append(date)
        cur.execute(q, params)
        rows = cur.fetchall()
        conn.close()
        return jsonify([{"id":r[0],"student_id":r[1],"date":r[2],"status":r[3]} for r in rows])

    data = request.json
    student_id = data["student_id"]
    date = data.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
    status = data.get("status") or "present"
    cur.execute("INSERT INTO attendance (student_id, date, status) VALUES (?,?,?)", (student_id, date, status))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"id": new_id}), 201

if __name__ == "__main__":
    app.run(port=5000)
