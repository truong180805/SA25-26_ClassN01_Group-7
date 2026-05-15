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
    const { dueDate, isPinned, isCompleted, title, content, priority, parentId } = req.body;

    // 1. Chỉ cập nhật những trường được gửi lên từ Frontend
    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (content !== undefined) updatePayload.content = content;
    if (priority !== undefined) updatePayload.priority = priority;
    if (parentId !== undefined) updatePayload.parentId = parentId;
    if (isPinned !== undefined) updatePayload.isPinned = isPinned;
    if (isCompleted !== undefined) updatePayload.isCompleted = isCompleted;
    
    // Ánh xạ dueDate thành endDate cho Prisma
    if (dueDate !== undefined) {
      updatePayload.endDate = dueDate ? new Date(dueDate) : null;
    }

    // 2. Lưu vào Database
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updatePayload,
    });

    // 3. TRIGGER: Đệ quy trạng thái hoàn thành (Chỉ chạy khi có gửi isCompleted)
    if (isCompleted !== undefined) {
      const isDone = isCompleted;

      // Trigger Xuôi: Cha xong -> Con xong
      const updateChildrenStatus = async (pId, status) => {
        const children = await prisma.task.findMany({ where: { parentId: pId } });
        for (const child of children) {
          await prisma.task.update({ where: { id: child.id }, data: { isCompleted: status } });
          await updateChildrenStatus(child.id, status);
        }
      };
      await updateChildrenStatus(id, isDone);

      // Trigger Ngược: Con xong -> Cha xong
      const checkAndUpdateParent = async (currentParentId) => {
        if (!currentParentId) return;
        const siblings = await prisma.task.findMany({ where: { parentId: currentParentId } });
        // Nếu danh sách không rỗng và tất cả đều xong thì cha xong
        const isAllSiblingsDone = siblings.length > 0 && siblings.every(sibling => sibling.isCompleted);
        
        const parent = await prisma.task.update({
          where: { id: currentParentId },
          data: { isCompleted: isAllSiblingsDone }
        });
        await checkAndUpdateParent(parent.parentId);
      };
      await checkAndUpdateParent(updatedTask.parentId);
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Lỗi cập nhật task:", error);
    // Trả về chi tiết lỗi để dễ debug thay vì báo chung chung
    res.status(500).json({ error: error.message || "Lỗi hệ thống khi cập nhật." });
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