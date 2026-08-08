# Kiểm tra accessibility của PDF Bản đồ sao

## Kiểm tra cục bộ

Lệnh:

```bash
npm run test:pdf
```

Bộ preflight kiểm tra:

- Header PDF 1.7.
- XMP metadata stream.
- Định danh `pdfuaid:part = 1`.
- Ngôn ngữ `vi-VN`.
- `MarkInfo`, `StructTreeRoot`, bookmark và `DisplayDocTitle`.
- `Tabs /S` và `StructParents` trên từng trang.
- Tính toàn vẹn `StructTreeRoot`, `ParentTree`, MCR và toàn bộ MCID trên từng trang.
- Mọi MCID phải ánh xạ đúng về phần tử cấu trúc tương ứng trong ParentTree.
- Chỉ có một H1 và heading semantic đầu tiên của tài liệu phải là H1.
- Tag H1, H2, H3, P và Figure.
- Alt text cho hình lá số.
- Artifact cho nền, đường kẻ và footer.
- Font nhúng có ToUnicode.
- Trích xuất tiếng Việt không có ký tự thay thế lỗi.
- A4 dọc/ngang đúng kích thước, không có annotation chưa gắn cấu trúc, OpenAction, AcroForm hoặc mã hóa.
- Ghostscript đọc toàn bộ file với `PDFSTOPONERROR` mà không báo lỗi cú pháp.

## Kiểm định veraPDF trong CI

Workflow `.github/workflows/ci.yml` chạy image chính thức đã ghim phiên bản:

```bash
docker run --rm -v "$PWD:/data" verapdf/cli:v1.30.2 \
  -f ua1 /data/sample/MXiao-Ban-Do-Sao-final.pdf > verapdf-report.xml
python3 tests/verify_verapdf_report.py verapdf-report.xml
```

Báo cáo XML được lưu thành GitHub Actions artifact kể cả khi validation thất bại. Script kiểm tra yêu cầu mọi `validationReport` có `isCompliant="true"` và không có lỗi parse, mã hóa, thiếu bộ nhớ hoặc exception.

Chạy cục bộ bằng một trong ba cách:

```bash
VERAPDF_BIN=/duong-dan/toi/verapdf npm run test:pdfua
```

Hoặc đặt `verapdf` trong PATH, hoặc dùng Docker rồi chạy:

```bash
npm run test:pdfua
```

veraPDF chỉ kiểm tra các yêu cầu PDF/UA có thể xác minh bằng máy. Chất lượng alt text, tính hợp lý của thứ tự đọc và trải nghiệm thực tế với trình đọc màn hình vẫn cần đánh giá bởi con người.
