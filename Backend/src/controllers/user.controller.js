const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

// createUser Function
const createUser = async (req, res) => {
  try {
    // Input infor 
    const { email, passwordHash, fullName } = req.body;

    // save newUser to user table
    const newUser = await prisma.user.create({
      data: {
        email: email,
        passwordHash: passwordHash, 
        fullName: fullName,
      },
    });

    // return result and inf newUser
    res.status(201).json(newUser);
  } catch (error) {
    // inf if have error
    res.status(500).json({ error: "Không thể tạo người dùng. Có thể email đã được sử dụng." });
  }
};

// 1. Lấy thông tin cá nhân
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, avatarUrl: true, timezone: true, createdAt: true } 
      // Không select passwordHash để bảo mật
    });

    if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng." });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống." });
  }
};

// 2. Cập nhật thông tin cá nhân
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, timezone, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { fullName, timezone, avatarUrl },
      select: { id: true, email: true, fullName: true, timezone: true, avatarUrl: true }
    });

    res.status(200).json({ message: "Cập nhật hồ sơ thành công!", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật hồ sơ." });
  }
};

// 3. Đổi mật khẩu (Yêu cầu mật khẩu cũ)
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ mật khẩu cũ và mới." });
    }

    // Lấy user từ DB
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng." });

    // Kiểm tra mật khẩu cũ có khớp không
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Mật khẩu cũ không chính xác." });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Lưu DB
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword }
    });

    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi hệ thống khi đổi mật khẩu." });
  }
};

module.exports = {
  createUser, getUserProfile, updateUserProfile, changePassword
};