import os
import re
import json
import glob
import unicodedata

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def strip_accents(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("đ", "d").replace("Đ", "D")
    return s

def make_slug(file_path):
    name = os.path.splitext(os.path.basename(file_path))[0]
    clean = strip_accents(name).lower()
    slug = re.sub(r"[^a-z0-9]+", "_", clean).strip("_")
    if "an_toan_dien" in slug:
        return "atd"
    if "cns_mon_1" in slug or "cns_1" in slug:
        return "cns1"
    return slug or "mon_hoc"

def pick_icon(title):
    t = strip_accents(title).lower()
    if 'dien' in t:
        return '⚡'
    if 'cns' in t or 'bay' in t or 'hang khong' in t:
        return '✈️'
    if 'an toan' in t:
        return '🛡️'
    if 'luat' in t or 'quy dinh' in t:
        return '⚖️'
    if 'may tinh' in t or 'cntt' in t or 'it' in t:
        return '💻'
    if 'anh' in t or 'ngoai ngu' in t:
        return '🌐'
    return '📚'

def parse_markdown_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    if title_match:
        raw_title = title_match.group(1).strip()
        title = re.sub(r"\s*\(?\d+\s*câu\)?", "", raw_title, flags=re.IGNORECASE).strip()
        title = re.sub(r"^bộ câu hỏi thi hết môn\s*(\d+)", r"CNS - Môn \1", title, flags=re.IGNORECASE).strip()
    else:
        title = os.path.splitext(os.path.basename(file_path))[0]

    questions = []
    label_map = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}

    if "Đáp án:" in text or "### Câu" in text:
        parts = re.split(r"(?:###\s*)?Câu\s+(\d+)[\:\.]?", text)
        for i in range(1, len(parts), 2):
            q_num = int(parts[i])
            q_body = parts[i+1].strip()
            
            ans_match = re.search(r"Đáp án:.*?\b([A-Za-z])\b", q_body)
            correct_letter = ans_match.group(1).upper() if ans_match else None
            
            content_before_ans = re.split(r"\*\*Đáp án:|Đáp án:", q_body)[0].strip()
            lines = [l.strip() for l in content_before_ans.split("\n") if l.strip()]
            
            q_text_lines = []
            options = []
            for line in lines:
                m = re.match(r"^(?:-\s*)?([A-Za-z])[\.\:\)]\s*(.*)", line)
                if m and m.group(1).upper() in label_map:
                    options.append({
                        "label": m.group(1).lower(),
                        "text": m.group(2).strip()
                    })
                else:
                    if not options:
                        q_text_lines.append(line)
                    else:
                        options[-1]["text"] += " " + line
            
            q_text = " ".join(q_text_lines).strip()
            c_idx = label_map.get(correct_letter, -1)
            if q_text and options:
                questions.append({
                    "id": q_num,
                    "question": q_text,
                    "options": options,
                    "correctIndex": c_idx
                })

    elif re.search(r"\*\*Câu\s+\d+", text):
        parts = re.split(r"\*\*Câu\s+(\d+)[\:\.]?\*\*", text)
        for i in range(1, len(parts), 2):
            q_num = int(parts[i])
            q_body = parts[i+1].strip()
            lines = [l.strip() for l in q_body.split("\n") if l.strip()]
            
            q_text_lines = []
            options = []
            c_idx = -1
            
            for line in lines:
                m = re.match(r"^(\*\*)?([a-zA-Z])[\.\:\)](.*)", line)
                if m:
                    lbl = m.group(2).lower()
                    rest = m.group(3).strip()
                    is_bold = bool(m.group(1)) or rest.startswith("**") or rest.endswith("**")
                    clean_rest = rest.replace("**", "").strip()
                    
                    if is_bold:
                        c_idx = len(options)
                        
                    options.append({
                        "label": lbl,
                        "text": clean_rest
                    })
                else:
                    if not options:
                        q_text_lines.append(line.replace("**", "").strip())
                    else:
                        options[-1]["text"] += " " + line.replace("**", "").strip()
            
            q_text = " ".join(q_text_lines).strip()
            if q_text and options:
                questions.append({
                    "id": q_num,
                    "question": q_text,
                    "options": options,
                    "correctIndex": c_idx
                })

    return title, questions

def build_all():
    md_patterns = [
        os.path.join(BASE_DIR, "*.md"),
        os.path.join(BASE_DIR, "data", "*.md")
    ]
    md_files = []
    for pat in md_patterns:
        for f in glob.glob(pat):
            fname = os.path.basename(f)
            if fname.lower() in ["readme.md", "summary.md"]:
                continue
            if f not in md_files:
                md_files.append(f)

    md_files.sort()
    subjects_data = {}

    for md_path in md_files:
        title, questions = parse_markdown_file(md_path)
        if not questions:
            print(f"Bỏ qua {md_path} (không tìm thấy câu hỏi)")
            continue

        slug = make_slug(md_path)
        icon = pick_icon(title)

        if slug == 'atd':
            title = "An Toàn Điện - Bậc 3"
        elif slug == 'cns1':
            title = "CNS - Môn 1"

        subtitle = f"Ngân hàng {len(questions)} câu hỏi"

        subjects_data[slug] = {
            "id": slug,
            "title": title,
            "subtitle": subtitle,
            "icon": icon,
            "questions": questions
        }

        json_filename = "questions.json" if slug == "atd" else f"questions_{slug}.json"
        json_out = os.path.join(BASE_DIR, json_filename)
        with open(json_out, "w", encoding="utf-8") as jf:
            json.dump(questions, jf, ensure_ascii=False, indent=2)
        print(f"-> {title} ({len(questions)} câu) => {json_filename}")

    subjects_json_str = json.dumps(subjects_data, ensure_ascii=False)

    html_template = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Ôn Thi Trắc Nghiệm</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-body: #f8fafc;
      --card-bg: #ffffff;
      --border-color: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --primary-light: #eff6ff;

      --success-bg: #f0fdf4;
      --success-border: #86efac;
      --success-text: #15803d;

      --danger-bg: #fef2f2;
      --danger-border: #fca5a5;
      --danger-text: #b91c1c;

      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05);
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
      line-height: 1.5;
      padding: 16px 12px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .app-container {
      width: 100%;
      max-width: 760px;
    }

    /* SCREEN 1: MENU CHỌN MÔN HỌC */
    #menuScreen {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding-top: 16px;
    }

    .menu-header {
      text-align: center;
      margin-bottom: 6px;
    }

    .menu-header h1 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.02em;
    }

    .menu-header p {
      font-size: 0.92rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .subject-cards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .subject-card {
      background: var(--card-bg);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      position: relative;
    }

    .subject-card:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .subject-card:active {
      transform: scale(0.99);
    }

    .subject-info {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .subject-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .subject-text h2 {
      font-size: 1.12rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .subject-text p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .subject-arrow {
      color: var(--text-light);
      font-size: 1.25rem;
      font-weight: 700;
      padding-left: 8px;
    }

    .import-card-box {
      margin-top: 8px;
      border: 1.5px dashed var(--border-color);
      border-radius: var(--radius-lg);
      padding: 14px;
      text-align: center;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .import-card-box:hover {
      border-color: var(--primary);
      background: var(--primary-light);
    }

    .import-btn-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
    }

    /* SCREEN 2: DANH SÁCH CÂU HỎI CUỘN */
    #questionsScreen {
      display: none;
      flex-direction: column;
      gap: 14px;
    }

    /* Top Sticky Action Bar */
    .top-bar {
      position: sticky;
      top: 8px;
      z-index: 50;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-action {
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 6px 11px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-action:hover {
      background: #e2e8f0;
    }

    .btn-action.btn-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
    }

    .btn-action.btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-action.btn-danger-light {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    .btn-action.btn-danger-light:hover {
      background: #fee2e2;
    }

    .btn-action.btn-result {
      background: #16a34a;
      border-color: #16a34a;
      color: #ffffff;
      font-weight: 700;
    }

    .btn-action.btn-result:hover {
      background: #15803d;
    }

    .current-subject-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .search-input-mini {
      width: 130px;
      border: 1px solid var(--border-color);
      background: #f8fafc;
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      font-size: 0.82rem;
      outline: none;
    }

    .search-input-mini:focus {
      border-color: var(--primary);
      background: #ffffff;
    }

    /* Exam mode banner */
    .exam-banner {
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      border-radius: var(--radius-md);
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
    }

    .exam-banner strong {
      color: var(--primary);
    }

    .exam-progress-badge {
      background: var(--primary);
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }

    /* Questions Scroll List */
    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .question-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 18px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .q-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .q-number-badge {
      display: inline-flex;
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
      font-size: 0.82rem;
      padding: 3px 9px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .q-orig-tag {
      font-size: 0.78rem;
      color: #475569;
      font-weight: 600;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 7px;
      border-radius: 6px;
      line-height: 1.2;
      display: inline-flex;
      align-items: center;
    }

    .btn-reset-single-q {
      background: transparent;
      border: none;
      color: var(--text-light);
      font-size: 0.78rem;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      display: none;
    }

    .btn-reset-single-q:hover {
      color: var(--text-main);
      background: #f1f5f9;
    }

    .q-title {
      font-size: 1.02rem;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.5;
    }

    .q-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .option-item {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 0.92rem;
      color: var(--text-main);
      line-height: 1.45;
    }

    .option-item:hover:not(.locked) {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .opt-label {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.78rem;
      text-transform: uppercase;
      color: var(--text-main);
      margin-top: 1px;
    }

    .opt-text {
      flex: 1;
    }

    /* Option States */
    .option-item.correct {
      background: var(--success-bg) !important;
      border-color: var(--success-border) !important;
      color: var(--success-text) !important;
    }

    .option-item.correct .opt-label {
      background: #16a34a;
      color: #ffffff;
      border-color: #16a34a;
    }

    .option-item.wrong {
      background: var(--danger-bg) !important;
      border-color: var(--danger-border) !important;
      color: var(--danger-text) !important;
    }

    .option-item.wrong .opt-label {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }

    .option-item.reveal-correct {
      background: var(--success-bg) !important;
      border-color: var(--success-border) !important;
      color: var(--success-text) !important;
    }

    .option-item.reveal-correct .opt-label {
      background: #16a34a;
      color: #ffffff;
      border-color: #16a34a;
    }

    .option-item.locked {
      cursor: default;
    }

    .empty-search {
      text-align: center;
      padding: 30px;
      color: var(--text-muted);
      font-size: 0.9rem;
      background: var(--card-bg);
      border-radius: var(--radius-md);
      border: 1px dashed var(--border-color);
    }

    /* Bottom Actions */
    .exam-bottom-actions {
      display: none;
      justify-content: center;
      padding: 20px 0;
    }

    .btn-finish-exam-large {
      background: #16a34a;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 700;
      padding: 13px 30px;
      cursor: pointer;
      box-shadow: var(--shadow-md);
      transition: all 0.2s ease;
    }

    .btn-finish-exam-large:hover {
      background: #15803d;
      transform: translateY(-1px);
    }

    /* MODALS */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }

    .modal-overlay.open {
      display: flex;
    }

    .modal-card {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      animation: modalScale 0.2s ease;
    }

    @keyframes modalScale {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #1e293b;
    }

    .modal-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    .exam-input-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .exam-input-number {
      width: 100%;
      padding: 12px 14px;
      font-size: 1.1rem;
      font-weight: 700;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-sm);
      outline: none;
      text-align: center;
    }

    .exam-input-number:focus {
      border-color: var(--primary);
    }

    .presets-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .btn-preset {
      flex: 1;
      min-width: 60px;
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      padding: 6px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }

    .btn-preset:hover {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }

    .modal-btn {
      flex: 1;
      padding: 11px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .modal-btn-cancel {
      background: #f1f5f9;
      color: var(--text-main);
      border: 1px solid var(--border-color);
    }

    .modal-btn-cancel:hover {
      background: #e2e8f0;
    }

    .modal-btn-primary {
      background: var(--primary);
      color: #ffffff;
    }

    .modal-btn-primary:hover {
      background: var(--primary-hover);
    }

    /* Result Modal */
    .result-icon {
      font-size: 3.2rem;
      text-align: center;
      line-height: 1;
    }

    .result-badge {
      display: inline-block;
      align-self: center;
      font-size: 1.15rem;
      font-weight: 800;
      padding: 6px 18px;
      border-radius: 999px;
      letter-spacing: 0.02em;
    }

    .result-badge.passed {
      background: #dcfce7;
      color: #15803d;
      border: 1.5px solid #86efac;
    }

    .result-badge.failed {
      background: #fee2e2;
      color: #b91c1c;
      border: 1.5px solid #fca5a5;
    }

    .result-stats-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      justify-content: space-around;
      text-align: center;
    }

    .result-stat-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e293b;
    }

    .result-stat-lbl {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 2px;
    }

    .result-criteria {
      font-size: 0.8rem;
      text-align: center;
      color: var(--text-muted);
    }

    @media (max-width: 600px) {
      body {
        padding: 10px 8px 30px;
      }

      .top-bar {
        padding: 8px 10px;
      }

      .top-bar-left {
        width: 100%;
        justify-content: space-between;
      }

      .top-bar-right {
        width: 100%;
        justify-content: flex-start;
        margin-top: 4px;
        gap: 6px;
      }

      .search-input-mini {
        width: 100%;
        margin-top: 2px;
      }

      .current-subject-title {
        font-size: 0.88rem;
      }

      .question-card {
        padding: 14px;
      }

      .q-title {
        font-size: 0.95rem;
      }

      .option-item {
        padding: 9px 12px;
        font-size: 0.88rem;
      }
    }
  </style>
</head>
<body>

  <div class="app-container">
    <!-- SCREEN 1: MENU CHỌN MÔN HỌC -->
    <div id="menuScreen">
      <div class="menu-header">
        <h1>Chọn Môn Ôn Tập</h1>
        <p>Chọn môn học bên dưới để bắt đầu làm câu hỏi</p>
      </div>

      <div id="subjectCardsList" class="subject-cards-list">
        <!-- Rendered dynamically -->
      </div>

      <!-- Import custom file on browser -->
      <div class="import-card-box" onclick="document.getElementById('fileUploadInput').click()">
        <input type="file" id="fileUploadInput" accept=".md,.markdown,.json,.txt" style="display: none;">
        <div class="import-btn-label">
          <span>➕</span> Thêm môn mới từ file (.md hoặc .json)
        </div>
      </div>
    </div>

    <!-- SCREEN 2: DANH SÁCH CÂU HỎI CUỘN -->
    <div id="questionsScreen">
      <!-- Top Sticky Action Bar -->
      <div class="top-bar">
        <div class="top-bar-left">
          <button id="btnBackToMenu" class="btn-action" onclick="handleBackAction()">
            <span>←</span> <span id="backBtnText">Đổi môn</span>
          </button>
          <div id="currentSubjectName" class="current-subject-title">Môn học</div>
        </div>

        <div class="top-bar-right">
          <!-- Button Xóa hết câu trả lời (luôn có sẵn) -->
          <button id="btnClearAnswers" class="btn-action btn-danger-light" onclick="clearAllAnswers()" title="Xóa hết câu trả lời để làm lại">
            <span>🗑️</span> Xóa đáp án
          </button>

          <!-- Normal mode actions -->
          <button id="btnShuffle" class="btn-action" onclick="shuffleCurrentQuestions()" title="Xáo trộn câu hỏi">
            <span>🔀</span> Xáo trộn
          </button>
          <button id="btnStartExam" class="btn-action btn-primary" onclick="openExamSetupModal()" title="Thi thử">
            <span>📝</span> Thi thử
          </button>

          <!-- Exam mode actions -->
          <button id="btnTopResultExam" class="btn-action btn-result" onclick="showExamResultModal()" style="display: none;" title="Xem kết quả thi">
            <span>📊</span> Kết quả
          </button>

          <input 
            type="text" 
            id="searchBox" 
            class="search-input-mini" 
            placeholder="Tìm câu / từ..." 
            autocomplete="off"
          >
        </div>
      </div>

      <!-- Exam Mode Status Banner -->
      <div id="examBanner" class="exam-banner" style="display: none;">
        <div>
          Chế độ thi thử: <strong id="examTotalText">30 câu</strong>
        </div>
        <div id="examProgressBadge" class="exam-progress-badge">
          Đã làm: 0/30 (Đúng: 0)
        </div>
      </div>

      <!-- Questions List -->
      <div id="questionsList" class="questions-list">
        <!-- Rendered dynamically -->
      </div>

      <!-- Exam Bottom Finish Button -->
      <div id="examBottomActions" class="exam-bottom-actions">
        <button class="btn-finish-exam-large" onclick="showExamResultModal()">
          Xem Kết Quả Thi Thử
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 1: CẤU HÌNH THI THỬ -->
  <div id="examSetupModal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-title">Cấu hình Đề Thi Thử</div>
      <div class="modal-desc" id="examSetupDesc">
        Nhập số lượng câu hỏi bạn muốn thi thử. Hệ thống sẽ chọn ngẫu nhiên các câu hỏi từ ngân hàng đề.
      </div>

      <div class="exam-input-group">
        <label for="examCountInput" style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
          Số câu hỏi của đề:
        </label>
        <input type="number" id="examCountInput" class="exam-input-number" min="1" value="30">
        <div id="presetsRow" class="presets-row">
          <!-- Preset buttons rendered dynamically -->
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel" onclick="closeExamSetupModal()">Hủy</button>
        <button class="modal-btn modal-btn-primary" onclick="startExam()">Bắt đầu thi</button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: KẾT QUẢ THI THỬ -->
  <div id="examResultModal" class="modal-overlay">
    <div class="modal-card" style="text-align: center;">
      <div id="resultIcon" class="result-icon">🎉</div>
      <div id="resultBadge" class="result-badge passed">ĐẠT YÊU CẦU</div>

      <div id="resultMessage" class="modal-desc" style="font-size: 0.95rem;">
        Chúc mừng! Bạn đã hoàn thành bài thi thử.
      </div>

      <div class="result-stats-box">
        <div>
          <div id="resCorrectCount" class="result-stat-val">26 / 30</div>
          <div class="result-stat-lbl">Số câu đúng</div>
        </div>
        <div>
          <div id="resScorePercent" class="result-stat-val" style="color: var(--primary);">86.7%</div>
          <div class="result-stat-lbl">Tỉ lệ chính xác</div>
        </div>
      </div>

      <div class="result-criteria">
        Tiêu chuẩn: Đạt từ <strong>80.0%</strong> trở lên
      </div>

      <div class="modal-actions" style="flex-direction: column; gap: 8px;">
        <button class="modal-btn modal-btn-primary" onclick="closeExamResultModal()">
          Tiếp tục xem bài thi
        </button>
        <button class="modal-btn modal-btn-cancel" onclick="openExamSetupModal(); closeExamResultModal();">
          Thi đề khác
        </button>
        <button class="modal-btn modal-btn-cancel" onclick="exitExamMode()">
          Quay lại ôn tập
        </button>
      </div>
    </div>
  </div>

  <script>
    const BUILTIN_SUBJECTS = """ + subjects_json_str + """;
    let ALL_SUBJECTS = { ...BUILTIN_SUBJECTS };

    // App state
    let currentSubjectKey = null;
    let currentQuestions = [];
    let userAnswers = {};
    let filterQuery = '';

    // Exam state
    let isExamMode = false;
    let isShuffled = false;
    let examQuestions = [];

    function removeTones(str) {
      if (!str) return '';
      str = str.toLowerCase();
      str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
      str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
      str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
      str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
      str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
      str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
      str = str.replace(/đ/g, "d");
      return str.trim();
    }

    function shuffleArray(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function loadCustomSubjects() {
      try {
        const saved = localStorage.getItem('custom_subjects');
        if (saved) {
          const parsed = JSON.parse(saved);
          ALL_SUBJECTS = { ...BUILTIN_SUBJECTS, ...parsed };
        }
      } catch (e) {}
    }

    function saveCustomSubjects(customMap) {
      try {
        localStorage.setItem('custom_subjects', JSON.stringify(customMap));
      } catch (e) {}
    }

    function renderMenuScreen() {
      const container = document.getElementById('subjectCardsList');
      container.innerHTML = '';

      Object.values(ALL_SUBJECTS).forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.onclick = () => selectSubject(sub.id);

        card.innerHTML = `
          <div class="subject-info">
            <div class="subject-icon">${sub.icon || '📚'}</div>
            <div class="subject-text">
              <h2>${sub.title}</h2>
              <p>${sub.subtitle || (sub.questions.length + ' câu hỏi')}</p>
            </div>
          </div>
          <div class="subject-arrow">→</div>
        `;
        container.appendChild(card);
      });
    }

    function loadAnswers(subKey) {
      try {
        const saved = localStorage.getItem('answers_' + subKey);
        userAnswers = saved ? JSON.parse(saved) : {};
      } catch (e) {
        userAnswers = {};
      }
    }

    function saveAnswers(subKey) {
      try {
        localStorage.setItem('answers_' + subKey, JSON.stringify(userAnswers));
      } catch (e) {}
    }

    function selectSubject(subKey) {
      if (!ALL_SUBJECTS[subKey]) return;
      currentSubjectKey = subKey;
      isExamMode = false;
      isShuffled = false;
      filterQuery = '';
      document.getElementById('searchBox').value = '';

      currentQuestions = [...ALL_SUBJECTS[subKey].questions];
      loadAnswers(subKey);

      document.getElementById('menuScreen').style.display = 'none';
      document.getElementById('questionsScreen').style.display = 'flex';
      document.getElementById('currentSubjectName').textContent = ALL_SUBJECTS[subKey].title;
      document.title = ALL_SUBJECTS[subKey].title;

      updateToolbarUI();

      const url = new URL(window.location);
      url.searchParams.set('subject', subKey);
      window.history.replaceState({}, '', url);

      window.scrollTo(0, 0);
      renderQuestionsList();
    }

    function goToMenu() {
      currentSubjectKey = null;
      isExamMode = false;

      document.getElementById('questionsScreen').style.display = 'none';
      document.getElementById('menuScreen').style.display = 'flex';
      document.title = 'Ôn Thi Trắc Nghiệm';

      const url = new URL(window.location);
      url.searchParams.delete('subject');
      url.searchParams.delete('mon');
      window.history.replaceState({}, '', url.pathname);

      window.scrollTo(0, 0);
      renderMenuScreen();
    }

    function handleBackAction() {
      if (isExamMode) {
        if (confirm('Bạn đang trong bài thi thử. Bạn có chắc muốn thoát về chế độ ôn tập không?')) {
          exitExamMode();
        }
      } else {
        goToMenu();
      }
    }

    function updateToolbarUI() {
      const btnShuffle = document.getElementById('btnShuffle');
      const btnStartExam = document.getElementById('btnStartExam');
      const btnTopResult = document.getElementById('btnTopResultExam');
      const searchBox = document.getElementById('searchBox');
      const backBtnText = document.getElementById('backBtnText');
      const examBanner = document.getElementById('examBanner');
      const examBottomActions = document.getElementById('examBottomActions');

      if (isExamMode) {
        backBtnText.textContent = 'Thoát thi';
        btnShuffle.style.display = 'none';
        btnStartExam.style.display = 'none';
        btnTopResult.style.display = 'inline-flex';
        searchBox.style.display = 'none';
        examBanner.style.display = 'flex';
        examBottomActions.style.display = 'flex';
        updateExamProgressBadge();
      } else {
        backBtnText.textContent = 'Đổi môn';
        btnShuffle.style.display = 'inline-flex';
        btnStartExam.style.display = 'inline-flex';
        btnTopResult.style.display = 'none';
        searchBox.style.display = 'inline-block';
        examBanner.style.display = 'none';
        examBottomActions.style.display = 'none';
      }
    }

    // Xóa hết toàn bộ câu trả lời
    function clearAllAnswers() {
      const subTitle = ALL_SUBJECTS[currentSubjectKey].title;
      const confirmMsg = isExamMode
        ? 'Bạn có chắc muốn xóa tất cả câu trả lời của đề thi thử này để làm lại từ đầu không?'
        : `Bạn có chắc muốn xóa tất cả câu trả lời của môn "${subTitle}" để làm lại không?`;

      if (confirm(confirmMsg)) {
        userAnswers = {};
        if (!isExamMode) {
          saveAnswers(currentSubjectKey);
        }
        renderQuestionsList();
        if (isExamMode) {
          updateExamProgressBadge();
        }
      }
    }

    // Shuffle questions in study mode
    function shuffleCurrentQuestions() {
      isShuffled = true;
      currentQuestions = shuffleArray(currentQuestions);
      renderQuestionsList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // =========================================
    // EXAM MODE LOGIC (THI THỬ)
    // =========================================
    function openExamSetupModal() {
      if (!currentSubjectKey) return;
      const sub = ALL_SUBJECTS[currentSubjectKey];
      const totalQ = sub.questions.length;

      document.getElementById('examSetupDesc').textContent = 
        `Môn "${sub.title}" có tất cả ${totalQ} câu hỏi. Hãy nhập số lượng câu cho đề thi thử:`;

      const input = document.getElementById('examCountInput');
      input.max = totalQ;
      const defaultVal = totalQ >= 40 ? 40 : (totalQ >= 30 ? 30 : totalQ);
      input.value = defaultVal;

      const presetsRow = document.getElementById('presetsRow');
      presetsRow.innerHTML = '';

      const presetOptions = [];
      if (totalQ >= 20) presetOptions.push(20);
      if (totalQ >= 30) presetOptions.push(30);
      if (totalQ >= 40) presetOptions.push(40);
      if (!presetOptions.includes(totalQ)) presetOptions.push(totalQ);

      presetOptions.forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'btn-preset';
        btn.textContent = num === totalQ ? `Tất cả (${num})` : `${num} câu`;
        btn.onclick = () => { input.value = num; };
        presetsRow.appendChild(btn);
      });

      document.getElementById('examSetupModal').classList.add('open');
      input.focus();
    }

    function closeExamSetupModal() {
      document.getElementById('examSetupModal').classList.remove('open');
    }

    function startExam() {
      const sub = ALL_SUBJECTS[currentSubjectKey];
      const totalQ = sub.questions.length;
      let count = parseInt(document.getElementById('examCountInput').value, 10);

      if (isNaN(count) || count < 1) count = 1;
      if (count > totalQ) count = totalQ;

      closeExamSetupModal();

      isExamMode = true;
      isShuffled = true;
      userAnswers = {}; // Reset answers for exam session

      // Pick randomly count questions
      examQuestions = shuffleArray(sub.questions).slice(0, count);
      currentQuestions = examQuestions;

      document.getElementById('examTotalText').textContent = `${count} câu hỏi`;
      updateToolbarUI();
      renderQuestionsList();
      window.scrollTo(0, 0);
    }

    function exitExamMode() {
      isExamMode = false;
      isShuffled = false;
      closeExamResultModal();
      selectSubject(currentSubjectKey);
    }

    function updateExamProgressBadge() {
      if (!isExamMode) return;
      const total = currentQuestions.length;
      let answered = 0;
      let correct = 0;

      currentQuestions.forEach(q => {
        if (userAnswers[q.id] !== undefined) {
          answered++;
          if (userAnswers[q.id] === q.correctIndex) {
            correct++;
          }
        }
      });

      document.getElementById('examProgressBadge').textContent = `Đã làm: ${answered}/${total} (Đúng: ${correct})`;
    }

    function showExamResultModal() {
      if (!isExamMode) return;

      const total = currentQuestions.length;
      let answered = 0;
      let correct = 0;

      currentQuestions.forEach(q => {
        if (userAnswers[q.id] !== undefined) {
          answered++;
          if (userAnswers[q.id] === q.correctIndex) {
            correct++;
          }
        }
      });

      const scorePercent = Math.round((correct / total) * 1000) / 10;
      const isPassed = scorePercent >= 80.0;

      const iconEl = document.getElementById('resultIcon');
      const badgeEl = document.getElementById('resultBadge');
      const msgEl = document.getElementById('resultMessage');

      iconEl.textContent = isPassed ? '🎉' : '⚠️';
      if (isPassed) {
        badgeEl.className = 'result-badge passed';
        badgeEl.textContent = 'ĐẠT YÊU CẦU';
        msgEl.textContent = `Chúc mừng bạn! Bạn đã đạt ${scorePercent}% điểm và vượt qua bài thi xuất sắc.`;
      } else {
        badgeEl.className = 'result-badge failed';
        badgeEl.textContent = 'CHƯA ĐẠT';
        msgEl.textContent = `Rất tiếc! Bạn đạt ${scorePercent}% điểm (cần đạt tối thiểu 80.0% để vượt qua bài thi).`;
      }

      document.getElementById('resCorrectCount').textContent = `${correct} / ${total}`;
      document.getElementById('resScorePercent').textContent = `${scorePercent}%`;
      document.getElementById('resScorePercent').style.color = isPassed ? '#15803d' : '#b91c1c';

      document.getElementById('examResultModal').classList.add('open');
    }

    function closeExamResultModal() {
      document.getElementById('examResultModal').classList.remove('open');
    }

    function checkExamAutoFinish() {
      if (!isExamMode) return;
      const total = currentQuestions.length;
      let answered = 0;
      currentQuestions.forEach(q => {
        if (userAnswers[q.id] !== undefined) answered++;
      });

      // Nếu đã trả lời hết toàn bộ các câu trong đề thi, tự động hiện bảng kết quả
      if (answered === total) {
        setTimeout(() => {
          showExamResultModal();
        }, 400);
      }
    }

    // =========================================
    // RENDER QUESTIONS LIST
    // =========================================
    function renderQuestionsList() {
      const container = document.getElementById('questionsList');
      container.innerHTML = '';

      let questions = currentQuestions;

      if (!isExamMode && filterQuery.trim()) {
        const cleanQ = removeTones(filterQuery);
        questions = questions.filter(q => {
          if (q.id.toString() === cleanQ || cleanQ === 'cau ' + q.id || cleanQ === 'c' + q.id || cleanQ === '#' + q.id) {
            return true;
          }
          if (removeTones(q.question).includes(cleanQ)) return true;
          for (const opt of q.options) {
            if (removeTones(opt.text).includes(cleanQ)) return true;
          }
          return false;
        });
      }

      if (questions.length === 0) {
        container.innerHTML = `
          <div class="empty-search">
            Không tìm thấy câu hỏi nào phù hợp với "${filterQuery}".
          </div>
        `;
        return;
      }

      questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = 'q_' + q.id;

        const answeredIdx = userAnswers[q.id];
        const isAnswered = (answeredIdx !== undefined && answeredIdx !== null);

        // Header
        const cardHeader = document.createElement('div');
        cardHeader.className = 'q-card-header';

        const qNumberText = `Câu ${index + 1}`;
        const isShuffledOrExam = isExamMode || isShuffled || (q.id !== index + 1);
        const origTag = isShuffledOrExam ? `<span class="q-orig-tag" title="Câu gốc #${q.id}">#${q.id}</span>` : '';

        cardHeader.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="q-number-badge">${qNumberText}</span>
            ${origTag}
          </div>
          <button class="btn-reset-single-q" id="reset_btn_${q.id}" onclick="resetQuestion(${q.id})">Làm lại</button>
        `;

        if (isAnswered) {
          cardHeader.querySelector('.btn-reset-single-q').style.display = 'inline-block';
        }

        card.appendChild(cardHeader);

        // Question title
        const qTitle = document.createElement('div');
        qTitle.className = 'q-title';
        qTitle.textContent = q.question;
        card.appendChild(qTitle);

        // Options
        const optsContainer = document.createElement('div');
        optsContainer.className = 'q-options';

        q.options.forEach((opt, idx) => {
          const optDiv = document.createElement('div');
          optDiv.className = 'option-item';

          // Ở cả thi thử và ôn tập: khi đã chọn thì lập tức hiện kết quả đúng/sai
          if (isAnswered) {
            optDiv.classList.add('locked');
            if (answeredIdx === idx) {
              if (idx === q.correctIndex) {
                optDiv.classList.add('correct');
              } else {
                optDiv.classList.add('wrong');
              }
            } else if (idx === q.correctIndex && answeredIdx !== q.correctIndex) {
              optDiv.classList.add('reveal-correct');
            }
          } else {
            optDiv.addEventListener('click', () => chooseOption(q.id, idx));
          }

          optDiv.innerHTML = `
            <div class="opt-label">${opt.label}</div>
            <div class="opt-text">${opt.text}</div>
          `;

          optsContainer.appendChild(optDiv);
        });

        card.appendChild(optsContainer);
        container.appendChild(card);
      });
    }

    // Chọn đáp án (áp dụng cho cả Ôn tập và Thi thử: hiển thị ngay kết quả)
    function chooseOption(questionId, selectedIdx) {
      if (userAnswers[questionId] !== undefined) return;

      userAnswers[questionId] = selectedIdx;
      if (!isExamMode) {
        saveAnswers(currentSubjectKey);
      }

      const qCard = document.getElementById('q_' + questionId);
      if (qCard) {
        const questions = isExamMode ? examQuestions : ALL_SUBJECTS[currentSubjectKey].questions;
        const q = questions.find(item => item.id === questionId);
        if (!q) return;

        const resetBtn = qCard.querySelector('#reset_btn_' + q.id);
        if (resetBtn) resetBtn.style.display = 'inline-block';

        const optElements = qCard.querySelectorAll('.option-item');
        optElements.forEach((optDiv, idx) => {
          optDiv.classList.add('locked');
          if (idx === selectedIdx) {
            if (selectedIdx === q.correctIndex) {
              optDiv.classList.add('correct');
            } else {
              optDiv.classList.add('wrong');
            }
          } else if (idx === q.correctIndex && selectedIdx !== q.correctIndex) {
            optDiv.classList.add('reveal-correct');
          }
        });
      }

      if (isExamMode) {
        updateExamProgressBadge();
        checkExamAutoFinish();
      }
    }

    // Reset a single question
    function resetQuestion(questionId) {
      delete userAnswers[questionId];
      if (!isExamMode) {
        saveAnswers(currentSubjectKey);
      } else {
        updateExamProgressBadge();
      }

      const qCard = document.getElementById('q_' + questionId);
      if (qCard) {
        const resetBtn = qCard.querySelector('#reset_btn_' + questionId);
        if (resetBtn) resetBtn.style.display = 'none';

        const optElements = qCard.querySelectorAll('.option-item');
        optElements.forEach((optDiv) => {
          optDiv.className = 'option-item';
        });
      }
    }

    // Parse imported Markdown from browser
    function parseImportedMarkdown(text, filename) {
      let title = filename ? filename.replace(/\\.(md|markdown|txt)$/i, '') : 'Môn mới';
      const titleMatch = text.match(/^#\\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].replace(/\\s*\\(?\\d+\\s*câu\\)?/i, '').trim();
      }

      const labelMap = { A: 0, B: 1, C: 2, D: 3, E: 4 };
      const questions = [];

      if (text.includes('Đáp án:') || text.includes('### Câu')) {
        const parts = text.split(/(?:###\\s*)?Câu\\s+(\\d+)[\\:\\.]?/);
        for (let i = 1; i < parts.length; i += 2) {
          const qNum = parseInt(parts[i], 10);
          const qBody = parts[i + 1].trim();

          const ansMatch = qBody.match(/Đáp án:.*?\\b([A-Za-z])\\b/);
          const correctLetter = ansMatch ? ansMatch[1].toUpperCase() : null;

          const beforeAns = qBody.split(/\\*\\*Đáp án:|Đáp án:/)[0].trim();
          const lines = beforeAns.split('\\n').map(l => l.trim()).filter(Boolean);

          const qTextLines = [];
          const options = [];

          for (const line of lines) {
            const m = line.match(/^(?:-\\s*)?([A-Za-z])[\\.\\:\\)]\\s*(.*)/);
            if (m && labelMap[m[1].toUpperCase()] !== undefined) {
              options.push({
                label: m[1].toLowerCase(),
                text: m[2].trim()
              });
            } else {
              if (options.length === 0) {
                qTextLines.push(line);
              } else {
                options[options.length - 1].text += ' ' + line;
              }
            }
          }

          const qText = qTextLines.join(' ').trim();
          const cIdx = labelMap[correctLetter] !== undefined ? labelMap[correctLetter] : -1;
          if (qText && options.length > 0) {
            questions.push({
              id: qNum,
              question: qText,
              options: options,
              correctIndex: cIdx
            });
          }
        }
      } else if (text.match(/\\*\\*Câu\\s+\\d+/)) {
        const parts = text.split(/\\*\\*Câu\\s+(\\d+)[\\:\\.]?\\*\\*/);
        for (let i = 1; i < parts.length; i += 2) {
          const qNum = parseInt(parts[i], 10);
          const qBody = parts[i + 1].trim();
          const lines = qBody.split('\\n').map(l => l.trim()).filter(Boolean);

          const qTextLines = [];
          const options = [];
          let cIdx = -1;

          for (const line of lines) {
            const m = line.match(/^(\\*\\*)?([a-zA-Z])[\\.\\:\\)](.*)/);
            if (m) {
              const lbl = m[2].toLowerCase();
              const rest = m[3].trim();
              const isBold = Boolean(m[1]) || rest.startsWith('**') || rest.endsWith('**');
              const cleanRest = rest.replace(/\\*\\*/g, '').trim();

              if (isBold) {
                cIdx = options.length;
              }

              options.push({
                label: lbl,
                text: cleanRest
              });
            } else {
              if (options.length === 0) {
                qTextLines.push(line.replace(/\\*\\*/g, '').trim());
              } else {
                options[options.length - 1].text += ' ' + line.replace(/\\*\\*/g, '').trim();
              }
            }
          }

          const qText = qTextLines.join(' ').trim();
          if (qText && options.length > 0) {
            questions.push({
              id: qNum,
              question: qText,
              options: options,
              correctIndex: cIdx
            });
          }
        }
      }

      return { title, questions };
    }

    function setupFileUpload() {
      const input = document.getElementById('fileUploadInput');
      if (!input) return;

      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          let parsedTitle = '';
          let questions = [];

          if (file.name.endsWith('.json')) {
            try {
              const data = JSON.parse(content);
              questions = Array.isArray(data) ? data : (data.questions || []);
              parsedTitle = data.title || file.name.replace('.json', '');
            } catch (err) {
              alert('File JSON không hợp lệ!');
              return;
            }
          } else {
            const res = parseImportedMarkdown(content, file.name);
            parsedTitle = res.title;
            questions = res.questions;
          }

          if (questions.length === 0) {
            alert('Không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra định dạng!');
            return;
          }

          const slug = 'custom_' + Date.now();
          const newSub = {
            id: slug,
            title: parsedTitle,
            subtitle: questions.length + ' câu hỏi (tải lên)',
            icon: '📝',
            questions: questions
          };

          let customMap = {};
          try {
            const saved = localStorage.getItem('custom_subjects');
            if (saved) customMap = JSON.parse(saved);
          } catch (e) {}

          customMap[slug] = newSub;
          saveCustomSubjects(customMap);
          ALL_SUBJECTS[slug] = newSub;

          renderMenuScreen();
          selectSubject(slug);
        };
        reader.readAsText(file);
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      loadCustomSubjects();
      renderMenuScreen();
      setupFileUpload();

      const searchBox = document.getElementById('searchBox');
      if (searchBox) {
        searchBox.addEventListener('input', (e) => {
          filterQuery = e.target.value;
          renderQuestionsList();
        });
      }

      const urlParams = new URLSearchParams(window.location.search);
      const subParam = urlParams.get('subject') || urlParams.get('mon');
      if (subParam && ALL_SUBJECTS[subParam]) {
        selectSubject(subParam);
      }
    });
  </script>
</body>
</html>
"""

    output_html_path = os.path.join(BASE_DIR, "index.html")
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"Generated {output_html_path} successfully!")

if __name__ == "__main__":
    build_all()
