# Changelog

## MXiao Huyền Học - Bản đồ sao

- Mở rộng ứng dụng thành hai công cụ độc lập: Tử Vi và Bản đồ sao; giữ nguyên công thức và dữ liệu Tử Vi hiện có.
- Thêm Bản đồ sao tropical với 10 hành tinh, True North Node, Placidus, Whole Sign, Equal House, năm góc hợp chính và các mô hình cốt lõi.
- Giữ repository độc quyền nhưng dùng Astronomy Engine 2.1.19 và thuật toán Nhà tham chiếu theo giấy phép MIT; không dùng Swiss Ephemeris.
- Xử lý ngày giờ, IANA timezone và DST tại trình duyệt; không gửi dữ liệu sinh hoặc địa điểm ra mạng.
- Thêm chế độ giờ chính xác, khoảng giờ và không biết giờ; ẩn góc/Nhà và chỉ công bố kết quả ổn định khi giờ chưa chắc chắn.
- Thêm giao diện Gilroy responsive, vòng tròn Bản đồ sao, các bảng phân tích và PDF/UA riêng cho Bản đồ sao.
- Bổ sung fixture độc lập, kiểm thử hành tinh/cusp, DST, vĩ độ cao, bất định giờ, trình duyệt và PDF/UA.

## Patch phạm vi xem vận sau V4

- Thêm bốn phạm vi độc lập: lá số tổng quan, vận năm, một tháng cụ thể và toàn bộ các tháng trong năm.
- Chỉ hiển thị trường năm/tháng khi phạm vi cần dùng; tháng nhuận chỉ xuất hiện khi lịch âm xác nhận hợp lệ.
- Loại Lưu nhật và Lưu thời khỏi form, báo cáo web và PDF công khai; giữ nguyên các hàm công thức cũ để tiếp tục kiểm thử hồi quy độc lập.
- Giữ hệ thống lựa chọn PDF tách biệt với phạm vi dữ liệu được tính.

## 1.11.0 - 2026-08-08

- Sửa thứ tự semantic trên bìa PDF: nhãn thương hiệu được đánh dấu Artifact thay vì H3 đứng trước H1.
- Nâng kiểm tra accessibility cục bộ từ kiểm tra marker sang kiểm tra toàn vẹn StructTreeRoot, ParentTree, StructParents, MCR và MCID trên toàn bộ 40 trang.
- Khóa quy tắc một H1 duy nhất, heading đầu tiên phải là H1, Figure phải có alt text và mọi MCID phải ánh xạ đúng về phần tử cấu trúc.
- Kiểm tra A4 dọc/ngang, annotation, OpenAction, AcroForm, mã hóa, font Unicode nhúng, ToUnicode, Ghostscript và trích xuất tiếng Việt trong cùng preflight.
- Bổ sung `AGENTS.md` để Codex nhận trực tiếp lệnh kiểm thử, phạm vi sản phẩm và nguyên tắc không trộn dị bản.
- Sửa thứ tự `codex-check`: build -> E2E sinh lại PDF -> test toàn bộ -> final-check, tránh kiểm định nhầm artifact PDF cũ.
- Hoàn thiện GitHub Actions: cài pypdf, Ghostscript, Poppler và Playwright; upload PDF vừa sinh giữa các job; veraPDF kiểm đúng artifact của phiên CI.
- Hoàn thiện workflow GitHub Pages để cài đủ phụ thuộc kiểm thử trước `npm run verify`.
- Chốt phạm vi release: hai phương pháp Việt Nam Tân Biên và Áo Bí; không coi Trung Châu là tính năng còn thiếu của bản này.

## 1.10.0 - 2026-08-02

- Sửa Tứ Hóa năm Canh: Thái Âm Hóa Khoa và Thiên Đồng Hóa Kỵ.
- Mở rộng tầng rộng từ 60 lên 62 lá số, đạt 558/558 phép đối chiếu.
- Mở rộng tầng sâu từ 12 lên 14 lá số, đạt 168 cung, 876 vị trí phụ tinh - Tứ Hóa và 22 kiểm tra Tuần - Triệt.
- Ghi riêng 2 dị bản Lưu Hà thay vì ép nguồn khác profile phải trùng với profile Tân Biên.
- Bổ sung unit test khóa bảng Tứ Hóa năm Canh.
- Nâng script veraPDF để hỗ trợ `VERAPDF_BIN`, binary trong PATH hoặc Docker.
- Thêm tài liệu bàn giao Codex và lệnh `npm run codex-check`.

## 1.9.0 - 2026-08-02

- Sửa lỗi Hỏa Tinh của nhóm tuổi Hợi - Mão - Mùi: điểm khởi đúng là Dậu, không phải Dần.
- Bổ sung unit test cho Hỏa Tinh và Linh Tinh ở các nhóm tam hợp và nhiều giờ sinh.
- Mở rộng tầng rộng từ 56 lên 60 lá số, với 540/540 phép đối chiếu đạt.
- Mở rộng tầng sâu từ 7 lên 12 lá số, từ 84 lên 144 cung, từ 381 lên 762 vị trí phụ tinh - Tứ Hóa và từ 8 lên 18 kiểm tra Tuần - Triệt.
- Thêm kiểm tra cú pháp PDF bằng Ghostscript với `PDFSTOPONERROR`.
- Thêm GitHub Actions job dùng veraPDF 1.30.2 và profile `ua1`, lưu báo cáo XML làm artifact.
- Thêm lệnh `npm run test:pdfua` để chạy cùng quy trình veraPDF trên máy có Docker.

## 1.8.0 - 2026-08-02

- Phục hồi hai phương pháp lập lá số độc lập: Tân Biên và Áo Bí.
- Tách quy tắc giờ Tý và vòng Tràng Sinh theo phương pháp được chọn.
- Mở rộng đối chiếu sâu từ 4 lên 7 lá số, từ 48 lên 84 cung và từ 137 lên 381 vị trí phụ tinh - Tứ Hóa.
- Nâng PDF văn bản lên PDF 1.7, thêm XMP và định danh PDF/UA-1.
- Thêm kiểm tra tự động về cấu trúc, ngôn ngữ, alt text, font Unicode và khả năng trích xuất văn bản.

## 1.7.0 - 2026-08-02

- Mở rộng bộ đối chiếu thành hai tầng: 56 lá số độ phủ rộng và 4 lá số kiểm tra sâu đủ 12 cung.
- Bổ sung 48 cung hoàn chỉnh, 137 vị trí phụ tinh - Tứ Hóa và 8 kiểm tra Tuần - Triệt từ dữ liệu công khai.
- Cập nhật `npm run test:public` để chạy đồng thời tầng rộng và tầng sâu.
- Bổ sung lựa chọn tháng xem là tháng nhuận.
- Bổ sung hai quy ước vận hạn tháng nhuận: chia đôi tháng nhuận và lặp lại tháng chính.
- Khóa bằng test ranh giới ngày 15 - 16 của quy ước chia đôi tháng nhuận.
- Bổ sung metadata, ngôn ngữ tài liệu, bookmark và cấu trúc Tagged PDF theo tiêu đề, đoạn văn, hình lá số và thành phần trang trí cho PDF văn bản.
- Bổ sung kiểm thử trình duyệt cho tháng nhuận, metadata, bookmark và cấu trúc PDF.

## 1.6.0 - 2026-08-02

- Sửa lỗi tính Ngũ hành Cục khi cung Mệnh nằm trước Dần trong vòng địa chi.
- Đối chiếu 56 lá số công khai trên tuvi.vn với 504 phép kiểm tra về ngày dương, Cục, tên cung và chính tinh.
- Bổ sung bộ fixture công khai và kiểm thử hồi quy để khóa lỗi an Cục và 14 chính tinh.
- Bổ sung nhận diện Tử Phủ Vũ Tướng, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Cự Nhật và Nhật Nguyệt trong tam phương tứ chính.
- Bổ sung phân tích Tả Hữu, Xương Khúc, Khôi Việt, Nhật Nguyệt, Kình Đà, Không Kiếp và Hỏa Linh giáp cung.
- Thay mô tả chồng lớp đơn giản bằng phân tích mạng kích hoạt giữa đại vận, lưu đại hạn, tiểu hạn, lưu niên, lưu nguyệt, lưu nhật và lưu thời.
- Bổ sung kiểm thử riêng cho cách cục, giáp cung và mạng hội chiếu.
- Ghi rõ giới hạn của đối chiếu công khai: kiểm chứng cấu trúc lá số, không chứng minh tính khoa học hoặc độ đúng của dự báo.

## 1.5.0 - 2026-08-01

- Viết lại toàn bộ lớp luận giải theo dạng đoạn văn phân tích có quan hệ logic.
- Mỗi mục luận giải hiện gồm tối thiểu hai đoạn, thường gồm ba lớp: chính tinh và trạng thái, phụ tinh và Tứ Hóa, tam phương và cung xung chiếu.
- Thay các danh sách "Căn cứ lá số" bằng nội dung được tích hợp trực tiếp vào lập luận.
- Gộp các phần sự nghiệp, tài chính, tình cảm, gia đình và sức khỏe thành bài tổng hợp liên cung thay vì lặp lại mô tả từng cung.
- Bổ sung phân tích sự chồng lớp giữa đại vận, lưu đại hạn, tiểu hạn, Lưu Thái Tuế, lưu nguyệt, lưu nhật và lưu thời.
- Tối ưu giao diện đọc dài với khoảng cách đoạn và căn đều văn bản.
- Cập nhật cả PDF văn bản và PDF hình ảnh để giữ nguyên cấu trúc đoạn văn.
- Nâng giới hạn PDF văn bản lên 48 trang A4 và PDF hình ảnh lên 30 trang để chứa các bài phân tích dạng đoạn văn, vẫn giữ giới hạn cứng chống kéo dài vô hạn.
- Bổ sung kiểm thử chất lượng nội dung: không còn trường dữ kiện dạng bullet, mỗi mục có nhiều đoạn và không chứa nhãn kỹ thuật.

## 1.4.0 - 2026-08-01

- Bổ sung lưu nhật theo ngày âm lịch lựa chọn.
- Bổ sung lưu thời theo khung giờ Địa Chi lựa chọn.
- Bổ sung Can Chi ngày, Can Chi giờ và các sao lưu động theo Can ngày, Can giờ.
- Bổ sung chế độ so sánh hai khung giờ sinh, chỉ ra các cấu trúc lá số thay đổi.
- Cho phép đưa bảng so sánh giờ sinh vào nội dung PDF.
- Chuyển PDF văn bản thành tải một chạm, không còn phụ thuộc hộp thoại in.
- PDF văn bản có thể tìm kiếm, chọn và sao chép chữ.
- Phân trang bảng tổng quan và bảng so sánh để không cắt nội dung.
- Giới hạn 30 trang PDF văn bản và 24 trang PDF hình ảnh.
- Bổ sung kiểm thử trình duyệt cho lưu nhật, lưu thời, so sánh giờ sinh và hai loại PDF.

## 1.3.0 - 2026-08-01

- Giữ mô hình không tài khoản và không lưu dữ liệu người dùng.
- Thêm bảng chọn nội dung xuất PDF với 14 phần riêng biệt.
- Thêm bốn cấu hình nhanh: Đầy đủ, Tóm tắt, Vận hạn và 12 cung.
- Áp dụng lựa chọn cho cả PDF dạng văn bản và PDF tải trực tiếp.
- PDF tự giảm số trang theo nội dung đã chọn và không tạo trang trắng cho mục bị loại.
- Hoàn thiện phần Tổng quan trong PDF tải trực tiếp, không bỏ sót các đoạn tổng hợp.
- Bổ sung kiểm thử desktop, mobile, PDF đầy đủ và PDF chỉ gồm vận hạn.

## 1.2.0 - 2026-08-01

- Bổ sung lựa chọn giờ sinh chính xác hoặc khung giờ Địa Chi khi người dùng không nhớ phút sinh.
- Bổ sung lưu nguyệt theo tháng âm lịch lựa chọn, gồm cung lưu nguyệt, Can Chi tháng và sao lưu theo tháng.
- Bổ sung nhóm luận giải lưu nguyệt và hiển thị lớp lưu nguyệt trên lá số.
- Bổ sung báo cáo A4 dạng văn bản có thể tìm kiếm, chọn và sao chép nội dung.
- Giữ bản PDF tải trực tiếp một chạm, giới hạn tối đa 20 trang A4.
- Tối ưu phân trang để thẻ luận giải không bị cắt giữa hai trang.
- Mở rộng kiểm thử trình duyệt cho chế độ khung giờ, tháng xem và hai phương thức xuất PDF.

## 1.1.0 - 2026-08-01

- Bỏ trường địa điểm sinh và tọa độ, chỉ giữ múi giờ.
- Bổ sung tổng quan lá số, đại vận, lưu đại hạn, tiểu hạn và vận hạn theo năm lựa chọn.
- Bổ sung sao lưu động của năm vào 12 cung.
- Dọn mã quy tắc, thông tin phát triển và nội dung gợi ý chủ quan khỏi giao diện và PDF.
- Chuẩn hóa PDF A4, giới hạn tối đa 20 trang và ngăn cắt khối luận giải giữa trang.
- Tạo bản triển khai GitHub Pages riêng trong thư mục `dist`.
