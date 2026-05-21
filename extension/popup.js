document.addEventListener('DOMContentLoaded', async () => {
  const BACKEND_URL = "http://localhost:5000/api";
  
  let currentTabUrl = "";
  let userId = "";
  let editingNoteId = null; 
  let activeSelectedNote = null; // Lưu trữ note đang xem mở to

  const statusDiv = document.getElementById('status');

  // Lấy bối cảnh tab hiện tại
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTabUrl = tabs[0].url;
      initExtension();
    }
  });

  function initExtension() {
    chrome.storage.local.get(['omniUserId'], (result) => {
      const userIdInput = document.getElementById('userIdInput');
      if (result.omniUserId) {
        userId = result.omniUserId;
        if(userIdInput) userIdInput.style.display = 'none';
        showLinkedBadge();
        
        loadWorkspaces();
        loadNotesForCurrentUrl();
        loadTasksForCurrentUrl();
      } else {
        if(userIdInput) userIdInput.style.display = 'block';
        showStatus("Cấu hình User ID ở Tab Workspace để đồng bộ tài khoản!", "#ef4444");
      }
    });
  }

  function showLinkedBadge() {
    if (document.querySelector('.linked-badge')) return;
    const badge = document.createElement('div');
    badge.className = 'linked-badge';
    badge.textContent = "💼 Đã liên kết đồng bộ tài khoản OmniDash";
    document.body.insertBefore(badge, document.body.firstChild);
  }

  function showStatus(text, color = "#2563eb") {
    statusDiv.textContent = text;
    statusDiv.style.color = color;
  }

  // Luồng xử lý chuyển Tab điều hướng
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // ==========================================
  // TAB 1: WORKSPACE VÀ FIX LỖI 1 TAB
  // ==========================================
  async function loadWorkspaces() {
    const listDiv = document.getElementById('workspaceList');
    listDiv.innerHTML = "";
    try {
      const res = await fetch(`${BACKEND_URL}/workspaces/user/${userId}`);
      if (res.ok) {
        const workspaces = await res.json();
        if(workspaces.length === 0) {
          listDiv.innerHTML = "<p style='font-size:12px;color:#94a3b8;text-align:center;margin-top:15px;'>Chưa có Không gian làm việc nào.</p>";
          return;
        }
        workspaces.forEach(ws => {
          const card = document.createElement('div');
          card.className = 'item-card';
          card.innerHTML = `
            <div class="item-info">
              <div class="item-title" style="color: ${ws.color || '#2563eb'}">📁 ${ws.name}</div>
              <div class="item-desc">Môi trường gồm ${ws.tabs ? ws.tabs.length : 0} thẻ liên kết</div>
            </div>
            <button class="action-btn activate-ws-btn" style="color:#2563eb; background-color:#eff6ff;" title="Kích hoạt bộ Tab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
            </button>
          `;
          
          // FIX TRIỆT ĐỂ LỖI CHỈ MỞ 1 TAB BẰNG DELAY CHROME API
          card.querySelector('.activate-ws-btn').addEventListener('click', () => {
            if (ws.tabs && ws.tabs.length > 0) {
              showStatus(`Đang kích hoạt ${ws.tabs.length} tabs...`, "#f59e0b");
              ws.tabs.forEach((tab, idx) => {
                setTimeout(() => {
                  chrome.tabs.create({ url: tab.url, active: false });
                  if (idx === ws.tabs.length - 1) {
                    showStatus("Mở môi trường thành công!", "#10b981");
                  }
                }, idx * 250); // Mở cách nhau 250ms tránh Chrome Security nuốt Tab
              });
            }
          });
          listDiv.appendChild(card);
        });
      }
    } catch (err) { console.error(err); }
  }

  document.getElementById('saveWsBtn').addEventListener('click', async () => {
    const wsName = document.getElementById('wsName').value.trim();
    const userIdInput = document.getElementById('userIdInput');
    
    if (!userId && userIdInput) {
      const inputId = userIdInput.value.trim();
      if(!inputId) { showStatus("Vui lòng cấu hình User ID trước!", "#ef4444"); return; }
      chrome.storage.local.set({ omniUserId: inputId });
      userId = inputId;
    }

    if (!wsName) { showStatus("Vui lòng đặt tên Không gian!", "#ef4444"); return; }
    showStatus("Đang thu thập dữ liệu tabs...", "#f59e0b");

    chrome.tabs.query({ currentWindow: true }, async (tabs) => {
      const workspaceTabs = tabs.map((t, idx) => ({
        title: t.title || "Trang liên kết",
        url: t.url,
        favicon: t.favIconUrl || "",
        orderIndex: idx
      }));

      try {
        const response = await fetch(`${BACKEND_URL}/workspaces`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, name: wsName, icon: "Briefcase", color: "#3b82f6", tabs: workspaceTabs })
        });

        if (response.ok) {
          showStatus("Lưu không gian làm việc thành công!", "#10b981");
          document.getElementById('wsName').value = "";
          initExtension();
        }
      } catch (err) { showStatus("Không kết nối được API Server.", "#ef4444"); }
    });
  });

  // ==========================================
  // TAB 2: QUẢN LÝ GHI CHÚ VÀ HIỂN THỊ MỞ TO (ZOOM)
  // ==========================================
  async function loadNotesForCurrentUrl() {
    const listDiv = document.getElementById('noteList');
    listDiv.innerHTML = "";
    try {
      const res = await fetch(`${BACKEND_URL}/notes/${userId}?url=${encodeURIComponent(currentTabUrl)}`);
      if (res.ok) {
        const notes = await res.json();
        if(notes.length === 0) {
          listDiv.innerHTML = "<p style='font-size:12px;color:#94a3b8;text-align:center;margin-top:10px;'>Trang hiện tại chưa lưu trữ ghi chú.</p>";
          return;
        }
        notes.forEach(note => {
          const card = document.createElement('div');
          card.className = 'item-card';
          card.style.backgroundColor = note.color || '#ffffff';
          card.style.borderLeft = `5px solid ${darkenColor(note.color || '#cbd5e1')}`;
          
          card.innerHTML = `
            <div class="item-info">
              <div class="item-title">${note.title}</div>
              <div class="item-desc">${note.content || 'Không có mô tả chi tiết...'}</div>
            </div>
            <div class="actions-group">
              <button class="action-btn edit-note-btn" title="Sửa nhanh">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>
              </button>
              <button class="action-btn del-note-btn btn-danger-light" title="Xóa">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          `;

          // CƠ CHẾ CLICK VÀO CARD THÌ PHÓNG TO TOÀN MÀN HÌNH CHỈNH SỬA
          card.querySelector('.item-info').addEventListener('click', () => {
            activeSelectedNote = note;
            openNoteDetailView(note);
          });

          // Sự kiện sửa nhanh
          card.querySelector('.edit-note-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn kích hoạt sự kiện mở to
            activateEditMode(note);
          });

          // Sự kiện xóa nhanh
          card.querySelector('.del-note-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            executeDeleteNote(note.id);
          });

          listDiv.appendChild(card);
        });
      }
    } catch (err) { console.error(err); }
  }

  // ĐIỀU PHỐI ĐÓNG MỞ TO VIEW GHI CHÚ
  function openNoteDetailView(note) {
    document.getElementById('noteFormContainer').style.display = 'none'; // Ẩn form viết nhanh
    const detailView = document.getElementById('noteDetailView');
    
    detailView.style.display = 'block';
    detailView.style.backgroundColor = note.color || '#ffffff';
    detailView.style.borderLeft = `6px solid ${darkenColor(note.color || '#cbd5e1')}`;
    
    document.getElementById('detailTitle').textContent = note.title;
    document.getElementById('detailContent').textContent = note.content || "Không có nội dung mô tả chi tiết...";
  }

  function closeNoteDetailView() {
    document.getElementById('noteDetailView').style.display = 'none';
    document.getElementById('noteFormContainer').style.display = 'block'; // Trả lại form viết nhanh
    activeSelectedNote = null;
  }

  // Kết nối các nút thao tác trong màn hình mở to
  document.getElementById('closeDetailBtn').addEventListener('click', closeNoteDetailView);
  
  document.getElementById('detailEditBtn').addEventListener('click', () => {
    if(activeSelectedNote) {
      const noteToEdit = activeSelectedNote;
      closeNoteDetailView();
      activateEditMode(noteToEdit);
    }
  });

  document.getElementById('detailDelBtn').addEventListener('click', () => {
    if(activeSelectedNote) {
      const noteId = activeSelectedNote.id;
      closeNoteDetailView();
      executeDeleteNote(noteId);
    }
  });

  function activateEditMode(note) {
    editingNoteId = note.id;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteColor').value = note.color;
    document.getElementById('noteFormTitle').textContent = "✏️ Chỉnh sửa nội dung ghi chú";
    document.getElementById('saveNoteBtn').textContent = "Cập nhật";
    document.getElementById('cancelEditNoteBtn').style.display = 'block';
  }

  async function executeDeleteNote(id) {
    if(!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn ghi chú này không?")) return;
    const delRes = await fetch(`${BACKEND_URL}/notes/${id}`, { method: "DELETE" });
    if(delRes.ok) { 
      showStatus("Xóa ghi chú thành công!", "#10b981"); 
      loadNotesForCurrentUrl(); 
    }
  }

  // Lưu/Cập nhật form note
  document.getElementById('saveNoteBtn').addEventListener('click', async () => {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const color = document.getElementById('noteColor').value;

    if(!title) { showStatus("Vui lòng nhập tiêu đề note!", "#ef4444"); return; }
    if(!userId) { showStatus("Cần liên kết tài khoản ở Tab 1 trước!", "#ef4444"); return; }

    try {
      let response;
      if (editingNoteId) {
        response = await fetch(`${BACKEND_URL}/notes/${editingNoteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, color })
        });
      } else {
        response = await fetch(`${BACKEND_URL}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, title, content, color, url: currentTabUrl })
        });
      }

      if (response.ok) {
        showStatus(editingNoteId ? "Đã cập nhật thay đổi!" : "Đã tạo và gán link note mượt mà!", "#10b981");
        resetNoteForm();
        loadNotesForCurrentUrl();
      }
    } catch (err) { console.error(err); }
  });

  document.getElementById('cancelEditNoteBtn').addEventListener('click', resetNoteForm);

  function resetNoteForm() {
    editingNoteId = null;
    document.getElementById('noteTitle').value = "";
    document.getElementById('noteContent').value = "";
    document.getElementById('noteColor').value = "#fef08a";
    document.getElementById('noteFormTitle').textContent = "Viết ghi chú nhanh cho trang này";
    document.getElementById('saveNoteBtn').textContent = "Lưu";
    document.getElementById('cancelEditNoteBtn').style.display = 'none';
  }

  // Hàm bổ trợ tạo màu viền đậm cho Sticky Note có điểm nhấn
  function darkenColor(hex) {
    if(hex === '#ffffff') return '#e2e8f0';
    return hex; 
  }

  // ==========================================
  // TAB 3: TÁC VỤ (GIỮ LUỒNG KHỚP NỐI CHỜ GẮN LINK)
  // ==========================================
  async function loadTasksForCurrentUrl() {
    const projectListDiv = document.getElementById('projectList');
    const taskListDiv = document.getElementById('taskList');
    projectListDiv.innerHTML = "";
    taskListDiv.innerHTML = "";

    try {
      const pRes = await fetch(`${BACKEND_URL}/projects/${userId}`);
      if (pRes.ok) {
        const projects = await pRes.json();
        const linkedProjects = projects.filter(p => p.content && p.content.includes(currentTabUrl));
        
        if (linkedProjects.length === 0) {
          projectListDiv.innerHTML = "<p style='font-size:11px;color:#94a3b8;text-align:center;'>Website này chưa được gán liên kết Tác vụ.</p>";
        } else {
          linkedProjects.forEach(proj => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
              <div class="item-info">
                <div class="item-title">📂 ${proj.title}</div>
                <div class="item-desc">Mô hình: ${proj.viewType === 'sequence' ? 'Sơ đồ' : 'Cây thư mục'} | Tiến độ: ${proj.progress}%</div>
              </div>
            `;
            projectListDiv.appendChild(div);
            loadTasksByProject(proj.id, taskListDiv);
          });
        }
      }
    } catch (err) { console.error(err); }
  }

  async function loadTasksByProject(projectId, containerDiv) {
    try {
      const tRes = await fetch(`${BACKEND_URL}/tasks/project/${projectId}`);
      if (tRes.ok) {
        const tasks = await tRes.json();
        if (tasks.length === 0) return;
        
        tasks.forEach(task => {
          const card = document.createElement('div');
          card.className = 'item-card';
          card.innerHTML = `
            <div class="item-info" style="opacity: ${task.isCompleted ? 0.4 : 1}">
              <div class="item-title" style="text-decoration: ${task.isCompleted ? 'line-through' : 'none'}">🎯 ${task.title}</div>
              <div class="item-desc">Mức độ ưu tiên: ${task.priority.toUpperCase()}</div>
            </div>
            <button class="action-btn toggle-task-btn" style="background-color: ${task.isCompleted ? '#f0fdf4' : '#f8fafc'}" title="${task.isCompleted ? 'Mở lại' : 'Hoàn thành'}">
              ${task.isCompleted ? "🟢" : "⚪"}
            </button>
          `;

          card.querySelector('.toggle-task-btn').addEventListener('click', async () => {
            showStatus("Đang ghi nhận tiến độ...", "#f59e0b");
            const updateRes = await fetch(`${BACKEND_URL}/tasks/${task.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isCompleted: !task.isCompleted })
            });
            if (updateRes.ok) {
              showStatus("Đã cập nhật trạng thái tác vụ!", "#10b981");
              loadTasksForCurrentUrl();
            }
          });

          containerDiv.appendChild(card);
        });
      }
    } catch (err) { console.error(err); }
  }
});