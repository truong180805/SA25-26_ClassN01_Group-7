const prisma = require('../config/prisma');
const os = require('os');

// 1. Lấy dữ liệu Thống kê Tổng quan
const getSystemStats = async (req, res) => {
  try {
    // Prisma .count() giúp đếm số lượng bản ghi cực kỳ nhanh
    const totalUsers = await prisma.user.count();
    const totalWorkspaces = await prisma.workspace.count();
    const totalProjects = await prisma.project.count();
    const totalTasks = await prisma.task.count();
    const totalNotes = await prisma.note.count();

    res.status(200).json({
      totalUsers,
      totalWorkspaces,
      totalProjects,
      totalTasks,
      totalNotes
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê Admin:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tải thống kê." });
  }
};

// 2. Lấy Danh sách toàn bộ Người dùng
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' } // Mới đăng ký xếp lên đầu
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi lấy danh sách User:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách người dùng." });
  }
};

// 3. Xóa một Người dùng bất kỳ (Và toàn bộ dữ liệu liên quan)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Không cho phép Admin tự xóa chính mình
    if (id === req.user.id) {
      return res.status(400).json({ error: "Bạn không thể tự xóa tài khoản của chính mình!" });
    }

    // 🚀 Dùng $transaction để xóa sạch dữ liệu từ ngọn đến gốc
    await prisma.$transaction(async (tx) => {
      // 1. Xóa các dữ liệu độc lập trước
      await tx.note.deleteMany({ where: { userId: id } });
      await tx.reminder.deleteMany({ where: { userId: id } });
      await tx.task.deleteMany({ where: { userId: id } });
      await tx.project.deleteMany({ where: { userId: id } });

      // 2. Tìm các Workspace của User này để xóa các Tab bên trong
      const userWorkspaces = await tx.workspace.findMany({ where: { userId: id } });
      const workspaceIds = userWorkspaces.map(ws => ws.id);
      
      if (workspaceIds.length > 0) {
        // Xóa các Tab nằm trong Workspace
        await tx.workspaceTab.deleteMany({ 
          where: { workspaceId: { in: workspaceIds } } 
        });
      }

      // 3. Xóa Workspace
      await tx.workspace.deleteMany({ where: { userId: id } });

      // 4. Cuối cùng, khi không còn gì vướng bận, xóa User
      await tx.user.delete({ where: { id } });
    });

    res.status(200).json({ message: "Đã xóa vĩnh viễn người dùng và toàn bộ dữ liệu." });
  } catch (error) {
    console.error("Lỗi xóa User:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xóa người dùng." });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = ((usedMem / totalMem) * 100).toFixed(1); // % RAM đang dùng

    // Tính thời gian server đã chạy (Uptime)
    const uptimeSeconds = os.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    // Thử query nhẹ 1 cái để test độ trễ Database (Ping)
    const start = Date.now();
    await prisma.user.findFirst({ select: { id: true } });
    const dbPing = Date.now() - start;

    res.status(200).json({
      memoryUsage: memUsage,
      uptime: `${hours}h ${minutes}m`,
      dbLatency: dbPing
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi đọc phần cứng." });
  }
};

// 5. Xuất toàn bộ dữ liệu (Backup)
const exportBackup = async (req, res) => {
  try {
    // Kéo toàn bộ dữ liệu quan trọng ra
    const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, role: true } });
    const workspaces = await prisma.workspace.findMany();
    const tasks = await prisma.task.findMany();

    const backupData = {
      exportedAt: new Date(),
      totalUsers: users.length,
      data: { users, workspaces, tasks }
    };

    res.status(200).json(backupData);
  } catch (error) {
    res.status(500).json({ error: "Lỗi sao lưu dữ liệu." });
  }
};

module.exports = {
                  getSystemStats, 
                  getAllUsers, 
                  deleteUser, 
                  getSystemHealth, 
                  exportBackup 
                };