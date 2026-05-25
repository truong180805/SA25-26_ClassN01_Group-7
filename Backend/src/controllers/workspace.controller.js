const prisma = require('../config/prisma');

// 1. Tạo Workspace (Xử lý mượt cả khi tạo từ Extension có Tabs, và tạo rỗng từ Web)
const createWorkspace = async (req, res) => {
  try {
    const { userId, name, icon, color, tabs } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: "Thiếu userId hoặc tên Workspace." });
    }

    const newWorkspace = await prisma.workspace.create({
      data: {
        userId,
        name,
        icon: icon || "Briefcase",
        color: color || "#3b82f6",
        // Kiểm tra an toàn: Nếu có tabs truyền lên thì mới dùng Nested Create
        tabs: (tabs && tabs.length > 0) ? {
          create: tabs.map((tab, index) => ({
            title: tab.title,
            url: tab.url,
            favicon: tab.favicon,
            orderIndex: tab.orderIndex || index
          }))
        } : undefined
      },
      include: { tabs: true } 
    });

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error("Lỗi khi tạo Workspace:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tạo Workspace." });
  }
};

// 2. Lấy danh sách Workspace
const getWorkspacesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const workspaces = await prisma.workspace.findMany({
      where: { userId },
      include: { tabs: { orderBy: { orderIndex: 'asc' } } }, // Lấy tabs sắp xếp theo thứ tự
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(workspaces);
  } catch (error) {
    console.error("Lỗi lấy danh sách Workspace:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách Workspace." });
  }
};

// 3. Cập nhật Workspace (DÙNG ĐỂ ĐỔI TÊN VÀ ĐỔI MÀU TRÊN WEB)
const updateWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon, tabs } = req.body;

    const updateData = { name, color, icon };

    // Nếu người dùng có gửi danh sách tabs lên để cập nhật
    if (tabs) {
      updateData.tabs = {
        deleteMany: {}, // Xóa sạch các tab cũ của Workspace này
        create: tabs.map((tab, index) => ({
          title: tab.title || "Trang liên kết",
          url: tab.url,
          favicon: tab.favicon || null,
          orderIndex: tab.orderIndex || index
        }))
      };
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: updateData,
      include: { tabs: true } // Trả về kèm danh sách tab mới
    });

    res.status(200).json(updatedWorkspace);
  } catch (error) {
    console.error("Lỗi cập nhật Workspace:", error);
    res.status(500).json({ error: "Lỗi cập nhật Workspace." });
  }
};

// 4. Xóa Workspace
const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workspace.delete({ where: { id } });
    res.status(200).json({ message: "Xóa Workspace thành công." });
  } catch (error) {
    console.error("Lỗi xóa Workspace:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xóa." });
  }
};

module.exports = { createWorkspace, getWorkspacesByUser, updateWorkspace, deleteWorkspace };