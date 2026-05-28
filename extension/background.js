chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(['omniReminders'], (result) => {
    const reminders = result.omniReminders || [];
    const activeReminder = reminders.find(r => r.id === alarm.name && r.isActive);
    
    if (activeReminder) {
      // Dùng requireInteraction để thông báo nằm yên trên màn hình cho đến khi bạn tắt
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png', // CHÚ Ý: BẠN PHẢI CÓ 1 FILE icon.png TRONG THƯ MỤC EXTENSION NHÉ!
        title: activeReminder.icon + ' OMNIDASH NHẮC NHỞ!',
        message: activeReminder.title,
        priority: 2,
        requireInteraction: true 
      });
    }
  });
});