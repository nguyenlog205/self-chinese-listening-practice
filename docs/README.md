# 听力练习 — website

Trang giới thiệu sản phẩm, tĩnh, độc lập hoàn toàn với phần còn lại của repo
(không import/gọi gì từ `backend/`, `frontend/`, hay `electron/`). Không có
bước build — HTML/CSS/JS thuần.

```
website/
  index.html   Toàn bộ nội dung trang (1 trang, có anchor tới từng section)
  css/style.css
  js/main.js   Chỉ xử lý: menu mobile + năm hiện tại ở footer
```

## Xem thử local

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy 1 static server bất kỳ:

```bash
cd website
python3 -m http.server 8080
# mở http://localhost:8080
```

## Deploy

Vì không có bước build, có thể deploy thẳng thư mục này lên bất kỳ static
host nào (GitHub Pages, Netlify, Vercel, Cloudflare Pages...) — trỏ root
directory vào `website/`.

## Cập nhật nội dung

- Màu sắc lấy theo đúng bảng màu của app (`frontend/src/index.css`) nhưng
  copy giá trị vào `css/style.css` thay vì import, để giữ đúng nguyên tắc
  "độc lập" — nếu đổi theme app, nhớ đồng bộ tay lại đây.
- Phần "Tải xuống" hiện chỉ hướng dẫn cài đặt bằng lệnh (`.rpm`/`.exe` build
  từ `npm run build:rpm` / `build:win` ở root repo) — chưa có link tải trực
  tiếp vì repo chưa publish GitHub Releases. Khi có, thay 2 khối lệnh trong
  `#download` bằng nút tải trực tiếp.
- Đội ngũ ở `#team` chỉ để tên/vai trò thật, không dùng email/social giả
  (khác với `frontend/src/features/about/membersData.js`, nơi đó đang có dữ
  liệu placeholder) — nếu muốn thêm liên hệ thật thì sửa trực tiếp trong
  `index.html`.
