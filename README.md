# MXiao Tử Vi

Web app tĩnh để lập lá số Tử Vi từ ngày sinh, giờ sinh, giới tính và múi giờ. Ứng dụng không có tài khoản, không tự động lưu và không gửi dữ liệu sinh ra ngoài.

## Chức năng

- Nhập ngày dương lịch hoặc âm lịch, gồm tháng nhuận.
- Chọn giờ và phút chính xác hoặc chọn một trong 12 khung giờ Địa Chi.
- Chọn múi giờ cho thời điểm sinh.
- Chọn riêng phương pháp Tân Biên hoặc Áo Bí. Hai phương pháp không trộn quy tắc giờ Tý và vòng Tràng Sinh.
- Lập 12 cung, Mệnh, Thân, chính tinh, phụ tinh, Tứ Hóa, Tuần và Triệt.
- Hiển thị đại vận 10 năm, lưu đại hạn, tiểu hạn, sao lưu theo năm, lưu nguyệt, lưu nhật và lưu thời.
- Chọn năm, tháng âm lịch, ngày âm lịch và khung giờ cần xem.
- Cho phép đánh dấu tháng xem là tháng nhuận và chọn một trong hai quy ước vận hạn tháng nhuận.
- Luận giải tổng quan, Mệnh - Thân, 12 cung và từng lớp vận hạn bằng các đoạn văn phân tích liên kết chính tinh, phụ tinh, Tứ Hóa, tam phương và cung xung chiếu.
- Nhận diện các nhóm cách cục cốt lõi, giáp cung và mạng kích hoạt nhiều tầng.
- So sánh hai khung giờ sinh để nhận diện phần cấu trúc lá số thay đổi.
- Chọn từng phần cần xuất PDF hoặc dùng cấu hình nhanh: Đầy đủ, Tóm tắt, Vận hạn, 12 cung.
- Tải một chạm PDF A4 dạng văn bản có thể tìm kiếm, chọn và sao chép chữ.
- PDF văn bản dùng PDF 1.7, có XMP, định danh PDF/UA-1, metadata, bookmark, ngôn ngữ tài liệu, cấu trúc H1-H3, đoạn văn, hình có alt text và Artifact cho thành phần trang trí.
- Tải một chạm PDF A4 dạng hình ảnh giữ bố cục ổn định.
- Giới hạn tối đa 48 trang cho cả PDF văn bản và PDF hình ảnh; nội dung dài được ngắt trang thay vì thu nhỏ chữ.
- Chạy hoàn toàn trên trình duyệt, không yêu cầu backend.

## Chạy tại máy

```bash
npm run verify
python3 -m http.server 4173
```

Mở `http://localhost:4173`.

## Kiểm thử đối chiếu công khai

```bash
npm run test:public
```

Bộ kiểm thử gồm hai tầng:

- Tầng rộng: 62 lá số công khai, gồm 186 kiểm tra metadata và 372 kiểm tra cung - chính tinh.
- Tầng sâu: 14 lá số công khai có đủ 12 cung, gồm 168 cung hoàn chỉnh, 876 vị trí phụ tinh - Tứ Hóa được chọn, 22 kiểm tra Tuần - Triệt và 2 dị bản profile được ghi riêng.

Báo cáo chi tiết nằm tại `docs/PUBLIC_VALIDATION_REPORT.md`.

## Kiểm thử PDF accessibility

```bash
npm run test:pdf
```

Bài kiểm tra cục bộ xác nhận PDF 1.7, XMP, định danh PDF/UA-1, ngôn ngữ, cây cấu trúc, thứ tự tab, alt text, font Unicode nhúng, toàn vẹn MCID - ParentTree, thứ tự heading và khả năng trích xuất tiếng Việt. Quy trình CI dùng veraPDF 1.30.2 với profile `ua1` được mô tả tại `docs/PDF_ACCESSIBILITY.md`. Chạy cục bộ bằng `npm run test:pdfua` khi máy có Docker.

## Kiểm thử trình duyệt

```bash
npm run test:e2e
```

Bài kiểm thử bao gồm hai phương pháp lập lá số, tháng nhuận, lựa chọn nội dung báo cáo, hai loại PDF, metadata, bookmark và cấu trúc PDF.

## Triển khai GitHub Pages

Workflow trong `.github/workflows/pages.yml` kiểm tra ứng dụng, tạo thư mục `dist` và triển khai nội dung công khai trong thư mục đó.

## Phạm vi sử dụng

Kết quả thuộc hệ thống Tử Vi truyền thống và chỉ dùng để tham khảo. Nội dung sức khỏe không dùng để chẩn đoán bệnh. Nội dung tài chính không thay thế tư vấn chuyên môn.
