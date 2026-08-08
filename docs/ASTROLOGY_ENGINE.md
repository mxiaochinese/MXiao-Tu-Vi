# Engine Bản đồ sao

## Quyết định giấy phép

Repository MXiao tiếp tục dùng giấy phép độc quyền. Module Bản đồ sao không dùng Swiss Ephemeris, không chứa dữ liệu Swiss Ephemeris và không gọi dịch vụ ephemeris từ xa.

Engine thiên văn là Astronomy Engine 2.1.19, giấy phép MIT. Bản trình duyệt giữ nguyên notice MIT và giấy phép đầy đủ được lưu tại `third_party/astronomy-engine-LICENSE.txt`.

Phép tính các góc và cusp Nhà Placidus được chuyển thể từ triển khai tham chiếu life-chart-engine, giấy phép MIT. Giấy phép đầy đủ được lưu tại `third_party/life-chart-engine-LICENSE.txt`.

## Mô hình tính

- Hoàng đạo tropical, vị trí geocentric apparent.
- Mười hành tinh chính cùng True North Node; South Node được suy ra đối xứng 180 độ.
- Ba hệ thống Nhà: Placidus, Whole Sign và Equal House.
- Năm góc hợp chính với orb phiên bản `mxiao_natal_v1`.
- Đổi giờ địa phương sang UTC bằng IANA timezone trong trình duyệt, có phát hiện giờ DST không tồn tại hoặc lặp lại.
- Khi không biết giờ hoặc chỉ biết khoảng giờ, không công bố ASC, MC hay Nhà; chỉ giữ các kết quả ổn định qua mẫu 5 phút.
- Placidus tại vĩ độ không khả dụng trả lỗi rõ ràng và yêu cầu người dùng tự chọn Whole Sign hoặc Equal House; không tự đổi hệ thống Nhà.

## Kiểm chứng

Fixture hồi quy nằm tại `tests/fixtures/astrology-reference.json`, lấy độc lập từ bộ tham chiếu MIT life-chart-engine, không được sinh từ output của MXiao. Test khóa sai số hành tinh, True Node, ASC, MC và 12 cusp; đồng thời kiểm tra DST gap/fold, vĩ độ cao và giờ sinh không xác định.

Ứng dụng chạy hoàn toàn tại trình duyệt. Danh mục địa điểm đi kèm source; không gửi tên, ngày giờ sinh hay vị trí người dùng ra mạng.
