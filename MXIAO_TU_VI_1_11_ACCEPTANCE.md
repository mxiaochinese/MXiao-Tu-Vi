# Biên bản nghiệm thu MXiao Tử Vi 1.11.0

Ngày nghiệm thu: 2026-08-08

## Phạm vi sản phẩm

- Web app tĩnh, không tài khoản, không backend, không tự động lưu hoặc gửi dữ liệu sinh ra ngoài.
- Hai phương pháp lập lá số thuộc phạm vi release: Tân Biên và Áo Bí.
- Nhập ngày dương/âm, giờ chính xác hoặc khung giờ, giới tính, múi giờ và thời điểm muốn xem.
- Có đại vận, lưu đại hạn, tiểu hạn, lưu niên và lưu nguyệt theo phạm vi xem; Lưu nhật và Lưu thời không nằm trong flow công khai sau patch phạm vi xem.
- Luận giải chính ở dạng đoạn văn phân tích, không dùng danh sách dữ kiện vụn làm nội dung chính.
- Có lựa chọn nội dung cần xuất PDF, PDF văn bản searchable/selectable và PDF hình ảnh giữ bố cục.

## Kiểm thử engine và dữ liệu

- 96.024 ca quy đổi âm dương lịch đạt.
- 2 phương pháp lập lá số độc lập đạt.
- 36 lá số engine toàn phần đạt.
- 5 nhóm cách cục, giáp cung và mạng hội chiếu đạt.
- 62/62 lá số công khai tầng rộng đạt, tổng 558/558 phép đối chiếu.
- 14/14 lá số công khai tầng sâu đạt, tổng 168 cung hoàn chỉnh.
- 876/876 vị trí phụ tinh - Tứ Hóa được chọn đạt.
- 22/22 kiểm tra Tuần - Triệt đạt.

## Kiểm thử PDF

- PDF văn bản: 40 trang A4 trong dữ liệu mẫu đầy đủ.
- PDF trực tiếp: 22 trang A4 trong dữ liệu mẫu đầy đủ.
- PDF văn bản dùng PDF 1.7, có XMP, ngôn ngữ vi-VN, bookmark, tagged structure và font Unicode nhúng.
- Preflight 1.11.0 kiểm tra 1 H1, 75 H2, 54 H3, 220 P, 1 Figure và 1.016 MCID có ánh xạ ParentTree nhất quán.
- Nhãn thương hiệu trên bìa được đánh dấu Artifact, không còn tạo H3 đứng trước H1.
- Ghostscript đọc toàn bộ PDF với PDFSTOPONERROR.
- Text tiếng Việt trích xuất được, không có ký tự thay thế lỗi.
- PDF được render toàn bộ 40 + 22 trang để kiểm tra trực quan, không phát hiện cắt chữ, chồng footer, trang trắng bất thường hoặc tràn khung.

## Kiểm thử triển khai

- `npm run codex-check` đạt trên source sạch với thứ tự build -> E2E sinh artifact -> test toàn bộ -> final-check.
- Workflow CI được cấu hình để cài đủ pypdf, Ghostscript, Poppler và Playwright, rồi truyền đúng PDF vừa sinh sang job veraPDF.
- Workflow GitHub Pages cài đủ phụ thuộc cho `npm run verify` trước deploy.
- Static server smoke tại repository subpath đạt.
- Browser E2E desktop/mobile đạt.
- `dist` chỉ chứa 12 file vận hành công khai.

## PDF/UA

Repository có workflow veraPDF profile `ua1`. Môi trường nghiệm thu hiện tại không thể tải veraPDF do DNS ngoài bị chặn, nên không ghi nhận chứng nhận PDF/UA độc lập tại đây. Đây là bước validator bên ngoài, không phải lỗi chức năng của web app. Chỉ được tuyên bố PDF/UA-1 compliant khi veraPDF trả `isCompliant="true"`.

## Trạng thái

Không còn backlog chức năng bắt buộc trong phạm vi đã chốt. Trung Châu không thuộc scope 1.11.0 và không được xem là tính năng thiếu. Các mở rộng trường phái khác chỉ thực hiện khi có corpus công thức cùng fixture độc lập.
