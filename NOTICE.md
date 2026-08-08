# Thông báo về thành phần bên thứ ba

## Quy đổi âm dương lịch

Ứng dụng sử dụng bản triển khai độc lập của các thuật toán thiên văn phổ biến để quy đổi lịch Việt Nam, gồm Julian day, sóc, kinh độ Mặt Trời và tháng nhuận.

## Độ sáng sao

Ma trận độ sáng sao được chuyển thể từ iztro 2.5.8 của SylarLong và cộng tác viên, phát hành theo giấy phép MIT. Bản sao giấy phép được lưu trong `third_party/iztro-LICENSE.txt`.

## Múi giờ

Danh mục tên múi giờ dựa trên IANA Time Zone Database. Dữ liệu IANA thuộc public domain. UTC offset và quy tắc giờ mùa hè được trình duyệt xác định bằng `Intl`.
