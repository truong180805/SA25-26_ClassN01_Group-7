// src/controllers/project.controller.js
const prisma = require('../config/prisma');

// 1. Tạo Project (Công việc lớn)
const createProject = async (req, res) => {
  try {
    const { userId, title, content, startDate, endDate, viewType, isStrictSequence, workspaceId } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: "Thiếu userId hoặc tiêu đề công việc." });
    }

    const newProject = await prisma.project.create({
      data: {
        userId,
        title,
        content,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        viewType: viewType || 'list',
        isStrictSequence: isStrictSequence || false,
        workspaceId: workspaceId || null,
      },
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Lỗi tạo Project:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tạo Công việc." });
  }
};

// 2. Lấy danh sách Project của người dùng
const getProjectsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }, // Dự án mới tương tác sẽ lên đầu
      include: {
        _count: { select: { tasks: true } } // Đếm xem bên trong có bao nhiêu task
      }
    });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách Công việc." });
  }
};

// 3. Cập nhật Project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật Công việc." });
  }
};

// 4. Xóa Project (sẽ tự động xóa các Task bên trong do đã cài onDelete: Cascade)
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({ message: "Đã xóa Công việc và các nhiệm vụ bên trong." });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa Công việc." });
  }
};

module.exports = { createProject, getProjectsByUser, updateProject, deleteProject };