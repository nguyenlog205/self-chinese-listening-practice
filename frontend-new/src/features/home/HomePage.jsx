import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home">
      <section className="home-hero">
        <span className="home-eyebrow">听力练习</span>
        <h1>Chào mừng quay lại</h1>
        <p>
          Dán một video YouTube tiếng Trung, để hệ thống tự nhận diện giọng nói
          và chuyển pinyin, rồi luyện nghe từng câu một.
        </p>
      </section>

      <section className="home-add-card">
        <h2>Thêm bài học mới</h2>
        <div className="home-add-row">
          <input type="text" placeholder="Dán link YouTube vào đây..." />
          <button className="btn-accent" type="button">
            + Thêm bài
          </button>
        </div>
      </section>

      <section className="home-library">
        <h2>Thư viện bài học</h2>
        <div className="home-empty">
          <div className="home-empty-mark">卷</div>
          <p>Chưa có bài học nào. Thêm một link ở trên để bắt đầu luyện nghe.</p>
        </div>
      </section>
    </div>
  );
}
