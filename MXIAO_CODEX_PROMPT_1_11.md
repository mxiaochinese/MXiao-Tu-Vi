Mở repository MXiao Tử Vi 1.11.0 này và đọc AGENTS.md trước.

Mục tiêu của phiên Codex này là xác minh, đưa repository lên GitHub và deploy GitHub Pages. Không redesign và không thay đổi công thức nếu toàn bộ test đã đạt.

Thực hiện theo thứ tự:

1. Chạy `npm run codex-check`.
2. Chạy `npm run test:pdfua` bằng veraPDF 1.30.2 nếu môi trường có Docker hoặc veraPDF CLI.
3. Nếu veraPDF không compliant, đọc `verapdf-report.xml`, sửa đúng lỗi PDF/UA, chạy lại toàn bộ `npm run codex-check`, rồi chạy veraPDF lại. Không chỉ sửa test.
4. Nếu mọi kiểm thử xanh, khởi tạo Git repository nếu cần, commit source và push nhánh `main` lên một repository GitHub mới. Không commit file tạm, render trung gian hoặc báo cáo local không cần thiết.
5. Bật GitHub Pages bằng workflow `.github/workflows/pages.yml`.
6. Chờ workflow Verify và Deploy GitHub Pages hoàn tất.
7. Trả lại cho tôi:
   - URL repository GitHub
   - URL GitHub Pages
   - kết quả `npm run codex-check`
   - kết quả job `pdfua` và giá trị `isCompliant`
   - nếu có, file hoặc tóm tắt `verapdf-report.xml`
   - commit hash cuối
   - danh sách file đã thay đổi, nếu Codex phải sửa lỗi

Ràng buộc bắt buộc:
- Không tài khoản, không backend.
- Không gửi dữ liệu sinh ra ngoài.
- Không thêm Trung Châu hoặc profile mới.
- Không trộn dị bản.
- Không dùng output engine để tự tạo expected fixture.
- Không đưa rule ID, dataset, JSON debug, ghi chú code hay thông tin phát triển lên UI/PDF.
- Luận giải chính phải giữ dạng đoạn văn logic.
- PDF phải A4, không cắt đoạn và giữ giới hạn trang cứng.
- Chỉ tuyên bố PDF/UA-1 compliant khi veraPDF trả `isCompliant="true"`.
