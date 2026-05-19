const prisma = require('../config/prisma');

// 1. Tạo Workspace mới (Kèm theo danh sách các Tab)
const createWorkspace = async (req, res) => {
  try {
    const { userId, name, icon, color, tabs } = req.body;

    const newWorkspace = await prisma.workspace.create({
      data: {
        userId,
        name,
        icon,
        color,
        // Prisma cho phép tạo luôn cả các Tab con cùng một lúc (Nested Create)
        tabs: {
          create: tabs.map((tab, index) => ({
            title: tab.title,
            url: tab.url,
            favicon: tab.favicon,
            orderIndex: index
          }))
        }
      },
      include: { tabs: true } // Trả về kèm theo tab sau khi tạo xong
    });

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error("Lỗi khi tạo Workspace:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tạo Workspace." });
  }
};

// 2. Lấy danh sách Workspace của một User
const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = req.params;
    const workspaces = await prisma.workspace.findMany({
      where: { userId },
      include: { tabs: true }, // Lấy luôn cả các URL bên trong
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy danh sách Workspace." });
  }
};

// 3. Xóa Workspace
const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workspace.delete({ where: { id } });
    res.status(200).json({ message: "Xóa Workspace thành công." });
  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống khi xóa." });
  }
};

module.exports = { createWorkspace, getUserWorkspaces, deleteWorkspace };