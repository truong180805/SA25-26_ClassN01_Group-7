const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const isAdmin = async (req, res, next) => {
  try {
    // 1. Lấy token từ Header do Frontend gửi lên
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "Vui lòng đăng nhập." });
    }

    // 2. Giải mã token để lấy userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Tìm user trong Database và kiểm tra quyền (role)
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId } 
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Truy cập bị từ chối! Khu vực chỉ dành cho Admin." });
    }

    // Nếu đúng là Admin, cho phép đi tiếp vào API
    req.user = user; 
    next();
  } catch (error) {
    console.error("Lỗi xác thực Admin:", error);
    res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

module.exports = { isAdmin };