const prisma = require('../config/prisma');

const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Đếm tổng số lượng các thực thể
    const totalProjects = await prisma.project.count({ where: { userId } });
    const totalWorkspaces = await prisma.workspace.count({ where: { userId } });
    const totalNotes = await prisma.note.count({ where: { userId } });

    // 2. Thống kê chi tiết Task (Công việc)
    const totalTasks = await prisma.task.count({ where: { userId } });
    const completedTasks = await prisma.task.count({ where: { userId, isCompleted: true } });

    // 3. Lấy 4 Dự án hoạt động gần đây nhất
    const recentProjects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      include: { 
        _count: { select: { tasks: true } } 
      }
    });

    // 4. Lấy 4 Ghi chú mới nhất
    const recentNotes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      select: { id: true, title: true, color: true, updatedAt: true }
    });

    // Trả về một khối dữ liệu hoàn chỉnh cho giao diện
    res.status(200).json({
      stats: {
        projects: totalProjects,
        workspaces: totalWorkspaces,
        notes: totalNotes,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: totalTasks - completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        }
      },
      recentProjects,
      recentNotes
    });

  } catch (error) {
    console.error("Lỗi lấy thống kê Dashboard:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tải dữ liệu Tổng quan." });
  }
};

module.exports = { getDashboardStats };