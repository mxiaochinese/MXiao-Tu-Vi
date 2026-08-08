# AGENTS.md

## Mục tiêu sản phẩm

Duy trì MXiao Tử Vi như một web app tĩnh, không tài khoản, không backend, không tự động lưu hoặc gửi dữ liệu sinh ra ngoài. Giao diện người dùng và PDF không được chứa ghi chú phát triển, mã quy tắc, JSON debug hoặc thuật ngữ nội bộ.

## Lệnh bắt buộc trước khi bàn giao

```bash
npm run codex-check
```

Nếu môi trường có veraPDF CLI hoặc Docker:

```bash
npm run test:pdfua
```

Không tuyên bố PDF/UA-1 compliant nếu veraPDF không trả `isCompliant="true"`.

## Quy tắc học thuật

- Không sửa công thức Tử Vi nếu chưa có nguồn và test hồi quy độc lập.
- Không lấy output của engine làm expected fixture cho chính engine.
- Không trộn dị bản giữa các phương pháp.
- Hai phương pháp thuộc phạm vi hiện tại: `VN_TAN_BIEN_1956` và `VN_AO_BI_1972`.
- Trung Châu không thuộc phạm vi release hiện tại. Chỉ mở khi có corpus công thức và fixture độc lập đủ mạnh.
- Giữ các dị bản như Lưu Hà, giờ Tý, Tràng Sinh và vận hạn tháng nhuận tách biệt khi nguồn khác nhau.

## Quy tắc nội dung

- Luận giải chính phải là đoạn văn phân tích logic, không biến trở lại thành bullet dữ kiện.
- Không thêm khuyến nghị y tế, tài chính hoặc quyết định đời sống mang tính chỉ đạo.
- Không dùng ngôn ngữ chắc chắn tuyệt đối cho dự báo.
- Không phơi bày rule ID, tên dataset, fixture, test, engine version hoặc ghi chú code trên giao diện/PDF.

## PDF

- A4 dọc cho nội dung và A4 ngang cho lá số.
- Không cắt đoạn giữa trang và phải giữ giới hạn trang cứng.
- PDF văn bản phải giữ text searchable/selectable và cấu trúc tagged.
- Mọi thay đổi PDF phải chạy `npm run test:pdf` và `npm run test:e2e`.
- Không đánh dấu branding/trang trí thành heading.

## Deploy

- `npm run verify` phải xanh trước khi push.
- GitHub Pages deploy thư mục `dist` qua workflow có sẵn.
- Không đưa tests, fixtures, scripts hay tài liệu phát triển vào `dist`.
