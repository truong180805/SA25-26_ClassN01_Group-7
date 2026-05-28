const prisma = require('../config/prisma');

// 1. Tạo Nhắc nhở mới
const createReminder = async (req, res) => {
  try {
    const { userId, title, icon, color, interval } = req.body;

    if (!userId || !title || !interval) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc (userId, title, interval)." });
    }

    const newReminder = await prisma.reminder.create({
      data: { userId, title, icon, color, interval: parseInt(interval) }
    });

    res.status(201).json(newReminder);
  } catch (error) {
    console.error("Lỗi tạo Reminder:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tạo nhắc nhở." });
  }
};

// 2. Lấy danh sách Nhắc nhở của User
const getRemindersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json(reminders);
  } catch (error) {
    console.error("Lỗi lấy Reminder:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách nhắc nhở." });
  }
};

// 3. Cập nhật Nhắc nhở (Bao gồm cả việc Bật/Tắt công tắc isActive)
const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, color, interval, isActive } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (interval !== undefined) updateData.interval = parseInt(interval);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: updateData
    });

    res.status(200).json(updatedReminder);
  } catch (error) {
    console.error("Lỗi cập nhật Reminder:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật nhắc nhở." });
  }
};

// 4. Xóa Nhắc nhở
const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({ where: { id } });
    res.status(200).json({ message: "Xóa nhắc nhở thành công." });
  } catch (error) {
    console.error("Lỗi xóa Reminder:", error);
    res.status(500).json({ error: "Lỗi khi xóa nhắc nhở." });
  }
};

module.exports = { createReminder, getRemindersByUser, updateReminder, deleteReminder };