const prisma = require('../config/prisma');

// 1. Tạo Task mới (Đã cập nhật để nhận projectId và workspaceId)
const createTask = async (req, res) => {
  try {
    const { userId, projectId, title, content, priority, dueDate, parentId, workspaceId, attachment } = req.body;

    // Xác thực cơ bản
    if (!userId || !projectId || !title) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc (userId, projectId hoặc title)." });
    }

    const newTask = await prisma.task.create({
      data: {
        userId,
        projectId,
        title,
        content,
        priority: priority || 'medium',
        endDate: dueDate ? new Date(dueDate) : null, // Ánh xạ dueDate của Frontend thành endDate của DB
        parentId: parentId || null,
        workspaceId: workspaceId || null,
        attachment: attachment || null,
        isCompleted: false
      },
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Lỗi khi tạo Task:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tạo công việc." });
  }
};

// 2. Lấy danh sách Task theo Project
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId: projectId },
      orderBy: { createdAt: 'asc' }
    });

    // Định dạng lại dữ liệu trả về cho Frontend dễ dùng (đổi endDate thành dueDate)
    const formattedTasks = tasks.map(task => ({
      ...task,
      dueDate: task.endDate
    }));

    res.status(200).json(formattedTasks);
  } catch (error) {
    console.error("Lỗi lấy danh sách task:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tải nhiệm vụ." });
  }
};

// 3. Cập nhật Task (dùng cho tích hoàn thành hoặc sửa nội dung)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    // Bóc tách dueDate ra khỏi body
    const { isCompleted, dependsOnId, dueDate, ...otherData } = req.body;

    const updatePayload = { ...otherData };
    if (isCompleted !== undefined) updatePayload.isCompleted = isCompleted;
    if (dependsOnId !== undefined) updatePayload.dependsOnId = dependsOnId;
    
    // Ánh xạ dueDate thành endDate cho Prisma hiểu
    if (dueDate !== undefined) {
      updatePayload.endDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updatePayload,
    });

    // TRIGGER ĐỆ QUY (Chỉ dành cho Mẹ - Con)
    if (isCompleted !== undefined) {
      // 1. Xuôi: Mẹ xong -> Con xong
      const updateSubtasks = async (pId, status) => {
        const subs = await prisma.task.findMany({ where: { parentId: pId } });
        for (const sub of subs) {
          await prisma.task.update({ where: { id: sub.id }, data: { isCompleted: status } });
          await updateSubtasks(sub.id, status);
        }
      };
      await updateSubtasks(id, isCompleted);

      // 2. Ngược: Tất cả con xong -> Mẹ xong
      const checkParent = async (pId) => {
        if (!pId) return;
        const siblings = await prisma.task.findMany({ where: { parentId: pId } });
        const allDone = siblings.length > 0 && siblings.every(s => s.isCompleted);
        const parent = await prisma.task.update({ where: { id: pId }, data: { isCompleted: allDone } });
        await checkParent(parent.parentId);
      };
      await checkParent(updatedTask.parentId);
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Xóa Task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({
      where: { id },
    });
    res.status(200).json({ message: "Xóa thành công." });
  } catch (error) {
    console.error("Lỗi xóa task:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xóa." });
  }
};

module.exports = { createTask, getTasksByProject, updateTask, deleteTask };