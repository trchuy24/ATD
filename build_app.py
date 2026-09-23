import json

with open("/Users/trchuy24/Projects/ATD/questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

json_data_str = json.dumps(questions, ensure_ascii=False)

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Luyện Thi An Toàn Điện - Bậc 3 (109 Câu)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-body: #f1f5f9;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --primary-light: #eff6ff;
      --primary-border: #bfdbfe;

      --success: #16a34a;
      --success-bg: #f0fdf4;
      --success-border: #86efac;
      --success-text: #15803d;

      --danger: #dc2626;
      --danger-bg: #fef2f2;
      --danger-border: #fca5a5;
      --danger-text: #b91c1c;

      --warning: #d97706;
      --warning-bg: #fffbeb;
      --warning-border: #fde68a;

      --opt-bg: #f8fafc;
      --opt-hover: #f1f5f9;
      --opt-border: #cbd5e1;

      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
      
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      min-height: 100vh;
      background-color: var(--bg-body);
      color: var(--text-main);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      line-height: 1.5;
    }

    .container {
      width: 100%;
      max-width: 820px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 0 auto;
      padding-bottom: 24px;
    }

    /* Header */
    header {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
    }

    .app-title h1 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }

    .app-title p {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
      margin-top: 2px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn-action-text {
      background: var(--opt-bg);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-action-text:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-action-text.active {
      background: #dbeafe;
      border-color: #93c5fd;
      color: #1d4ed8;
    }

    /* Stats Bar */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      text-align: center;
      box-shadow: var(--shadow-sm);
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .stat-total .stat-value { color: #2563eb; }
    .stat-correct .stat-value { color: var(--success-text); }
    .stat-wrong .stat-value { color: var(--danger-text); }
    .stat-percent .stat-value { color: #d97706; }

    /* Mode Navigation Tabs */
    .toolbar-modes {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 6px;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      box-shadow: var(--shadow-sm);
    }

    .toolbar-modes::-webkit-scrollbar {
      display: none;
    }

    .tab-btn {
      flex: 1;
      min-width: fit-content;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.83rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      text-align: center;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      background: #f8fafc;
      color: var(--text-main);
    }

    .tab-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
      box-shadow: var(--shadow-sm);
    }

    /* Sub Toolbar (Shuffle & Reset) */
    .sub-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* Main Quiz Card */
    .quiz-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }

    /* Progress bar */
    .progress-track {
      width: 100%;
      height: 5px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      width: 0%;
      border-radius: 999px;
      transition: width 0.25s ease;
    }

    .q-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .q-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--primary-light);
      color: var(--primary);
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid var(--primary-border);
    }

    .q-orig-id {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .btn-bookmark {
      background: var(--opt-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-bookmark:hover {
      background: #e2e8f0;
      color: var(--text-main);
    }

    .btn-bookmark.active {
      background: #fef3c7;
      border-color: #fde68a;
      color: #b45309;
    }

    .question-text {
      font-size: 1.05rem;
      font-weight: 600;
      line-height: 1.55;
      color: #0f172a;
    }

    /* Options */
    .options-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .opt-card {
      background: var(--card-bg);
      border: 1.5px solid var(--opt-border);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }

    .opt-card:hover:not(.locked) {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .opt-card.locked {
      cursor: default;
    }

    .opt-key {
      width: 26px;
      height: 26px;
      border-radius: var(--radius-sm);
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      font-weight: 700;
      flex-shrink: 0;
      text-transform: uppercase;
    }

    .opt-content {
      font-size: 0.93rem;
      line-height: 1.48;
      color: #1e293b;
      flex-grow: 1;
      padding-top: 2px;
    }

    .opt-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      display: none;
      flex-shrink: 0;
      align-self: center;
    }

    /* Selected Correct State */
    .opt-card.correct {
      background: var(--success-bg) !important;
      border-color: var(--success) !important;
    }

    .opt-card.correct .opt-key {
      background: var(--success);
      border-color: var(--success);
      color: #ffffff;
    }

    .opt-card.correct .opt-content {
      color: var(--success-text);
      font-weight: 600;
    }

    .opt-card.correct .opt-badge {
      display: inline-block;
      background: var(--success);
      color: #ffffff;
    }

    /* Selected Wrong State */
    .opt-card.wrong {
      background: var(--danger-bg) !important;
      border-color: var(--danger) !important;
    }

    .opt-card.wrong .opt-key {
      background: var(--danger);
      border-color: var(--danger);
      color: #ffffff;
    }

    .opt-card.wrong .opt-content {
      color: var(--danger-text);
      font-weight: 600;
    }

    .opt-card.wrong .opt-badge {
      display: inline-block;
      background: var(--danger);
      color: #ffffff;
    }

    /* Highlight correct answer when user was wrong */
    .opt-card.reveal-correct {
      background: var(--success-bg) !important;
      border-color: var(--success) !important;
      border-style: dashed;
    }

    .opt-card.reveal-correct .opt-key {
      background: var(--success);
      border-color: var(--success);
      color: #ffffff;
    }

    .opt-card.reveal-correct .opt-content {
      color: var(--success-text);
      font-weight: 600;
    }

    .opt-card.reveal-correct .opt-badge {
      display: inline-block;
      background: var(--success);
      color: #ffffff;
    }

    /* Feedback Banner */
    .feedback-banner {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      line-height: 1.45;
      display: none;
    }

    .feedback-banner.correct {
      display: block;
      background: var(--success-bg);
      border: 1px solid var(--success-border);
      color: var(--success-text);
    }

    .feedback-banner.wrong {
      display: block;
      background: var(--danger-bg);
      border: 1px solid var(--danger-border);
      color: var(--danger-text);
    }

    /* Navigation */
    .nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }

    .btn-nav {
      flex: 1;
      background: var(--card-bg);
      border: 1.5px solid var(--card-border);
      color: var(--text-main);
      padding: 11px 16px;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }

    .btn-nav:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-nav:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .btn-nav-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
    }

    .btn-nav-primary:hover:not(:disabled) {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
      color: #ffffff;
    }

    /* Question Grid Modal */
    .grid-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.45);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 12px;
    }

    .grid-overlay.open {
      display: flex;
    }

    .grid-modal {
      background: #ffffff;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .grid-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .grid-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .grid-legend {
      padding: 10px 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
      background: #f8fafc;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-box {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      border: 1px solid #cbd5e1;
    }

    .legend-box.correct { background: var(--success); border-color: var(--success); }
    .legend-box.wrong { background: var(--danger); border-color: var(--danger); }
    .legend-box.unanswered { background: #ffffff; }
    .legend-box.current { background: var(--primary); border-color: var(--primary); }

    .grid-body {
      padding: 16px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 6px;
    }

    .grid-btn {
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      border: 1px solid var(--card-border);
      background: #f8fafc;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.1s;
    }

    .grid-btn:hover {
      border-color: var(--primary);
    }

    .grid-btn.current {
      border: 2px solid var(--primary);
      color: var(--primary);
    }

    .grid-btn.correct {
      background: var(--success);
      border-color: var(--success);
      color: #ffffff;
    }

    .grid-btn.wrong {
      background: var(--danger);
      border-color: var(--danger);
      color: #ffffff;
    }

    .grid-btn.starred::after {
      content: "";
      position: absolute;
      top: 2px;
      right: 2px;
      width: 5px;
      height: 5px;
      background: #d97706;
      border-radius: 50%;
    }

    /* Study Sheet (All answers mode) */
    .study-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 70vh;
      overflow-y: auto;
      padding-right: 4px;
    }

    .study-item {
      background: #f8fafc;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .study-q {
      font-weight: 700;
      font-size: 0.92rem;
      color: #0f172a;
    }

    .study-opts {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .study-opt {
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.86rem;
      border: 1px solid transparent;
      color: #334155;
    }

    .study-opt.is-correct {
      background: var(--success-bg);
      border-color: var(--success-border);
      font-weight: 600;
      color: var(--success-text);
    }

    .empty-state {
      text-align: center;
      padding: 36px 16px;
      color: var(--text-muted);
    }

    .empty-state h4 {
      font-size: 1rem;
      margin-bottom: 6px;
      color: var(--text-main);
    }

    .kb-hint {
      font-size: 0.75rem;
      color: var(--text-light);
      text-align: center;
      margin-top: 4px;
    }

    /* Mobile Adaptations */
    @media (max-width: 600px) {
      body {
        padding: 8px;
      }

      .container {
        gap: 8px;
      }

      header {
        padding: 12px 14px;
      }

      .app-title h1 {
        font-size: 0.95rem;
      }

      .stats-bar {
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      }

      .stat-card {
        padding: 8px 4px;
      }

      .stat-value {
        font-size: 1.05rem;
      }

      .stat-label {
        font-size: 0.65rem;
      }

      .quiz-card {
        padding: 14px;
        gap: 14px;
      }

      .question-text {
        font-size: 0.96rem;
        line-height: 1.5;
      }

      .opt-card {
        padding: 10px 12px;
        gap: 10px;
      }

      .opt-content {
        font-size: 0.88rem;
      }

      .btn-nav {
        padding: 10px 12px;
        font-size: 0.84rem;
      }

      .kb-hint {
        display: none;
      }
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Header -->
    <header>
      <div class="app-title">
        <h1>An Toàn Điện - Bậc 3</h1>
        <p>Ngân hàng 109 câu hỏi lý thuyết</p>
      </div>
      <div class="header-actions">
        <button id="btnOpenGrid" class="btn-action-text">Danh sách câu</button>
      </div>
    </header>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card stat-total">
        <div id="statProgress" class="stat-value">0/109</div>
        <div class="stat-label">Đã làm</div>
      </div>
      <div class="stat-card stat-correct">
        <div id="statCorrect" class="stat-value">0</div>
        <div class="stat-label">Đúng</div>
      </div>
      <div class="stat-card stat-wrong">
        <div id="statWrong" class="stat-value">0</div>
        <div class="stat-label">Sai</div>
      </div>
      <div class="stat-card stat-percent">
        <div id="statRate" class="stat-value">0%</div>
        <div class="stat-label">Độ chính xác</div>
      </div>
    </div>

    <!-- Mode Tabs -->
    <div class="toolbar-modes">
      <button class="tab-btn active" data-mode="all">Tất cả (109)</button>
      <button class="tab-btn" data-mode="wrong">Câu sai (<span id="countWrong">0</span>)</button>
      <button class="tab-btn" data-mode="starred">Đã lưu (<span id="countStarred">0</span>)</button>
      <button class="tab-btn" data-mode="quiz20">Đề 20 câu</button>
      <button class="tab-btn" data-mode="study">Tra cứu</button>
    </div>

    <!-- Action sub-toolbar -->
    <div class="sub-toolbar">
      <div style="display: flex; gap: 6px;">
        <button id="btnShuffle" class="btn-action-text active">Xáo trộn: BẬT</button>
        <button id="btnReset" class="btn-action-text">Làm lại từ đầu</button>
      </div>
      <span id="currentStatusNote" style="font-size: 0.78rem; color: var(--text-muted);"></span>
    </div>

    <!-- Quiz View -->
    <main id="quizView" class="quiz-card">
      <div class="progress-track">
        <div id="progressFill" class="progress-fill"></div>
      </div>

      <div class="q-meta">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span id="qBadge" class="q-badge">Câu 1 / 109</span>
          <span id="qOrigBadge" class="q-orig-id">Gốc: #1</span>
        </div>
        <div>
          <button id="btnBookmark" class="btn-bookmark">Lưu câu hỏi</button>
        </div>
      </div>

      <div id="qText" class="question-text">
        Đang tải câu hỏi...
      </div>

      <div id="optionsContainer" class="options-grid">
        <!-- Options rendered dynamically -->
      </div>

      <div id="feedbackBanner" class="feedback-banner">
        <!-- Feedback text -->
      </div>

      <div class="nav-bar">
        <button id="btnPrev" class="btn-nav">Câu trước</button>
        <button id="btnNext" class="btn-nav btn-nav-primary">Câu tiếp theo</button>
      </div>

      <div class="kb-hint">
        Phím tắt: 1, 2, 3, 4 hoặc A, B, C, D để chọn | Phím mũi tên sang trái / phải để chuyển câu
      </div>
    </main>

    <!-- Study Sheet View -->
    <section id="studyView" class="quiz-card" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 8px;">
        <h2 style="font-size: 1rem; font-weight: 700;">Bảng tra cứu đáp án 109 câu</h2>
      </div>
      <div id="studyList" class="study-list">
        <!-- Rendered dynamically -->
      </div>
    </section>
  </div>

  <!-- Question Grid Modal -->
  <div id="gridOverlay" class="grid-overlay">
    <div class="grid-modal">
      <div class="grid-header">
        <h3>Danh Sách Câu Hỏi</h3>
        <button id="btnCloseGrid" class="btn-action-text">Đóng</button>
      </div>
      <div class="grid-legend">
        <div class="legend-item"><span class="legend-box current"></span> Đang xem</div>
        <div class="legend-item"><span class="legend-box correct"></span> Đúng</div>
        <div class="legend-item"><span class="legend-box wrong"></span> Sai</div>
        <div class="legend-item"><span class="legend-box unanswered"></span> Chưa làm</div>
      </div>
      <div id="gridBody" class="grid-body">
        <!-- Grid buttons -->
      </div>
    </div>
  </div>

  <!-- Raw Questions Data -->
  <script>
    const RAW_QUESTIONS = """ + json_data_str + """;
  </script>

  <script>
    // App State
    let currentMode = 'all'; // all | wrong | starred | quiz20 | study
    let isShuffled = true;
    let activeQuestions = [];
    let currentIndex = 0;
    
    // User progress state (keyed by question original ID)
    let userAnswers = {};
    let starredQuestions = new Set();

    // LocalStorage helper
    function loadSavedState() {
      try {
        const savedAns = localStorage.getItem('atd_answers');
        if (savedAns) userAnswers = JSON.parse(savedAns);
        const savedStars = localStorage.getItem('atd_starred');
        if (savedStars) starredQuestions = new Set(JSON.parse(savedStars));
        const savedShuffle = localStorage.getItem('atd_shuffle');
        if (savedShuffle !== null) isShuffled = (savedShuffle === 'true');
      } catch (e) {}
    }

    function saveState() {
      try {
        localStorage.setItem('atd_answers', JSON.stringify(userAnswers));
        localStorage.setItem('atd_starred', JSON.stringify(Array.from(starredQuestions)));
        localStorage.setItem('atd_shuffle', isShuffled);
      } catch (e) {}
    }

    // Fisher-Yates Shuffle
    function shuffleArray(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // Build question list for current mode
    function buildActiveQuestions() {
      let list = [...RAW_QUESTIONS];
      
      if (currentMode === 'wrong') {
        list = list.filter(q => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
      } else if (currentMode === 'starred') {
        list = list.filter(q => starredQuestions.has(q.id));
      } else if (currentMode === 'quiz20') {
        list = shuffleArray(list).slice(0, 20);
      }

      if (isShuffled && currentMode !== 'quiz20' && currentMode !== 'study') {
        list = shuffleArray(list);
      }

      activeQuestions = list;
      currentIndex = 0;
    }

    // Update Statistics
    function updateStats() {
      const totalRaw = RAW_QUESTIONS.length;
      let answeredCount = 0;
      let correctCount = 0;
      let wrongCount = 0;

      for (const q of RAW_QUESTIONS) {
        if (userAnswers[q.id]) {
          answeredCount++;
          if (userAnswers[q.id].isCorrect) correctCount++;
          else wrongCount++;
        }
      }

      document.getElementById('statProgress').textContent = answeredCount + '/' + totalRaw;
      document.getElementById('statCorrect').textContent = correctCount;
      document.getElementById('statWrong').textContent = wrongCount;
      const rate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
      document.getElementById('statRate').textContent = rate + '%';

      document.getElementById('countWrong').textContent = wrongCount;
      document.getElementById('countStarred').textContent = starredQuestions.size;
      
      // Shuffle button UI
      const btnShuffle = document.getElementById('btnShuffle');
      if (isShuffled) {
        btnShuffle.classList.add('active');
        btnShuffle.textContent = 'Xáo trộn: BẬT';
      } else {
        btnShuffle.classList.remove('active');
        btnShuffle.textContent = 'Xáo trộn: TẮT';
      }
    }

    // Render Current Question
    function renderQuestion() {
      if (currentMode === 'study') return;

      const quizView = document.getElementById('quizView');
      const studyView = document.getElementById('studyView');
      quizView.style.display = 'flex';
      studyView.style.display = 'none';

      if (activeQuestions.length === 0) {
        let emptyMsg = 'Hãy chọn mục khác để luyện tập.';
        if (currentMode === 'wrong') emptyMsg = 'Bạn chưa có câu nào làm sai hoặc đã sửa hết.';
        else if (currentMode === 'starred') emptyMsg = 'Bạn chưa lưu câu hỏi nào.';
        
        quizView.innerHTML = `
          <div class="empty-state">
            <h4>Không có câu hỏi trong mục này</h4>
            <p style="margin-top: 6px; font-size: 0.85rem;">${emptyMsg}</p>
            <button class="btn-nav btn-nav-primary" style="margin: 16px auto 0; max-width: 200px;" onclick="switchMode('all')">Về tất cả câu hỏi</button>
          </div>
        `;
        return;
      }

      const q = activeQuestions[currentIndex];
      const answerState = userAnswers[q.id];
      const isAnswered = !!answerState;

      // Progress bar
      const progressPercent = ((currentIndex + 1) / activeQuestions.length) * 100;
      document.getElementById('progressFill').style.width = progressPercent + '%';

      // Badges & text
      document.getElementById('qBadge').textContent = 'Câu ' + (currentIndex + 1) + ' / ' + activeQuestions.length;
      document.getElementById('qOrigBadge').textContent = 'Gốc: #' + q.id;
      document.getElementById('qText').textContent = q.question;

      // Bookmark button
      const bookmarkBtn = document.getElementById('btnBookmark');
      if (starredQuestions.has(q.id)) {
        bookmarkBtn.classList.add('active');
        bookmarkBtn.textContent = 'Đã lưu';
      } else {
        bookmarkBtn.classList.remove('active');
        bookmarkBtn.textContent = 'Lưu câu hỏi';
      }

      // Options
      const optionsContainer = document.getElementById('optionsContainer');
      optionsContainer.innerHTML = '';

      q.options.forEach((opt, idx) => {
        const optCard = document.createElement('div');
        optCard.className = 'opt-card';
        if (isAnswered) optCard.classList.add('locked');

        let badgeText = '';

        if (isAnswered) {
          const isSelected = (answerState.selectedIdx === idx);
          const isCorrectOpt = (q.correctIndex === idx);

          if (isSelected) {
            if (answerState.isCorrect) {
              optCard.classList.add('correct');
              badgeText = 'Đúng';
            } else {
              optCard.classList.add('wrong');
              badgeText = 'Bạn chọn sai';
            }
          } else if (isCorrectOpt && !answerState.isCorrect) {
            optCard.classList.add('reveal-correct');
            badgeText = 'Đáp án đúng';
          }
        }

        optCard.innerHTML = `
          <div class="opt-key">${opt.label}</div>
          <div class="opt-content">${opt.text}</div>
          <div class="opt-badge">${badgeText}</div>
        `;

        if (!isAnswered) {
          optCard.addEventListener('click', () => handleSelectOption(idx));
        }

        optionsContainer.appendChild(optCard);
      });

      // Feedback banner
      const banner = document.getElementById('feedbackBanner');
      if (isAnswered) {
        if (answerState.isCorrect) {
          banner.className = 'feedback-banner correct';
          banner.innerHTML = `<strong>Chính xác!</strong> Bạn đã chọn đúng đáp án (${q.options[q.correctIndex].label.toUpperCase()}).`;
        } else {
          banner.className = 'feedback-banner wrong';
          banner.innerHTML = `<strong>Chưa chính xác!</strong> Đáp án đúng là: <strong>${q.options[q.correctIndex].label.toUpperCase()}. ${q.options[q.correctIndex].text}</strong>`;
        }
      } else {
        banner.className = 'feedback-banner';
        banner.style.display = 'none';
      }

      // Navigation buttons
      document.getElementById('btnPrev').disabled = (currentIndex === 0);
      const nextBtn = document.getElementById('btnNext');
      if (currentIndex === activeQuestions.length - 1) {
        nextBtn.textContent = 'Xem lại danh sách';
      } else {
        nextBtn.textContent = 'Câu tiếp theo';
      }
    }

    // Handle Option Selection
    function handleSelectOption(idx) {
      const q = activeQuestions[currentIndex];
      if (userAnswers[q.id]) return;

      const isCorrect = (idx === q.correctIndex);
      userAnswers[q.id] = {
        selectedIdx: idx,
        isCorrect: isCorrect
      };

      saveState();
      updateStats();
      renderQuestion();
    }

    // Render Study Sheet View
    function renderStudyView() {
      const quizView = document.getElementById('quizView');
      const studyView = document.getElementById('studyView');
      quizView.style.display = 'none';
      studyView.style.display = 'flex';

      const listContainer = document.getElementById('studyList');
      listContainer.innerHTML = '';

      RAW_QUESTIONS.forEach(q => {
        const item = document.createElement('div');
        item.className = 'study-item';

        let optsHtml = '';
        q.options.forEach((opt, idx) => {
          const isCorrect = (idx === q.correctIndex);
          optsHtml += `
            <div class="study-opt ${isCorrect ? 'is-correct' : ''}">
              <strong>${opt.label.toUpperCase()}.</strong> ${opt.text} ${isCorrect ? ' (Đáp án đúng)' : ''}
            </div>
          `;
        });

        item.innerHTML = `
          <div class="study-q">Câu ${q.id}: ${q.question}</div>
          <div class="study-opts">${optsHtml}</div>
        `;
        listContainer.appendChild(item);
      });
    }

    // Switch Practice Mode
    function switchMode(mode) {
      currentMode = mode;
      document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.mode === mode) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      if (mode === 'study') {
        renderStudyView();
      } else {
        buildActiveQuestions();
        renderQuestion();
      }
    }

    // Question Grid Modal
    function openGrid() {
      const gridBody = document.getElementById('gridBody');
      gridBody.innerHTML = '';

      activeQuestions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.className = 'grid-btn';
        btn.textContent = idx + 1;

        if (idx === currentIndex) btn.classList.add('current');
        if (starredQuestions.has(q.id)) btn.classList.add('starred');

        if (userAnswers[q.id]) {
          if (userAnswers[q.id].isCorrect) btn.classList.add('correct');
          else btn.classList.add('wrong');
        }

        btn.addEventListener('click', () => {
          currentIndex = idx;
          renderQuestion();
          closeGrid();
        });

        gridBody.appendChild(btn);
      });

      document.getElementById('gridOverlay').classList.add('open');
    }

    function closeGrid() {
      document.getElementById('gridOverlay').classList.remove('open');
    }

    // Setup Event Listeners
    function setupEvents() {
      // Shuffle toggle
      document.getElementById('btnShuffle').addEventListener('click', () => {
        isShuffled = !isShuffled;
        localStorage.setItem('atd_shuffle', isShuffled);
        buildActiveQuestions();
        renderQuestion();
        updateStats();
      });

      // Bookmark question
      document.getElementById('btnBookmark').addEventListener('click', () => {
        if (activeQuestions.length === 0) return;
        const q = activeQuestions[currentIndex];
        if (starredQuestions.has(q.id)) {
          starredQuestions.delete(q.id);
        } else {
          starredQuestions.add(q.id);
        }
        saveState();
        updateStats();
        renderQuestion();
      });

      // Reset
      document.getElementById('btnReset').addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đặt lại toàn bộ kết quả làm bài không?')) {
          userAnswers = {};
          saveState();
          buildActiveQuestions();
          updateStats();
          renderQuestion();
        }
      });

      // Nav buttons
      document.getElementById('btnPrev').addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          renderQuestion();
        }
      });

      document.getElementById('btnNext').addEventListener('click', () => {
        if (currentIndex < activeQuestions.length - 1) {
          currentIndex++;
          renderQuestion();
        } else {
          openGrid();
        }
      });

      // Tab modes
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
      });

      // Grid modal
      document.getElementById('btnOpenGrid').addEventListener('click', openGrid);
      document.getElementById('btnCloseGrid').addEventListener('click', closeGrid);
      document.getElementById('gridOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'gridOverlay') closeGrid();
      });

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (document.getElementById('gridOverlay').classList.contains('open')) {
          if (e.key === 'Escape') closeGrid();
          return;
        }

        if (currentMode === 'study' || activeQuestions.length === 0) return;

        const key = e.key.toLowerCase();
        const currentQ = activeQuestions[currentIndex];

        if (!userAnswers[currentQ.id]) {
          let optIdx = -1;
          if (key === '1' || key === 'a') optIdx = 0;
          else if (key === '2' || key === 'b') optIdx = 1;
          else if (key === '3' || key === 'c') optIdx = 2;
          else if (key === '4' || key === 'd') optIdx = 3;

          if (optIdx >= 0 && optIdx < currentQ.options.length) {
            handleSelectOption(optIdx);
            return;
          }
        }

        if (e.key === 'ArrowLeft') {
          if (currentIndex > 0) {
            currentIndex--;
            renderQuestion();
          }
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
          if (currentIndex < activeQuestions.length - 1) {
            currentIndex++;
            renderQuestion();
          }
        }
      });
    }

    // Initialize App
    function init() {
      loadSavedState();
      buildActiveQuestions();
      updateStats();
      renderQuestion();
      setupEvents();
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
"""

with open("/Users/trchuy24/Projects/ATD/index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Updated /Users/trchuy24/Projects/ATD/index.html with light theme, no icons, and mobile optimization!")
