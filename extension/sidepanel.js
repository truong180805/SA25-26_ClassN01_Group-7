document.addEventListener('DOMContentLoaded', async () => {
  const BACKEND_URL = "http://localhost:5000/api";
  let userId = "";
  let currentTabUrl = "";
  // Fix 2: Dùng mảng (Array) để chứa TẤT CẢ Workspace mà trang web này thuộc về
  let currentWorkspaces = []; 
  
  let selectedIcon = "💧";
  let selectedColor = "#dbeafe";

  // ==========================================
  // 1. CHUYỂN TAB VÀ CHỌN ICON/MÀU
  // ==========================================
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabSections = document.querySelectorAll('.tab-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      navBtns.forEach(b => b.classList.remove('active'));
      tabSections.forEach(s => s.classList.remove('active'));
      e.currentTarget.classList.add('active');
      document.getElementById(e.currentTarget.dataset.target).classList.add('active');
    });
  });

  document.querySelectorAll('#iconPicker .picker-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('#iconPicker .picker-item').forEach(i => i.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      selectedIcon = e.currentTarget.dataset.value;
    });
  });

  document.querySelectorAll('#colorPicker .picker-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('#colorPicker .picker-item').forEach(i => i.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      selectedColor = e.currentTarget.dataset.value;
    });
  });

  // ==========================================
  // 2. KHỞI TẠO & QUÉT URL (Fix gán trùng WS)
  // ==========================================
  chrome.storage.local.get(['omniUserId'], (result) => {
    if (result.omniUserId) {
      userId = result.omniUserId;
      initSmartContext();
      loadReminders();
    } else {
      document.querySelector('.main-content').innerHTML = `<div style="padding: 40px 20px; text-align: center;"><h2 style="color: #ef4444; font-size: 18px;">Chưa liên kết tài khoản</h2><p style="color: #64748b; font-size: 13px;">Vui lòng mở Web OmniDash và đăng nhập.</p></div>`;
    }
  });

  chrome.tabs.onActivated.addListener(initSmartContext);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') initSmartContext();
  });

  async function initSmartContext() {
    if (!userId) return;
    loadWorkspaces();
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0] && tabs[0].url) {
        currentTabUrl = tabs[0].url;
        try {
          const res = await fetch(`${BACKEND_URL}/workspaces/user/${userId}`);
          const workspaces = await res.json();
          
          // Dùng .filter() để lấy TẤT CẢ WS chứa URL này (Xử lý gán trùng)
          currentWorkspaces = workspaces.filter(ws => ws.tabs.some(t => currentTabUrl.includes(t.url) || t.url.includes(currentTabUrl)));

          if (currentWorkspaces.length > 0) {
            const wsNames = currentWorkspaces.map(w => w.name).join(', ');
            document.getElementById('wsNoteLabel').innerHTML = `Thuộc WS: <b>${wsNames}</b>`;
            document.getElementById('wsTaskLabel').innerHTML = `Thuộc WS: <b>${wsNames}</b>`;
          } else {
            document.getElementById('wsNoteLabel').innerHTML = `Trang tự do`;
            document.getElementById('wsTaskLabel').innerHTML = `Chưa gắn Workspace`;
          }
          loadTasks();
          loadNotes();
        } catch(e) {}
      }
    });
  }

  // ==========================================
  // 3. LOGIC WORKSPACES (TAB 2)
  // ==========================================
  async function loadWorkspaces() {
    try {
      const res = await fetch(`${BACKEND_URL}/workspaces/user/${userId}`);
      if (res.ok) {
        const workspaces = await res.json();
        const listDiv = document.getElementById('workspaceList');
        if(!listDiv) return;
        listDiv.innerHTML = workspaces.map(ws => `
          <div class="card" style="padding: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <h4 style="margin:0; font-size:14px; display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${ws.color||'#3b82f6'}"></span>${ws.name}
              </h4>
              <span style="font-size:11px; color:#94a3b8; font-weight:bold;">${ws.tabs.length} links</span>
            </div>
            <button class="btn open-ws-btn" data-id="${ws.id}" style="padding: 8px; font-size: 11px; background-color: #f1f5f9; color: #0f172a; box-shadow: none;">Mở tất cả Tab</button>
          </div>
        `).join('');

        document.querySelectorAll('.open-ws-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const ws = workspaces.find(w => w.id === e.currentTarget.dataset.id);
            if(ws && ws.tabs) ws.tabs.forEach(tab => chrome.tabs.create({ url: tab.url, active: false }));
          });
        });
      }
    } catch (e) {}
  }

  const btnSaveTabs = document.getElementById('saveTabsBtn');
  if(btnSaveTabs) {
    btnSaveTabs.addEventListener('click', () => {
      const name = document.getElementById('wsNameInput').value;
      if (!name) return;
      btnSaveTabs.textContent = "Đang lấy Tabs...";
      chrome.tabs.query({ currentWindow: true }, async (tabs) => {
        const tabData = tabs.map(t => ({ title: t.title, url: t.url, favicon: t.favIconUrl || "" }));
        await fetch(`${BACKEND_URL}/workspaces`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, name, color: "#3b82f6", icon: "Briefcase", tabs: tabData }) });
        document.getElementById('wsNameInput').value = ""; btnSaveTabs.textContent = "Gom các Tab & Lưu"; loadWorkspaces();
      });
    });
  }

  // ==========================================
  // 4. LOGIC NHẮC NHỞ
  // ==========================================
  async function loadReminders() {
    try {
      const res = await fetch(`${BACKEND_URL}/reminders/user/${userId}`);
      if (res.ok) {
        const reminders = await res.json();
        chrome.storage.local.set({ omniReminders: reminders });
        const listDiv = document.getElementById('reminderList');
        if(!listDiv) return;
        listDiv.innerHTML = reminders.map(rem => `
          <div class="card" style="display:flex; alignItems:center; padding:12px;">
            <div style="width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-right:12px; background-color:${rem.color}">${rem.icon}</div>
            <div style="flex:1; min-width:0;">
              <h4 style="margin:0 0 4px 0; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${rem.title}</h4>
              <p style="margin:0; font-size:11px; color:#64748b; font-weight:600;">Mỗi ${rem.interval} phút</p>
            </div>
            <div style="display:flex; align-items:center;">
              <label class="switch"><input type="checkbox" class="toggle-rem" data-id="${rem.id}" ${rem.isActive ? 'checked' : ''}><span class="slider"></span></label>
              <button class="btn-icon del-rem" data-id="${rem.id}"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg></button>
            </div>
          </div>
        `).join('');

        reminders.forEach(r => {
          if (r.isActive) chrome.alarms.create(r.id, { periodInMinutes: r.interval });
          else chrome.alarms.clear(r.id);
        });

        document.querySelectorAll('.toggle-rem').forEach(t => t.addEventListener('change', async (e) => {
          await fetch(`${BACKEND_URL}/reminders/${e.target.dataset.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: e.target.checked }) });
          loadReminders(); 
        }));

        document.querySelectorAll('.del-rem').forEach(btn => {
          let timeout;
          btn.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            if (!btn.classList.contains('confirming')) {
              btn.classList.add('confirming'); btn.innerHTML = "Xóa?";
              timeout = setTimeout(() => { btn.classList.remove('confirming'); btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>`; }, 3000);
            } else {
              clearTimeout(timeout);
              await fetch(`${BACKEND_URL}/reminders/${btn.dataset.id}`, { method: 'DELETE' });
              chrome.alarms.clear(btn.dataset.id); loadReminders();
            }
          });
        });
      }
    } catch (e) {}
  }

  const saveRemBtn = document.getElementById('saveRemBtn');
  if(saveRemBtn) saveRemBtn.addEventListener('click', async () => {
    const title = document.getElementById('remTitle').value;
    const interval = document.getElementById('remInterval').value;
    if(!title || !interval) return;
    saveRemBtn.textContent = "Đang lưu...";
    await fetch(`${BACKEND_URL}/reminders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, title, interval, icon: selectedIcon, color: selectedColor }) });
    document.getElementById('remTitle').value = ""; saveRemBtn.textContent = "Lưu nhắc nhở"; loadReminders();
  });

  // ==========================================
  // 5. LOGIC GHI CHÚ (Fix hiển thị chéo Workspace)
  // ==========================================
  let editingNoteId = null;

  async function loadNotes() {
    try {
      // TRUYỀN CẢ URL VÀ MẢNG WORKSPACE IDs VÀO API
      const wsIds = currentWorkspaces.map(w => w.id).join(',');
      const res = await fetch(`${BACKEND_URL}/notes/${userId}?url=${encodeURIComponent(currentTabUrl)}&workspaceIds=${wsIds}`);
      
      if (res.ok) {
        const notes = await res.json();
        const listDiv = document.getElementById('noteList');
        if(!listDiv) return;
        
        if(notes.length === 0) { listDiv.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:12px;">Chưa có ghi chú nào.</p>`; return; }

        listDiv.innerHTML = "";
        notes.forEach(note => {
          const div = document.createElement('div');
          div.className = 'card';
          div.style.backgroundColor = note.color || '#f8fafc';
          div.style.borderColor = note.color || '#e2e8f0';
          div.style.cursor = 'pointer';
          div.innerHTML = `<h4 style="margin:0 0 6px 0; font-size:14px;">${note.title}</h4><p style="margin:0; font-size:12px; color:#1e293b; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${note.content}</p>`;
          div.addEventListener('click', () => openNoteDetail(note));
          listDiv.appendChild(div);
        });
      }
    } catch (e) {}
  }

  function openNoteDetail(note) {
    editingNoteId = note.id;
    document.getElementById('noteListView').style.display = 'none';
    document.getElementById('noteDetailView').style.display = 'flex';
    document.getElementById('detailTitle').value = note.title;
    document.getElementById('detailContent').value = note.content;
    document.getElementById('detailCard').style.backgroundColor = note.color;
    document.querySelectorAll('#detailColorPicker .picker-item').forEach(i => { i.classList.remove('selected'); if (i.dataset.value === note.color) i.classList.add('selected'); });
  }

  document.getElementById('backToNotesBtn')?.addEventListener('click', () => {
    document.getElementById('noteDetailView').style.display = 'none'; document.getElementById('noteListView').style.display = 'block'; editingNoteId = null;
  });

  document.querySelectorAll('#detailColorPicker .picker-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('#detailColorPicker .picker-item').forEach(i => i.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      document.getElementById('detailCard').style.backgroundColor = e.currentTarget.dataset.value;
    });
  });

  document.getElementById('saveNoteBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('noteTitle').value; const content = document.getElementById('noteContent').value;
    if(!title) return;
    const btn = document.getElementById('saveNoteBtn'); btn.textContent = "...";
    // Tự động gán vào WS đầu tiên nếu có
    const wsId = currentWorkspaces.length > 0 ? currentWorkspaces[0].id : null;
    await fetch(`${BACKEND_URL}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, title, content, color: '#fbcfe8', url: currentTabUrl, workspaceId: wsId }) });
    document.getElementById('noteTitle').value = ""; document.getElementById('noteContent').value = ""; btn.textContent = "Lưu Ghi chú"; loadNotes();
  });

  document.getElementById('updateNoteBtn')?.addEventListener('click', async () => {
    if(!editingNoteId) return;
    const title = document.getElementById('detailTitle').value; const content = document.getElementById('detailContent').value;
    const color = document.querySelector('#detailColorPicker .picker-item.selected').dataset.value;
    document.getElementById('updateNoteBtn').textContent = "...";
    await fetch(`${BACKEND_URL}/notes/${editingNoteId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, color }) });
    document.getElementById('updateNoteBtn').textContent = "Lưu thay đổi"; document.getElementById('backToNotesBtn').click(); loadNotes();
  });

  document.getElementById('delNoteBtn')?.addEventListener('click', async (e) => {
    if (!editingNoteId) return;
    const btn = e.currentTarget;
    if (!btn.classList.contains('confirming')) {
      btn.classList.add('confirming'); btn.innerHTML = "Chắc chưa?";
      setTimeout(() => { btn.classList.remove('confirming'); btn.innerHTML = "Xóa"; }, 3000);
    } else {
      await fetch(`${BACKEND_URL}/notes/${editingNoteId}`, { method: "DELETE" });
      btn.classList.remove('confirming'); btn.innerHTML = "Xóa"; document.getElementById('backToNotesBtn').click(); loadNotes();
    }
  });

  // ==========================================
  // 6. LOGIC TÁC VỤ (CÓ CHI TIẾT TASK)
  // ==========================================
  async function loadTasks() {
    const listDiv = document.getElementById('taskList');
    if(!listDiv) return;
    listDiv.innerHTML = "";
    
    if (currentWorkspaces.length === 0) {
      listDiv.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:12px;">Trang này không thuộc Workspace nào.</p>`;
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/projects/${userId}`);
      if (res.ok) {
        const allProjects = await res.json();
        const wsIds = currentWorkspaces.map(w => w.id);
        
        const wsProjects = allProjects.filter(p => wsIds.includes(p.workspaceId));
        
        if(wsProjects.length === 0) {
          listDiv.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:12px;">Không có dự án gán với Workspace(s) này.</p>`; return;
        }

        wsProjects.forEach(proj => {
          const div = document.createElement('div');
          div.className = 'card';
          // Thêm style cursor và user-select để người dùng biết tiêu đề bấm được
          div.innerHTML = `
            <div class="project-header" data-id="${proj.id}" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:12px; cursor:pointer; user-select:none;">
              <h4 style="margin:0; font-size:14px; color:#2563eb; font-weight:900; display:flex; align-items:center; gap:6px;">
                <span class="chevron-icon" style="display:inline-block; transition:transform 0.2s; transform:rotate(-90deg); font-size:10px;">▼</span>
                ${proj.title}
              </h4>
              <span style="font-size:11px; font-weight:bold; color:${proj.progress === 100 ? '#10b981' : '#64748b'}">${proj.progress}%</span>
            </div>
            <div class="project-tasks-body" id="tasks-of-${proj.id}" style="font-size:12px; color:#64748b; margin-top:8px; display:none;">
              <i>Đang tải...</i>
            </div>
          `;
          listDiv.appendChild(div);
          
          // Bắt sự kiện click vào Header của Project để Đóng/Mở tác vụ con
          div.querySelector('.project-header').addEventListener('click', (e) => {
            const body = div.querySelector('.project-tasks-body');
            const chevron = div.querySelector('.chevron-icon');
            if (body.style.display === 'none') {
              body.style.display = 'block';
              chevron.style.transform = 'rotate(0deg)'; // Mũi tên chỉ xuống khi mở
            } else {
              body.style.display = 'none';
              chevron.style.transform = 'rotate(-90deg)'; // Mũi tên chỉ ngang khi đóng
            }
          });

          // Gọi API lấy các tác vụ con như bình thường
          fetch(`${BACKEND_URL}/tasks/project/${proj.id}`).then(r => r.json()).then(tasks => {
            const taskContainer = document.getElementById(`tasks-of-${proj.id}`);
            if(tasks.length === 0) { taskContainer.innerHTML = 'Chưa có tác vụ.'; return; }
            
            taskContainer.innerHTML = "";
            tasks.forEach(t => {
              const taskDiv = document.createElement('div');
              taskDiv.style.cssText = `display:flex; align-items:flex-start; margin-bottom:8px; gap:8px; padding:8px; background:#f8fafc; border-radius:8px; cursor:pointer; transition:0.2s;`;
              taskDiv.onmouseenter = () => taskDiv.style.backgroundColor = "#eff6ff";
              taskDiv.onmouseleave = () => taskDiv.style.backgroundColor = "#f8fafc";
              
              taskDiv.innerHTML = `
                 <input type="checkbox" ${t.isCompleted ? 'checked' : ''} class="task-checkbox" data-id="${t.id}" style="width:14px; height:14px; cursor:pointer; flex-shrink:0; margin-top:2px;" />
                 <span style="${t.isCompleted ? 'text-decoration:line-through; color:#94a3b8;' : 'color:#0f172a;'} font-weight:600; line-height:1.4;">${t.title}</span>
              `;
              
              taskDiv.addEventListener('click', (e) => {
                if(e.target.classList.contains('task-checkbox')) return;
                openTaskDetail(t);
              });
              taskContainer.appendChild(taskDiv);
            });

            taskContainer.querySelectorAll('.task-checkbox').forEach(chk => {
              chk.addEventListener('change', async (e) => {
                await fetch(`${BACKEND_URL}/tasks/${e.target.dataset.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isCompleted: e.target.checked }) });
                loadTasks(); 
              });
            });
          });
        });
      }
    } catch (e) {}
  }

  // --- LOGIC MỞ CHI TIẾT TASK ---
  function openTaskDetail(task) {
    document.getElementById('taskListView').style.display = 'none';
    document.getElementById('taskDetailView').style.display = 'flex';
    
    document.getElementById('tdTitle').textContent = task.title;
    document.getElementById('tdStatus').textContent = task.isCompleted ? "✅ Đã xong" : "⏳ Đang làm";
    document.getElementById('tdStatus').style.color = task.isCompleted ? "#10b981" : "#2563eb";
    document.getElementById('tdStatus').style.background = task.isCompleted ? "#d1fae5" : "#dbeafe";
    
    document.getElementById('tdPriority').textContent = task.priority === 'high' ? "🔥 Cao" : (task.priority === 'medium' ? "⚡ Trung bình" : "💧 Thấp");
    document.getElementById('tdContent').textContent = task.content || "Không có mô tả chi tiết.";
    
    const start = task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : "---";
    const end = task.endDate ? new Date(task.endDate).toLocaleDateString('vi-VN') : "Vô hạn";
    document.getElementById('tdDates').innerHTML = `📅 Từ: <b>${start}</b> &nbsp;➔&nbsp; Đến: <b>${end}</b>`;
  }

  document.getElementById('backToTasksBtn')?.addEventListener('click', () => {
    document.getElementById('taskDetailView').style.display = 'none';
    document.getElementById('taskListView').style.display = 'block';
  });
});