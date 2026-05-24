const prisma = require('../config/prisma');

// ==========================================
// HÀM HELPER: TỰ ĐỘNG TÍNH TOÁN % TIẾN ĐỘ
// ==========================================
const updateProjectProgress = async (projectId) => {
  if (!projectId) return;
  try {
    // Lấy tất cả các task thuộc project này
    const tasks = await prisma.task.findMany({ 
      where: { projectId: projectId } 
    });

    if (tasks.length === 0) {
      await prisma.project.update({ where: { id: projectId }, data: { progress: 0 } });
      return;
    }

    // Đếm số task đã hoàn thành
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    // Tính phần trăm và làm tròn
    const progress = Math.round((completedTasks / tasks.length) * 100);

    // Cập nhật lại vào Project
    await prisma.project.update({ 
      where: { id: projectId }, 
      data: { progress } 
    });
  } catch (error) {
    console.error("Lỗi khi tự động cập nhật tiến độ Project:", error);
  }
};


// ==========================================
// CÁC API CONTROLLER CỦA TASK
// ==========================================

// 1. Tạo Task mới
const createTask = async (req, res) => {
  try {
    const { userId, projectId, title, content, priority, dueDate, parentId, workspaceId, attachment } = req.body;

    if (!userId || !projectId || !title) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc (userId, projectId hoặc title)." });
    }

    const newTask = await prisma.task.create({
      data: {
        userId, projectId, title, content,
        priority: priority || 'medium',
        endDate: dueDate ? new Date(dueDate) : null,
        parentId: parentId || null,
        workspaceId: workspaceId || null,
        attachment: attachment || null,
        isCompleted: false
      },
    });

    // TÍNH LẠI TIẾN ĐỘ KHI THÊM TASK MỚI
    await updateProjectProgress(projectId);

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

// 3. Cập nhật Task (Tick hoàn thành, sửa nội dung...)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted, dependsOnId, dueDate, ...otherData } = req.body;

    const updatePayload = { ...otherData };
    if (isCompleted !== undefined) updatePayload.isCompleted = isCompleted;
    if (dependsOnId !== undefined) updatePayload.dependsOnId = dependsOnId;
    if (dueDate !== undefined) updatePayload.endDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updatePayload,
    });

    // KÍCH HOẠT ĐỆ QUY CHA - CON (Nếu có thay đổi trạng thái hoàn thành)
    if (isCompleted !== undefined) {
      // 1. Xuôi: Mẹ xong -> Các con tự động xong
      const updateSubtasks = async (pId, status) => {
        const subs = await prisma.task.findMany({ where: { parentId: pId } });
        for (const sub of subs) {
          await prisma.task.update({ where: { id: sub.id }, data: { isCompleted: status } });
          await updateSubtasks(sub.id, status);
        }
      };
      await updateSubtasks(id, isCompleted);

      // 2. Ngược: Tất cả con xong -> Mẹ tự động xong
      const checkParent = async (pId) => {
        if (!pId) return;
        const siblings = await prisma.task.findMany({ where: { parentId: pId } });
        const allDone = siblings.length > 0 && siblings.every(s => s.isCompleted);
        const parent = await prisma.task.update({ where: { id: pId }, data: { isCompleted: allDone } });
        await checkParent(parent.parentId);
      };
      await checkParent(updatedTask.parentId);
    }

    // TÍNH LẠI TIẾN ĐỘ DỰ ÁN KHI CÓ TASK THAY ĐỔI
    await updateProjectProgress(updatedTask.projectId);

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Xóa Task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm task để biết nó thuộc Project nào trước khi xóa
    const taskToDelete = await prisma.task.findUnique({ where: { id } });
    if (!taskToDelete) return res.status(404).json({ error: "Không tìm thấy task." });

    await prisma.task.delete({ where: { id } });

    // TÍNH LẠI TIẾN ĐỘ DỰ ÁN KHI XÓA BỚT TASK
    await updateProjectProgress(taskToDelete.projectId);

    res.status(200).json({ message: "Xóa thành công." });
  } catch (error) {
    console.error("Lỗi xóa task:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xóa." });
  }
};

module.exports = { createTask, getTasksByProject, updateTask, deleteTask };