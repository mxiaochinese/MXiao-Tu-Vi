# Handoff cho Codex - bản 1.11.0

## File cần dùng

Mở toàn bộ repository source. Codex phải đọc `AGENTS.md` trước khi sửa. Không dùng riêng gói public để tiếp tục phát triển vì gói public không chứa test và source engine rời.

## Lệnh bắt buộc

```bash
npm run codex-check
```

Nếu máy có Docker hoặc veraPDF CLI:

```bash
npm run test:pdfua
```

Nếu veraPDF được cài ở vị trí riêng:

```bash
VERAPDF_BIN=/duong-dan/toi/verapdf npm run test:pdfua
```

## Nguyên tắc sửa code

- Không thay đổi công thức Tử Vi nếu chưa thêm nguồn và fixture độc lập.
- Không dùng output của engine để tạo expected fixture cho chính engine.
- Không trộn dị bản Lưu Hà, giờ Tý hoặc vòng Tràng Sinh giữa các profile.
- Mọi thay đổi công thức phải có unit test và ít nhất một ca đối chiếu công khai khi có dữ liệu.
- Không đưa mã quy tắc, ghi chú phát triển hoặc JSON debug vào giao diện và PDF.
- Giữ mô hình không tài khoản, không backend và không gửi dữ liệu sinh ra ngoài.
- Giữ PDF theo trang A4, có giới hạn trang cứng và không cắt đoạn giữa chừng.

## Mục tiêu khi đưa lên GitHub

1. Chạy toàn bộ test.
2. Tạo repository GitHub mới.
3. Push nhánh `main`.
4. Bật GitHub Pages bằng workflow có sẵn.
5. Kiểm tra job `Verify` và job `pdfua`.
6. Tải artifact `verapdf-report.xml`.
7. Chỉ ghi PDF/UA-1 compliant nếu báo cáo veraPDF có `isCompliant="true"`.
8. Trả lại URL GitHub Pages và tóm tắt kết quả Actions.

## Phạm vi đã chốt

- Hai phương pháp được hỗ trợ trong release này là Tân Biên và Áo Bí.
- Trung Châu không thuộc phạm vi 1.11.0; không thêm profile này nếu chưa có corpus công thức và fixture độc lập.
- 62 lá số công khai là bộ hồi quy diện rộng hiện hành; 14 lá số trong số đó có fixture sâu đủ 12 cung.
