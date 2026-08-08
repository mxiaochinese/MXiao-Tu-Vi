# Báo cáo đối chiếu lá số công khai - MXiao Tử Vi 1.11.0

Ngày cập nhật: 2026-08-08

## Mục tiêu

Bộ hồi quy công khai được chia thành hai tầng. Tầng rộng kiểm tra độ phủ năm sinh, giờ sinh, Cục và chính tinh. Tầng sâu kiểm tra đủ 12 cung cùng một tập phụ tinh, Tứ Hóa, Tuần và Triệt có dữ liệu nguồn rõ.

## Tầng rộng

Tầng rộng gồm 62 lá số công khai trên tuvi.vn, bao phủ đủ 5 Cục, 12 khung giờ sinh và 14 chính tinh.

Kết quả:

- 62/62 lá số đạt.
- 186/186 kiểm tra metadata về ngày dương, hành Cục và số Cục đạt.
- 372/372 kiểm tra tên cung và tập chính tinh tại các cung được chọn đạt.
- Tổng 558/558 phép đối chiếu đạt.

## Tầng sâu

Tầng sâu gồm 14 lá số công khai có dữ liệu đủ 12 cung:

- 82761
- 15430
- 32244
- 421213
- 20250
- 7158
- 7217
- 56441
- 7310
- 34219
- 10240
- 120536
- 14997
- 40817

Kết quả:

- 168/168 cung được kiểm tra đồng thời tên cung và toàn bộ tập chính tinh.
- 876/876 vị trí phụ tinh và Tứ Hóa được chọn từ dữ liệu hiển thị công khai đạt.
- 22/22 tập vị trí Tuần - Triệt có thể đọc chắc chắn từ nguồn đạt.
- 2 dị bản Lưu Hà được ghi riêng, không ép nguồn khác profile phải trùng với profile Tân Biên.

## Lỗi Tứ Hóa năm Canh đã sửa

Lá số công khai 14997 cho thấy năm Canh có:

- Thái Dương Hóa Lộc.
- Vũ Khúc Hóa Quyền.
- Thái Âm Hóa Khoa.
- Thiên Đồng Hóa Kỵ.

Bảng cũ đặt Thiên Đồng Hóa Khoa và Thái Âm Hóa Kỵ. Engine từ 1.10.0 đã sửa thứ tự này và khóa bằng unit test cùng fixture công khai.

## Quản lý dị bản Lưu Hà

Hai lá số mới cũng cho thấy nguồn công khai dùng một cách an Lưu Hà khác profile Tân Biên ở một số Thiên Can. Thay vì sửa engine để chạy theo nguồn đối chiếu, fixture ghi rõ:

- Vị trí nguồn công khai.
- Vị trí theo profile Tân Biên.
- Lý do loại sao này khỏi nhóm bắt buộc phải trùng.

Cách xử lý này tránh trộn hai dị bản vào cùng một profile và tránh tạo kiểm thử sai phương pháp.

## Lỗi Hỏa Tinh đã sửa ở bản 1.9.0

Bản 1.9.0 đã sửa điểm khởi Hỏa Tinh của nhóm Hợi - Mão - Mùi từ Dần sang Dậu. Các test hồi quy vẫn được giữ nguyên trong 1.11.0.

## Quy tắc dữ liệu

- Fixture chỉ lưu dữ liệu cấu trúc cần cho kiểm thử.
- Không sao chép phần luận giải có bản quyền của trang nguồn.
- Không dùng kết quả engine làm kỳ vọng cho chính engine.
- Chỉ thêm sao hoặc vị trí chặn khi dữ liệu nguồn đủ rõ.
- Các dị bản được ghi riêng thay vì ép một profile phải trùng mọi website.
- Tuần và Triệt được bỏ qua nếu bố cục nguồn không cho phép xác định chắc chắn hai cung chịu tác động.

## Giới hạn

Mười bốn lá số đối chiếu sâu chưa tương đương kiểm tra đủ 12 cung của toàn bộ 62 lá số. Việc mở rộng tiếp chỉ có giá trị khi trang nguồn cung cấp dữ liệu ổn định và đọc được rõ. Tạo kỳ vọng từ chính engine để nâng số lượng là kiểm thử vòng tròn và không được sử dụng.

Đối chiếu kỹ thuật xác nhận ngày, Cục, cung và sao. Nó không chứng minh các diễn giải về tính cách hoặc tương lai là dữ kiện khoa học.
