const prisma = require('../config/prisma');

// 1. Tạo Task (có thể là cha hoặc con)
const createTask = async (req, res) => {
  try {
    const { userId, title, content, status, priority, progress, startDate, dueDate, parentId } = req.body;

    const newTask = await prisma.task.create({
      data: {
        userId,
        title,
        content,
        status,
        priority,
        progress: progress || 0,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        parentId: parentId || null, // Nếu có parentId, nó sẽ là sub-task
      },
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi tạo công việc." });
  }
};

// 2. Lấy danh sách Task theo dạng cây (Tree Structure)
const getTasksByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy tất cả task của user
    const allTasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    // Hàm bổ trợ để biến danh sách phẳng thành dạng cây lồng nhau
    const buildTree = (tasks, parentId = null) => {
      return tasks
        .filter(t => t.parentId === parentId)
        .map(t => ({
          ...t,
          subTasks: buildTree(tasks, t.id)
        }));
    };

    const taskTree = buildTree(allTasks);
    res.status(200).json(taskTree);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi tải danh sách công việc." });
  }
};

// 3. Cập nhật Task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Chuyển đổi ngày tháng nếu có gửi lên
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật công việc." });
  }
};

// 4. Xóa Task (Xóa luôn cả các task con để tránh rác dữ liệu)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Lưu ý: Trong thực tế nên dùng deleteRecursive hoặc cấu hình Cascade trong DB
    // Ở đây ta xóa đơn giản Task hiện tại. 
    // Nếu muốn xóa sạch con, Prisma cần cài đặt Referencial Actions trong Schema.
    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({ message: "Đã xóa công việc." });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa công việc." });
  }
};

module.exports = { createTask, getTasksByUser, updateTask, deleteTask };