# WholePersonProfile regression

Ba file trong `inputs/` là benchmark input được tạo từ evidence đã qua engine xác nhận cho hồ sơ mẫu Tử Vi, Bản đồ sao và Thần số học. Chúng không phải expected fixture của calculation engine.

Chạy `node scripts/generate-synthesis-regression.cjs` để cập nhật input. Khi endpoint Gemini đã có khóa server-side, đặt `SYNTHESIS_REGRESSION_ENDPOINT` thành URL `/api/huyen-hoc/synthesis` để ghi ba output thật vào `outputs/` phục vụ đánh giá thủ công. Không tạo output giả khi Gemini chưa khả dụng.
