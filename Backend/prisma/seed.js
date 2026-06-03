const prisma = require('../src/config/prisma'); // Dùng đúng config của bạn
const { fakerVI: faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

// ==========================================
// KHO TÀNG DỮ LIỆU CÓ Ý NGHĨA (CONTEXTUAL MOCKS)
// ==========================================
const WORKSPACE_NAMES = ["Học tập 📚", "Công việc Công ty 🏢", "Dự án Cá nhân 🚀", "Gia đình & Sức khỏe 🏃", "Freelance 💻"];
const PROJECT_TITLES = ["Thiết kế lại Website", "Kế hoạch Marketing Q3", "Học tiếng Anh IELTS", "Làm Đồ án Tốt nghiệp", "Tập Gym giảm cân", "Đọc 50 cuốn sách"];
const TASK_TITLES = [
  "Viết báo cáo tuần gửi sếp", "Lên ý tưởng thiết kế giao diện", "Họp team lúc 9h sáng",
  "Gửi email báo giá cho khách hàng", "Fix bug lỗi đăng nhập trên Mobile", 
  "Ôn 50 từ vựng tiếng Anh", "Làm slide thuyết trình bảo vệ", "Nộp tài liệu cho phòng Nhân sự",
  "Chạy bộ 3km quanh công viên", "Đi siêu thị mua đồ ăn tuần"
];
const TASK_CONTENTS = [
  "Cần hoàn thành trước buổi họp chiều nay. Nhớ đính kèm file Excel số liệu.",
  "Đã có sườn ý tưởng, cần triển khai chi tiết hơn. Tham khảo các trang đối thủ.",
  "Chú ý check lại lỗi giao diện trên màn hình iPhone 13.",
  "Liên hệ với anh Minh bên đối tác để chốt hợp đồng trước thứ 5.",
  "Đọc kỹ chương 3 và chương 4 để chuẩn bị cho bài kiểm tra giữa kỳ."
];
const NOTE_TITLES = ["Ý tưởng Marketing tháng 6", "Tóm tắt sách Muôn kiếp nhân sinh", "Ghi chú cuộc họp dự án", "Danh sách mua sắm", "Pass wifi các quán cafe"];
const REMINDER_TITLES = ["Uống một cốc nước lọc 💧", "Đứng dậy đi lại 5 phút 🚶", "Tập thể dục mắt 👁️", "Uống thuốc bổ 💊", "Nghỉ ngơi pha cafe ☕"];

async function main() {
  console.log("🌱 Đang gieo mầm dữ liệu có ý nghĩa (Realistic Seeding)...");

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('123456', salt);

  for (let i = 0; i < 4; i++) {
    // 1. TẠO USER
    const user = await prisma.user.create({
      data: {
        fullName: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash: defaultPassword,
        role: 'USER',
      }
    });
    console.log(`👤 Đã tạo User: ${user.fullName} (${user.email})`);

    // 2. BỐC NGẪU NHIÊN 2 WORKSPACE TỪ KHO
    const userWorkspaces = faker.helpers.arrayElements(WORKSPACE_NAMES, 2);
    
    for (const wsName of userWorkspaces) {
      const workspace = await prisma.workspace.create({
        data: {
          name: wsName,
          color: faker.color.rgb({ format: 'hex', casing: 'lower' }),
          icon: 'Briefcase',
          userId: user.id,
          tabs: {
            create: [
              { 
                title: 'Google Search', 
                url: 'https://www.google.com', 
                favicon: 'https://www.google.com/favicon.ico' 
              },
              { 
                title: 'GitHub', 
                url: 'https://github.com', 
                favicon: 'https://github.com/favicon.ico' 
              },
              { 
                title: 'VNExpress - Báo Tiếng Việt', 
                url: 'https://vnexpress.net', 
                favicon: 'https://s1.vnecdn.net/vnexpress/restruct/i/v861/favicon.ico' 
              }
            ]
            }
        }
      });

      // 3. BỐC 2 DỰ ÁN NGẪU NHIÊN CHO WORKSPACE ĐÓ
      const userProjects = faker.helpers.arrayElements(PROJECT_TITLES, 2);
      for (const pTitle of userProjects) {
        const project = await prisma.project.create({
          data: {
            title: pTitle,
            progress: faker.number.int({ min: 10, max: 90 }),
            userId: user.id,
            workspaceId: workspace.id,
          }
        });

        // 4. TẠO 5-8 TÁC VỤ CÓ Ý NGHĨA CHO DỰ ÁN
        const taskCount = faker.number.int({ min: 5, max: 8 });
        for (let t = 0; t < taskCount; t++) {
          await prisma.task.create({
            data: {
              title: faker.helpers.arrayElement(TASK_TITLES),
              content: faker.helpers.arrayElement(TASK_CONTENTS),
              isCompleted: faker.datatype.boolean(),
              priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
              endDate: faker.helpers.arrayElement([
                faker.date.recent({ days: 5 }),  // Quá hạn
                new Date(),                      // Hôm nay
                faker.date.soon({ days: 10 }),   // Tương lai
                null                             // Không có hạn
              ]),
              userId: user.id,
              projectId: project.id
            }
          });
        }
      }
    }

    // 5. TẠO GHI CHÚ
    for (let n = 0; n < 3; n++) {
      await prisma.note.create({
        data: {
          title: faker.helpers.arrayElement(NOTE_TITLES),
          content: faker.helpers.arrayElement(TASK_CONTENTS),
          color: faker.helpers.arrayElement(['#dbeafe', '#fef08a', '#bbf7d0', '#fbcfe8', '#e9d5ff']),
          url: "https://google.com",
          userId: user.id
        }
      });
    }

    // 6. TẠO NHẮC NHỞ
    for (let r = 0; r < 2; r++) {
      await prisma.reminder.create({
        data: {
          title: faker.helpers.arrayElement(REMINDER_TITLES),
          interval: faker.helpers.arrayElement([30, 45, 60]),
          icon: faker.helpers.arrayElement(["💧", "👁️", "🚶", "💊", "☕"]),
          color: '#dbeafe',
          isActive: faker.datatype.boolean(),
          userId: user.id
        }
      });
    }
  }

  console.log("✅ Đã gieo mầm dữ liệu Thực tế thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi gieo mầm:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });