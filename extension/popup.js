document.addEventListener('DOMContentLoaded', async () => {
  const tabListDiv = document.getElementById('tabList');
  const userIdInput = document.getElementById('userId');
  const statusDiv = document.getElementById('status');

  // 1. KIỂM TRA XEM ĐÃ LƯU USER ID TỪ TRƯỚC CHƯA
  chrome.storage.local.get(['omniUserId'], (result) => {
    if (result.omniUserId) {
      userIdInput.value = result.omniUserId;
      userIdInput.style.display = 'none'; // Ẩn ô nhập ID đi cho đỡ rối mắt
      
      const welcome = document.createElement('p');
      welcome.style.fontSize = '12px';
      welcome.style.color = '#10b981';
      welcome.textContent = '✅ Đã liên kết tài khoản hệ thống.';
      userIdInput.parentNode.insertBefore(welcome, userIdInput);
    }
  });
  
  // 2. Hiển thị danh sách tab
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach(tab => {
      const div = document.createElement('div');
      div.className = 'tab-item';
      div.textContent = tab.title;
      tabListDiv.appendChild(div);
    });
  });

  // 3. Xử lý khi bấm nút Lưu
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('workspaceName').value;
    const userId = userIdInput.value; 

    if (!name || !userId) {
      statusDiv.textContent = "Vui lòng nhập Tên Workspace và User ID!";
      statusDiv.style.color = "#ef4444";
      return;
    }

    statusDiv.textContent = "Đang lưu lên hệ thống...";
    statusDiv.style.color = "#f59e0b";

    // LƯU USER ID LẠI CHO LẦN SAU DÙNG
    chrome.storage.local.set({ omniUserId: userId });

    chrome.tabs.query({ currentWindow: true }, async (tabs) => {
      const workspaceTabs = tabs.map((t, index) => ({
        title: t.title,
        url: t.url,
        favicon: t.favIconUrl || "",
        orderIndex: index
      }));

      try {
        const response = await fetch("http://localhost:5000/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, name, icon: "Briefcase", color: "#3b82f6", tabs: workspaceTabs })
        });

        if (response.ok) {
          statusDiv.textContent = "Đã lưu Workspace thành công!";
          statusDiv.style.color = "#10b981";
          document.getElementById('workspaceName').value = "";
          
          // Tự động ẩn ô nhập ID nếu vừa nhập lần đầu thành công
          userIdInput.style.display = 'none';
        } else {
          statusDiv.textContent = "Lỗi từ Backend!";
          statusDiv.style.color = "#ef4444";
        }
      } catch (error) {
        statusDiv.textContent = "Không kết nối được tới Backend.";
        statusDiv.style.color = "#ef4444";
      }
    });
  });
});