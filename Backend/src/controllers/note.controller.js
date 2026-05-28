const prisma = require('../config/prisma');

// 1. Tạo Ghi chú mới (Đã thêm workspaceId)
const createNote = async (req, res) => {
  try {
    const { userId, title, content, url, color, workspaceId } = req.body;

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
        workspaceId: workspaceId || null // Lưu workspaceId
      },
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Lỗi tạo Note:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tạo ghi chú." });
  }
};

// 2. Lấy danh sách Ghi chú
const getNotesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { url, workspaceIds } = req.query; 

    // Tạo mảng điều kiện OR
    const orConditions = [];
    if (url) {
      orConditions.push({ url: url });
    }
    if (workspaceIds) {
      const ids = workspaceIds.split(','); // Chuyển chuỗi 'id1,id2' thành mảng
      orConditions.push({ workspaceId: { in: ids } });
    }

    // Điều kiện gốc là userId
    const whereCondition = { userId };
    
    // Nếu có truyền url hoặc workspaceIds từ Extension, áp dụng điều kiện OR
    if (orConditions.length > 0) {
      whereCondition.OR = orConditions;
    }

    const notes = await prisma.note.findMany({
      where: whereCondition,
      orderBy: [
        { isPinned: 'desc' }, 
        { updatedAt: 'desc' } 
      ]
    });

    res.status(200).json(notes);
  } catch (error) {
    console.error("Lỗi getNotesByUser:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách ghi chú." });
  }
};

// 3. Cập nhật Ghi chú (Thêm workspaceId)
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, color, isPinned, workspaceId } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (workspaceId !== undefined) updateData.workspaceId = workspaceId; // Có thể truyền null để gỡ gán

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