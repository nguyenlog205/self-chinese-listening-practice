# 听力练习 · website

Trang giới thiệu sản phẩm, tĩnh, độc lập hoàn toàn với phần còn lại của repo
(không import/gọi gì từ `backend/`, `frontend/`, hay `electron/`). Không có
bước build, HTML/CSS/JS thuần. Nằm ở `docs/` (không phải `website/`) vì
GitHub Pages có thể serve thẳng thư mục `/docs` trên nhánh `main`.

```
docs/
  index.html   Toàn bộ nội dung trang (1 trang, có anchor tới từng section)
  css/style.css
  js/main.js   Menu mobile + năm hiện tại ở footer
  js/i18n.js   Từ điển 4 ngôn ngữ (vi/en/zh/zh-TW) + bộ chọn ngôn ngữ
  img/         Ảnh đại diện đội ngũ (long.jpg, nhu.jpg)
```

Tài liệu kỹ thuật (architecture, API...) đã chuyển sang `documents/` để
nhường chỗ cho website ở `docs/`.

## Xem thử local

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy 1 static server bất kỳ:

```bash
cd docs
python3 -m http.server 8080
# mở http://localhost:8080
```

## Deploy

Vì không có bước build, có thể bật GitHub Pages trỏ vào thư mục `/docs`
trên nhánh `main`, hoặc deploy lên bất kỳ static host nào khác (Netlify,
Vercel, Cloudflare Pages...) với root directory là `docs/`.

## Cập nhật nội dung

- Màu sắc lấy theo đúng bảng màu của app (`frontend/src/index.css`) nhưng
  copy giá trị vào `css/style.css` thay vì import, để giữ đúng nguyên tắc
  "độc lập". Nếu đổi theme app, nhớ đồng bộ tay lại đây.
- Phần "Tải xuống" hiện trỏ tới thư mục Google Drive chứa file `.rpm`/`.exe`
  đã build. Khi repo có GitHub Releases chính thức, đổi link đó sang link
  release thay vì Drive.
- Đội ngũ ở `#team` chỉ để tên/vai trò thật, không dùng email/social giả
  (khác với `frontend/src/features/about/membersData.js`, nơi đang có dữ
  liệu placeholder). Muốn thêm liên hệ thật thì sửa trực tiếp trong
  `index.html`.
- Thêm chuỗi văn bản mới: gắn `data-i18n="key"` (thay `textContent`) hoặc
  `data-i18n-html="key"` (thay `innerHTML`, dùng khi trong câu có thẻ
  `<code>`/`<a>`...) lên phần tử trong `index.html`, rồi thêm key đó vào
  `translations` trong `js/i18n.js` với đủ 4 ngôn ngữ. `zh-TW` nên convert
  từ `zh` bằng `opencc-js` (`from: "cn", to: "tw"`) rồi soát lại tay, không
  tự dịch tay riêng để tránh lệch nghĩa giữa 2 bản Trung.
