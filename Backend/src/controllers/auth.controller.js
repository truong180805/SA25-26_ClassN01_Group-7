// src/controllers/auth.controller.js
const prisma = require('../config/prisma');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Feature: User Registration
const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email này đã được sử dụng." });
    }

    // 2. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Save new user to database
    const newUser = await prisma.user.create({
      data: {
        email: email,
        passwordHash: passwordHash, // Match the schema definition
        fullName: fullName,
      },
    });

    res.status(201).json({ 
      message: "Đăng ký thành công!", 
      user: { id: newUser.id, email: newUser.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi hệ thống khi đăng ký." });
  }
};

// Feature: User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    }

    // 2. Compare entered password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    }

    // 3. Generate JWT Token (expires in 7 days)
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,       // <-- THÊM DÒNG NÀY
        name: user.fullName
       }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } 
    );

    res.status(200).json({ message: "Đăng nhập thành công!", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi hệ thống khi đăng nhập." });
  }
};

const logout = async (req, res) => {
  res.status(200).json({ message: "Đăng xuất thành công." });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Vui lòng cung cấp email." });

    // 2.1. Kiểm tra email có tồn tại không
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản với email này." });
    }

    // 2.2. Tạo Reset Token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 2.3. Mã hóa token trước khi lưu vào DB (để bảo mật nếu DB bị hack)
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Đặt hạn sử dụng token là 15 phút
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000);

    // Lưu vào DB
    await prisma.user.update({
      where: { email },
      data: { resetToken: resetTokenHash, resetTokenExp }
    });

    // 2.4. Gửi Email
    // Link này sẽ trỏ về màn hình Đặt lại mật khẩu trên Frontend của bạn (Next.js)
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    const message = `
      <h2>Yêu cầu đặt lại mật khẩu - OmniDash</h2>
      <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu khôi phục mật khẩu.</p>
      <p>Vui lòng click vào đường dẫn bên dưới để đặt lại mật khẩu của bạn. Đường dẫn này sẽ hết hạn sau 15 phút:</p>
      <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Đặt lại mật khẩu</a>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Khôi phục mật khẩu OmniDash',
        html: message
      });
      res.status(200).json({ message: "Email khôi phục đã được gửi. Vui lòng kiểm tra hòm thư." });
    } catch (err) {
      // Nếu gửi mail lỗi, phải xóa token trong DB đi
      await prisma.user.update({
        where: { email },
        data: { resetToken: null, resetTokenExp: null }
      });
      console.error("Lỗi gửi mail:", err);
      return res.status(500).json({ error: "Không thể gửi email lúc này." });
    }

  } catch (error) {
    console.error("Lỗi forgotPassword:", error);
    res.status(500).json({ error: "Lỗi hệ thống." });
  }
};

// 3. API ĐẶT LẠI MẬT KHẨU MỚI
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // Lấy token từ URL
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ error: "Vui lòng nhập mật khẩu mới." });

    // 3.1. Mã hóa lại token từ params để đem đi so sánh với DB
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 3.2. Tìm User có token này và token chưa hết hạn
    const user = await prisma.user.findFirst({
      where: {
        resetToken: resetTokenHash,
        resetTokenExp: { gt: new Date() } // Exp phải lớn hơn thời gian hiện tại
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Mã khôi phục không hợp lệ hoặc đã hết hạn." });
    }

    // 3.3. Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3.4. Lưu mật khẩu mới và xóa token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExp: null
      }
    });

    res.status(200).json({ message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập." });
  } catch (error) {
    console.error("Lỗi resetPassword:", error);
    res.status(500).json({ error: "Lỗi hệ thống." });
  }
};

module.exports = { register, login, resetPassword, forgotPassword };