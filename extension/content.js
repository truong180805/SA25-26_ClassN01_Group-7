// lắng nghe tin nhắn từ trang Web (localhost:3000)
window.addEventListener("message", (event) => {
  // Chỉ nhận tin nhắn có type là OMNI_SYNC_USER
  if (event.source === window && event.data && event.data.type === "OMNI_SYNC_USER") {
    // Gửi ID lấy được về cho Extension Background lưu lại
    chrome.runtime.sendMessage({ type: "SAVE_USER_ID", userId: event.data.userId });
  }
});