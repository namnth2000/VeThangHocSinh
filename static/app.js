// static/app.js
const el = id => document.getElementById(id);
let currentView = 'students';

function $(s) { return document.querySelector(s); }

document.addEventListener('DOMContentLoaded', () => {
  // nav
  el('nav-classes').addEventListener('click', () => showView('classes'));
  el('nav-students').addEventListener('click', () => showView('students'));
  el('nav-tickets').addEventListener('click', () => showView('tickets'));
  el('nav-att').addEventListener('click', () => showView('attendance'));

  el('btn-add').addEventListener('click', () => openAddModal());

  el('modal-close').addEventListener('click', closeModal);

  showView('students');
});

function showView(view) {
  currentView = view;
  el('view-title').innerText = {
    classes: 'Danh sách lớp',
    students: 'Danh sách học sinh',
    tickets: 'Quản lý vé tháng',
    attendance: 'Điểm danh'
  }[view] || 'Danh sách';

  // change add button label
  el('btn-add').innerText = view === 'classes' ? '+ Thêm lớp' : view === 'students' ? '+ Thêm học sinh' : view === 'tickets' ? '+ Tạo vé' : '+ Thêm điểm danh';

  // load data
  if (view === 'students') loadStudents();
  else if (view === 'classes') loadClasses();
  else if (view === 'tickets') loadTickets();
  else if (view === 'attendance') loadAttendance();
}

function openModal(html) {
  el('modal-content').innerHTML = html;
  el('modal').classList.remove('hidden');
}

function closeModal() {
  el('modal').classList.add('hidden');
  el('modal-content').innerHTML = '';
}

// ------------ CLASSES -------------
async function loadClasses() {
  const res = await fetch('/api/classes');
  const data = await res.json();
  let html = `<table class="table"><thead><tr><th>ID</th><th>Tên lớp</th><th>Giáo viên</th><th>Mô tả</th><th>Hành động</th></tr></thead><tbody>`;
  data.forEach(c => {
    html += `<tr>
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>${c.teacher}</td>
      <td>${c.description || ''}</td>
      <td>
        <button class="small-btn btn-edit" onclick="showEditClass(${c.id})">Sửa</button>
        <button class="small-btn btn-del" onclick="delClass(${c.id})">Xóa</button>
      </td></tr>`;
  });
  html += `</tbody></table>`;
  el('table-wrap').innerHTML = html;
}

function showEditClass(id) {
  fetch(`/api/classes`)
    .then(r => r.json())
    .then(list => {
      const c = list.find(x => x.id === id);
      const html = `<h3>Sửa lớp</h3>
        <div class="form-row"><label>ID</label><input id="class-id" value="${c.id}"></div>
        <div class="form-row"><label>Tên lớp</label><input id="class-name" value="${c.name}"></div>
        <div class="form-row"><label>Giáo viên</label><input id="class-teacher" value="${c.teacher}"></div>
        <div class="form-row"><label>Mô tả</label><input id="class-desc" value="${c.description || ''}"></div>
        <div style="text-align:right"><button class="btn" onclick="saveEditClass(${id})">Lưu</button></div>`;
      openModal(html);
    });
}

function saveEditClass(id) {
  const name = el('class-name').value;
  const teacher = el('class-teacher').value;
  const desc = el('class-desc').value;
  fetch(`/api/classes/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id, name, teacher, description:desc}) })
    .then(()=>{ closeModal(); loadClasses(); });
}

function delClass(id) {
  if (!confirm('Xác nhận xóa lớp?')) return;
  fetch(`/api/classes/${id}`, { method: 'DELETE' }).then(()=> loadClasses());
}

// ------------ STUDENTS -------------
async function loadStudents(classFilter="") {
  let url = '/api/students';
  if (classFilter) url += '?class_id=' + classFilter;
  const res = await fetch(url);
  const data = await res.json();

  const classesRes = await fetch('/api/classes');
  const classes = await classesRes.json();

  let options = `<option value="">Tất cả lớp</option>`;
  classes.forEach(c => options += `<option value="${c.id}" ${c.id==classFilter?'selected':''}>${c.name}</option>`);
  let filterHtml = `<div><label>Lọc theo lớp:</label><select onchange="loadStudents(this.value)">${options}</select>
    <button onclick="downloadTemplate()">Tải file mẫu</button>
    <input type="file" id="importFile" onchange="importStudents(this.files[0])"></div>`;

  let html = filterHtml + `<table class="table"><thead><tr><th>ID</th><th>Tên</th><th>Lớp</th><th>SĐT</th><th>Hành động</th></tr></thead><tbody>`;
  data.forEach(s => {
    html += `<tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.class_name || ''}</td>
      <td>${s.phone || ''}</td>
      <td>
        <button class="small-btn btn-view" onclick="viewStudent(${s.id})">Xem</button>
        <button class="small-btn btn-edit" onclick="editStudent(${s.id})">Sửa</button>
        <button class="small-btn btn-del" onclick="delStudent(${s.id})">Xóa</button>
      </td>
    </tr>`;
  });
  html += `</tbody></table>`;
  el('table-wrap').innerHTML = html;
}

function downloadTemplate() {
  window.location.href = '/static/template.xlsx';
}

function importStudents(file) {
  const formData = new FormData();
  formData.append('file', file);
  fetch('/api/students/import', { method:'POST', body:formData })
    .then(r=>r.json())
    .then(()=> loadStudents());
}

function openAddModal() {
  if (currentView === 'students') showAddStudent();
  else if (currentView === 'classes') showAddClass();
  else if (currentView === 'tickets') showCreateTicket();
  else if (currentView === 'attendance') showAddAttendance();
}

function showAddClass() {
  const html = `<h3>Thêm lớp</h3>
    <div class="form-row"><label>ID</label><input id="class-id"></div>
    <div class="form-row"><label>Tên lớp</label><input id="class-name"></div>
    <div class="form-row"><label>Giáo viên</label><input id="class-teacher"></div>
    <div class="form-row"><label>Mô tả</label><input id="class-desc"></div>
    <div style="text-align:right"><button class="btn" onclick="saveNewClass()">Tạo</button></div>`;
  openModal(html);
}

function saveNewClass() {
  const id = el('class-id').value;
  const name = el('class-name').value;
  const teacher = el('class-teacher').value;
  const desc = el('class-desc').value;
  fetch('/api/classes', { 
    method:'POST', 
    headers:{'Content-Type':'application/json'}, 
    body: JSON.stringify({id, name, teacher, description:desc}) 
  }).then(()=> { closeModal(); loadClasses(); });
}

function showAddStudent() {
  // fetch classes for select
  fetch('/api/classes').then(r=>r.json()).then(classes=>{
    let options = '<option value="">- Chọn lớp -</option>';
    classes.forEach(c => options += `<option value="${c.id}">${c.name}</option>`);
    const html = `<h3>Thêm học sinh</h3>
      <div class="form-row"><label>Tên</label><input id="stu-name"></div>
      <div class="form-row"><label>SĐT</label><input id="stu-phone"></div>
      <div class="form-row"><label>Lớp</label><select id="stu-class">${options}</select></div>
      <div style="text-align:right"><button class="btn" onclick="saveNewStudent()">Tạo</button></div>`;
    openModal(html);
  });
}

function saveNewStudent() {
  const name = el('stu-name').value;
  const phone = el('stu-phone').value;
  const class_id = el('stu-class').value || null;
  fetch('/api/students', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, phone, class_id}) })
    .then(()=> { closeModal(); loadStudents(); });
}

function editStudent(id) {
  fetch(`/api/students`).then(r=>r.json()).then(list=>{
    const s = list.find(x=>x.id===id);
    fetch('/api/classes').then(r=>r.json()).then(classes=>{
      let options = '<option value="">- Chọn lớp -</option>';
      classes.forEach(c => options += `<option ${c.id===s.class_id ? 'selected' : ''} value="${c.id}">${c.name}</option>`);
      const html = `<h3>Sửa học sinh</h3>
        <div class="form-row"><label>Tên</label><input id="stu-name" value="${s.name}"></div>
        <div class="form-row"><label>SĐT</label><input id="stu-phone" value="${s.phone || ''}"></div>
        <div class="form-row"><label>Lớp</label><select id="stu-class">${options}</select></div>
        <div style="text-align:right"><button class="btn" onclick="saveEditStudent(${id})">Lưu</button></div>`;
      openModal(html);
    });
  });
}

function saveEditStudent(id) {
  const name = el('stu-name').value;
  const phone = el('stu-phone').value;
  const class_id = el('stu-class').value || null;
  fetch(`/api/students/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, phone, class_id}) })
    .then(()=> { closeModal(); loadStudents(); });
}

function delStudent(id) {
  if (!confirm('Xác nhận xóa học sinh?')) return;
  fetch(`/api/students/${id}`, { method: 'DELETE' }).then(()=> loadStudents());
}

function viewStudent(id) {
  fetch(`/api/students`).then(r=>r.json()).then(list=>{
    const s = list.find(x=>x.id===id);
    // show tickets and attendance
    Promise.all([
      fetch(`/api/tickets?student_id=${id}`).then(r=>r.json()),
      fetch(`/api/attendance?date=${new Date().toISOString().slice(0,10)}`).then(r=>r.json())
    ]).then(([tickets, attendance])=>{
      const myTickets = tickets.filter(t => t.student_id === id);
      let tHtml = '<h4>Vé tháng</h4>';
      if (myTickets.length===0) tHtml += '<div>Chưa có vé</div>';
      else {
        myTickets.forEach(t => {
          tHtml += `<div>Tháng: ${t.month} - Trạng thái: ${t.is_paid ? 'Đã đóng' : 'Chưa đóng'} 
            ${t.qr_filename ? `<button class="small-btn btn-view" onclick="openQR('${t.qr_filename}')">QR</button>` : ''}
            <button class="small-btn btn-del" onclick="delTicket(${t.id})">Xóa vé</button></div>`;
        });
      }

      let html = `<h3>Thông tin</h3>
        <div><b>Tên:</b> ${s.name}</div>
        <div><b>SĐT:</b> ${s.phone || ''}</div>
        <div><b>Lớp:</b> ${s.class_name || ''}</div>
        <div style="margin-top:10px">${tHtml}</div>
        <div style="text-align:right;margin-top:14px"><button class="btn" onclick="closeModal()">Đóng</button></div>`;
      openModal(html);
    });
  });
}

function delTicket(id) {
  if (!confirm('Xóa vé này?')) return;
  fetch(`/api/tickets/${id}`, {method:'DELETE'}).then(()=> loadTickets());
}

function openQR(filename) {
  const url = `/qrcodes/${filename}`;
  // show image in modal
  const html = `<h3>QR Ticket</h3><div style="text-align:center"><img src="${url}" style="max-width:100%; height:auto;"></div>
    <div style="text-align:right;margin-top:10px"><a href="${url}" download class="btn">Tải xuống</a></div>`;
  openModal(html);
}

// ------------ TICKETS -------------
async function loadTickets() {
  const res = await fetch('/api/tickets');
  const data = await res.json();
  let html = `<table class="table"><thead><tr><th>ID</th><th>Student</th><th>Tháng</th><th>Trạng thái</th><th>QR</th><th>Hành động</th></tr></thead><tbody>`;
  for (const t of data) {
    // get student name
    let sRes = await fetch(`/api/students`);
    let students = await sRes.json();
    const s = students.find(x => x.id === t.student_id);
    html += `<tr>
      <td>${t.id}</td>
      <td>${s ? s.name : t.student_id}</td>
      <td>${t.month}</td>
      <td>${t.is_paid ? 'Đã đóng' : 'Chưa đóng'}</td>
      <td>${t.qr_filename ? `<button class="small-btn btn-view" onclick="openQR('${t.qr_filename}')">Xem</button>` : ''}</td>
      <td>${t.is_paid ? '' : `<button class="small-btn btn-edit" onclick="markPaid(${t.id})">Đánh dấu đã đóng</button>`}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  el('table-wrap').innerHTML = html;
}

function showCreateTicket(){
  fetch('/api/students').then(r=>r.json()).then(students=>{
    let opts = '<option value="">- Chọn học sinh -</option>';
    students.forEach(s => opts += `<option value="${s.id}">${s.name} (${s.class_name||''})</option>`);
    const html = `<h3>Tạo vé tháng</h3>
      <div class="form-row"><label>Học sinh</label><select id="ticket-stu">${opts}</select></div>
      <div class="form-row"><label>Tháng (YYYY-MM)</label><input id="ticket-month" placeholder="2025-08"></div>
      <div class="form-row"><label>Đã đóng?</label><select id="ticket-paid"><option value="0">Chưa</option><option value="1">Đã đóng</option></select></div>
      <div style="text-align:right"><button class="btn" onclick="createTicket()">Tạo</button></div>`;
    openModal(html);
  });
}

function createTicket() {
  const student_id = el('ticket-stu').value;
  const month = el('ticket-month').value;
  const is_paid = el('ticket-paid').value === '1';
  if (!student_id || !month) { alert('Chọn học sinh và tháng'); return; }
  fetch('/api/tickets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({student_id: student_id, month, is_paid}) })
    .then(r=>r.json())
    .then(resp => { 
      if (resp.error) alert('Lỗi: ' + resp.error);
      closeModal(); loadTickets();
    });
}

function markPaid(id) {
  fetch(`/api/tickets/${id}/pay`, { method:'POST' }).then(()=> loadTickets());
}

// ------------ ATTENDANCE -------------
async function loadAttendance() {
  const today = new Date().toISOString().slice(0,10);
  const res = await fetch(`/api/attendance?date=${today}`);
  const data = await res.json();
  let html = `<div>Ngày: ${today}</div>`;
  html += `<table class="table"><thead><tr><th>ID</th><th>Học sinh</th><th>Trạng thái</th></tr></thead><tbody>`;
  for (const a of data) {
    let students = await (await fetch('/api/students')).json();
    const s = students.find(x=>x.id===a.student_id);
    html += `<tr><td>${a.id}</td><td>${s ? s.name : a.student_id}</td><td>${a.status}</td></tr>`;
  }
  html += `</tbody></table>`;
  el('table-wrap').innerHTML = html;
}

function showAddAttendance() {
  fetch('/api/students').then(r=>r.json()).then(students=>{
    let opts = '<option value="">- Chọn học sinh -</option>';
    students.forEach(s => opts += `<option value="${s.id}">${s.name}</option>`);
    const html = `<h3>Thêm điểm danh</h3>
      <div class="form-row"><label>Học sinh</label><select id="att-stu">${opts}</select></div>
      <div class="form-row"><label>Ngày</label><input id="att-date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="form-row"><label>Trạng thái</label><select id="att-status"><option value="present">Có mặt</option><option value="absent">Vắng</option></select></div>
      <div style="text-align:right"><button class="btn" onclick="createAttendance()">Lưu</button></div>`;
    openModal(html);
  });
}

function createAttendance() {
  const student_id = el('att-stu').value;
  const date = el('att-date').value;
  const status = el('att-status').value;
  if (!student_id || !date) { alert('Thiếu thông tin'); return; }
  fetch('/api/attendance', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({student_id:Number(student_id), date, status}) })
    .then(()=> { closeModal(); loadAttendance(); });
}
