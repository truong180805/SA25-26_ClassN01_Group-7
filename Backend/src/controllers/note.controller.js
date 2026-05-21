const prisma = require('../config/prisma');

// 1. Tạo Ghi chú mới (Hỗ trợ lưu URL từ Extension)
const createNote = async (req, res) => {
  try {
    const { userId, title, content, url, color } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: "Thiếu userId hoặc tiêu đề." });
    }

    const newNote = await prisma.note.create({
      data: {
        userId,
        title,
        content: content || "",
        url: url || null,
        color: color || "#fef08a",
      },
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Lỗi tạo Note:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tạo ghi chú." });
  }
};

// 2. Lấy danh sách Ghi chú của User (Lọc theo URL nếu có)
const getNotesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { url } = req.query; // Nhận tham số URL từ query (dùng cho Extension)

    // Nếu Extension gửi lên URL hiện tại, ta chỉ lấy các Note thuộc URL đó
    const whereCondition = { userId };
    if (url) {
      whereCondition.url = url;
    }

    const notes = await prisma.note.findMany({
      where: whereCondition,
      orderBy: [
        { isPinned: 'desc' }, // Ghi chú được ghim lên đầu
        { updatedAt: 'desc' } // Ghi chú mới sửa lên đầu
      ]
    });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách ghi chú." });
  }
};

// 3. Cập nhật Ghi chú
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedNote = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật ghi chú." });
  }
};

// 4. Xóa Ghi chú
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.status(200).json({ message: "Xóa ghi chú thành công." });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa ghi chú." });
  }
};

module.exports = { createNote, getNotesByUser, updateNote, deleteNote };