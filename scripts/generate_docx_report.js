const fs = require('fs');
const docx = require('docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak
} = docx;

console.log('Loading domain questions processed...');
const domains = JSON.parse(fs.readFileSync('scripts/domain_questions_processed.json', 'utf8'));

// Palette
const COLOR_PRIMARY = '1B365D';     // Navy Blue
const COLOR_SECONDARY = '008080';   // Teal
const COLOR_ACCENT = 'D97706';      // Warm Amber
const COLOR_DARK = '1E293B';        // Dark Slate
const COLOR_LIGHT_BG = 'F1F5F9';    // Light Slate Gray
const COLOR_HIGHLIGHT_BG = 'FEF3C7';// Amber Tint
const COLOR_WHITE = 'FFFFFF';
const COLOR_BORDER = 'CBD5E1';      // Light Border Gray
const COLOR_ROW_ALT = 'F8FAFC';

// Helper styles
const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: COLOR_BORDER
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder
};

function createHeaderCell(text, widthPercent) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_PRIMARY },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: text,
            bold: true,
            color: COLOR_WHITE,
            size: 20 // 10pt
          })
        ]
      })
    ]
  });
}

function createTableCell(text, widthPercent, isAlt = false, isBold = false, align = AlignmentType.LEFT, textColor = COLOR_DARK) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: isAlt ? COLOR_ROW_ALT : COLOR_WHITE },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: text,
            bold: isBold,
            color: textColor,
            size: 19 // 9.5pt
          })
        ]
      })
    ]
  });
}

function createSectionHeading(title, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        color: level === HeadingLevel.HEADING_1 ? COLOR_PRIMARY : COLOR_SECONDARY,
        size: level === HeadingLevel.HEADING_1 ? 28 : 24
      })
    ]
  });
}

function createCalloutBox(title, lines) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LIGHT_BG },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: '📌 ' + title,
                    bold: true,
                    color: COLOR_PRIMARY,
                    size: 21
                  })
                ]
              }),
              ...lines.map(line => new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: '• ' + line,
                    color: COLOR_DARK,
                    size: 19
                  })
                ]
              }))
            ]
          })
        ]
      })
    ]
  });
}

// Generate the complete document
async function buildDoc() {
  console.log('Assembling Word document contents...');

  const children = [];

  // TITLE & COVER BLOCK
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ÔN THI CHUYÊN ĐỀ',
          bold: true,
          color: COLOR_SECONDARY,
          size: 24
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 160 },
      children: [
        new TextRun({
          text: 'TỔNG HỢP & THỐNG KÊ TOÀN BỘ SỐ LIỆU KỸ THUẬT',
          bold: true,
          color: COLOR_PRIMARY,
          size: 34
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 200 },
      children: [
        new TextRun({
          text: 'CÁC PHÂN MÔN CNS PHẦN 2 VÀ CNS TỔNG HỢP THI',
          bold: true,
          color: COLOR_ACCENT,
          size: 26
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 400 },
      children: [
        new TextRun({
          text: 'Tra cứu tham số tần số, cự ly, công suất, góc dốc, dung sai, tiêu chuẩn kỹ thuật & Ngân hàng câu hỏi trắc nghiệm số liệu đầy đủ',
          italics: true,
          color: '64748B',
          size: 20
        })
      ]
    })
  );

  // SECTION 1: LỜI MỞ ĐẦU & BẢNG THỐNG KÊ TỔNG QUAN
  children.push(
    createSectionHeading('PHẦN I: THỐNG KÊ TỔNG QUAN NGÂN HÀNG CÂU HỎI', HeadingLevel.HEADING_1),
    new Paragraph({
      spacing: { before: 80, after: 140 },
      children: [
        new TextRun({
          text: 'Tài liệu này được biên soạn và trích xuất dựa trên toàn bộ cơ sở dữ liệu câu hỏi của các phân môn ',
          size: 20
        }),
        new TextRun({
          text: 'CNS Phần 2 ',
          bold: true,
          size: 20
        }),
        new TextRun({
          text: '(Môn 1 đến Môn 10) và ngân hàng câu hỏi ',
          size: 20
        }),
        new TextRun({
          text: 'CNS Tổng hợp thi',
          bold: true,
          size: 20
        }),
        new TextRun({
          text: '. Tổng cộng hệ thống có ',
          size: 20
        }),
        new TextRun({
          text: '637 lượt câu hỏi',
          bold: true,
          color: COLOR_PRIMARY,
          size: 20
        }),
        new TextRun({
          text: ', sau khi lọc trùng lặp giữa các phân môn đơn lẻ và môn tổng hợp thu được ',
          size: 20
        }),
        new TextRun({
          text: '351 câu hỏi duy nhất',
          bold: true,
          color: COLOR_PRIMARY,
          size: 20
        }),
        new TextRun({
          text: '. Trong đó có tới ',
          size: 20
        }),
        new TextRun({
          text: '347 câu hỏi (chiếm 98.8%)',
          bold: true,
          color: COLOR_ACCENT,
          size: 20
        }),
        new TextRun({
          text: ' liên quan trực tiếp đến các số liệu kỹ thuật, đơn vị đo, quy chuẩn ICAO, tần số vô tuyến, cự ly, thời gian, kích thước và ngưỡng giám sát.',
          size: 20
        })
      ]
    })
  );

  // Table of Statistics
  const statTableRows = [
    new TableRow({
      children: [
        createHeaderCell('STT', 8),
        createHeaderCell('Tên phân môn kỹ thuật CNS', 52),
        createHeaderCell('Tổng câu', 14),
        createHeaderCell('Câu duy nhất', 14),
        createHeaderCell('Số liệu kỹ thuật', 12)
      ]
    })
  ];

  let sumRaw = 0;
  let sumUnique = 0;

  domains.forEach((dom, idx) => {
    sumRaw += dom.rawCount;
    sumUnique += dom.uniqueCount;
    const isAlt = idx % 2 === 1;
    statTableRows.push(
      new TableRow({
        children: [
          createTableCell(String(idx + 1), 8, isAlt, false, AlignmentType.CENTER),
          createTableCell(dom.name, 52, isAlt, true),
          createTableCell(String(dom.rawCount), 14, isAlt, false, AlignmentType.CENTER),
          createTableCell(String(dom.uniqueCount), 14, isAlt, false, AlignmentType.CENTER),
          createTableCell(String(dom.uniqueCount), 12, isAlt, false, AlignmentType.CENTER, COLOR_PRIMARY)
        ]
      })
    );
  });

  // Total Row
  statTableRows.push(
    new TableRow({
      children: [
        createTableCell('', 8, false, true, AlignmentType.CENTER),
        createTableCell('TỔNG CỘNG', 52, false, true, AlignmentType.LEFT, COLOR_PRIMARY),
        createTableCell(String(sumRaw), 14, false, true, AlignmentType.CENTER, COLOR_PRIMARY),
        createTableCell(String(sumUnique), 14, false, true, AlignmentType.CENTER, COLOR_PRIMARY),
        createTableCell('347', 12, false, true, AlignmentType.CENTER, COLOR_ACCENT)
      ]
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: statTableRows
    }),
    new Paragraph({ spacing: { before: 180, after: 180 } })
  );

  // SECTION 2: BẢNG TRA CỨU NHANH SỐ LIỆU CỐT LÕI (CHEAT SHEET)
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    createSectionHeading('PHẦN II: BẢNG TRA CỨU NHANH SỐ LIỆU CỐT LÕI (CORE CHEAT SHEET)', HeadingLevel.HEADING_1),
    new Paragraph({
      spacing: { before: 60, after: 140 },
      children: [
        new TextRun({
          text: 'Bảng dưới đây tổng hợp cô đọng toàn bộ các giá trị thông số số liệu mang tính chất "sống còn" thường xuyên xuất hiện trong các đề thi tuyển dụng, sát hạch chứng chỉ nhân viên kỹ thuật CNS:',
          italics: true,
          size: 19
        })
      ]
    })
  );

  const cheatSheetRows = [
    new TableRow({
      children: [
        createHeaderCell('Hệ thống', 18),
        createHeaderCell('Thông số số liệu', 32),
        createHeaderCell('Giá trị tiêu chuẩn / Quy chuẩn', 28),
        createHeaderCell('Ghi chú kỹ thuật & Ý nghĩa', 22)
      ]
    })
  ];

  const cheatData = [
    // Thoại VHF
    ['Thoại VHF', 'Dải tần số công tác', '118.000 – 136.975 MHz', 'Sóng cực ngắn VHF hàng không'],
    ['Thoại VHF', 'Bước kênh (Channel spacing)', '25 kHz và 8.33 kHz', '8.33 kHz giúp tăng 3 lần số kênh'],
    ['Thoại VHF', 'Tần số cấp cứu / khẩn nguy', '121.500 MHz (phụ: 123.100 MHz)', 'Canh nghe 24/7 toàn cầu'],
    ['Thoại VHF', 'Công suất phát chuẩn', '25W đến 50W', 'Trạm mặt đất thông dụng'],
    ['Thoại VHF', 'Trở kháng & VSWR', '50 Ω, VSWR ≤ 1.5', 'Tránh phản xạ làm hỏng tầng PA'],
    ['Thoại VHF', 'Phân cực anten', 'Phân cực đứng (Vertical)', 'Phù hợp anten trên thân tàu bay'],
    // Đường truyền
    ['Đường truyền', 'Trở kháng cáp đồng trục', '50 Ω (RF) và 75 Ω (Video)', 'Chuẩn phối hợp trở kháng'],
    ['Đường truyền', 'Băng thông cáp quang', 'Rất cao (hàng chục Gbps)', 'Suy hao cực thấp, miễn nhiễm EMI'],
    ['Đường truyền', 'Giao thức truyền dữ liệu', 'TCP/IP, UDP, SNMP, HDLC', 'SNMP: giám sát thiết bị từ xa'],
    // PBN / RNAV / RNP
    ['PBN / RNAV', 'Định nghĩa RNAV X / RNP X', 'Sai số vị trí ngang ≤ X NM trong ≥ 95% thời gian', 'Cơ sở phân cấp dẫn đường PBN'],
    ['PBN / RNAV', 'Bay đường dài trên biển/vùng xa', 'RNAV 10 (RNP 10), RNP 4', 'Dựa trên GNSS / IRS'],
    ['PBN / RNAV', 'Bay đường dài trên lục địa', 'RNAV 5 (B-RNAV), RNAV 2, RNP 2', 'VOR/DME, DME/DME, GNSS'],
    ['PBN / RNAV', 'Phương thức SID / STAR', 'RNAV 1 (P-RNAV), RNP 1', 'Độ chính xác ±1 Hải lý'],
    ['PBN / RNAV', 'Tiếp cận hạ cánh (Approach)', 'RNP 0.3, RNP APCH', 'RNP AR APCH đạt 0.3 đến 0.1 NM'],
    ['PBN / RNAV', 'Xác suất tính liên tục RNP', 'Xác suất mất tín hiệu < 10⁻⁵ / giờ bay', 'Yêu cầu tính toàn vẹn cao'],
    // NDB
    ['NDB', 'Dải tần số làm việc chung', '190 kHz – 535 kHz', 'Sóng trung LF/MF hàng không'],
    ['NDB', 'Tần số NDB vùng biển & đảo', '190 kHz – 300 kHz', 'Nâng cao tầm phủ sóng đất trên biển'],
    ['NDB', 'Tần số NDB vùng đất liền', '300 kHz – 535 kHz', 'Tối ưu suy hao trên mặt đất liền'],
    ['NDB', 'Khoảng cách tần số tối thiểu 2 đài', '6 kHz', 'Tránh can nhiễu giữa 2 đài kề nhau'],
    ['NDB', 'Tần số âm hiệu Ident Morse', '1020 Hz hoặc 400 Hz', 'Độ sâu điều chế AM: 85% – 95%'],
    ['NDB', 'Số tia Ground plane Polestar A', '6 tia', 'Hệ thống anten NDB Nautel'],
    ['NDB', 'Số tia Ground plane Polestar B', '18 tia', 'Tăng cường hiệu suất bức xạ anten'],
    ['NDB', 'Tầm phủ đài Locator (LOM/LMM)', '10 – 25 NM', 'Đài dẫn đường đường dài: 50 – 150 NM'],
    // DF & PAPI
    ['DF', 'Dải tần đài tìm phương VHF/DF', '118.000 – 137.000 MHz', 'Đo góc phương vị tàu bay (QDM/QDR)'],
    ['DF', 'Cấp chính xác theo ICAO', 'A: ≤ ±2°, B: ≤ ±5°, C: ≤ ±10°, D: > ±10°', 'Class A là cấp chính xác cao nhất'],
    ['PAPI', 'Góc tiếp cận tiêu chuẩn (GP)', '3.0° (3 độ)', 'Góc chuẩn hạ cánh'],
    ['PAPI', 'Góc đặt 4 hộp đèn A, B, C, D', 'A: 3°30\', B: 3°10\', C: 2°50\', D: 2°30\'', 'Chênh lệch 20\' góc giữa 2 đèn kề'],
    ['PAPI', 'Hiển thị màu khi bay đúng góc', '2 Trắng – 2 Đỏ', '3T-1Đ: hơi cao, 4T: quá cao, 4Đ: nguy hiểm'],
    ['PAPI', 'Khoảng cách giữa các hộp đèn', '9m ± 1m (hoặc 15m ± 1m)', 'Lắp đặt hàng ngang bên trái đường CHC'],
    // VOR
    ['VOR', 'Dải tần số hoạt động', '108.000 – 117.975 MHz', '108.00-111.95 chia sẻ với ILS (kênh chẵn)'],
    ['VOR', 'Bước kênh (Channel spacing)', '50 kHz (hoặc 100 kHz)', 'Tổng cộng 160 kênh VOR'],
    ['VOR', 'Tần số tín hiệu chuẩn & biến đổi', '30 Hz (tín hiệu góc phương vị)', 'Tần số sóng mang phụ: 9960 Hz'],
    ['VOR', 'Độ di tần FM & Chỉ số điều chế', 'Δf = ±480 Hz, Chỉ số m = 16', 'm = 480 / 30 = 16'],
    ['VOR', 'Tốc độ quay giản đồ bức xạ', '30 vòng/giây (1800 vòng/phút)', 'Tạo tần số biến thiên 30 Hz'],
    ['VOR', 'Số anten sideband của đài DVOR', '48 hoặc 50 anten (Alcatel/Thales)', 'Xếp trên đường kính 13.5m (~5λ)'],
    ['VOR', 'Sai số cho phép & Ngưỡng báo động', 'Sai số ≤ ±1°, báo động khi lệch > ±1.0° (hoặc 1.2°)', 'Tự động chuyển đổi hoặc tắt máy'],
    // DME
    ['DME', 'Dải tần số hoạt động', '960 MHz – 1215 MHz', 'Phân dải sóng siêu cao tần UHF'],
    ['DME', 'Độ lệch tần số hỏi và trả lời', 'Cố định 63 MHz', 'Áp dụng cho mọi kênh DME'],
    ['DME', 'Khoảng cách cặp xung Chế độ X', 'Hỏi: 12 µs, Trả lời: 12 µs', 'Độ trễ máy phát đáp mặt đất: 50 µs'],
    ['DME', 'Khoảng cách cặp xung Chế độ Y', 'Hỏi: 36 µs, Trả lời: 30 µs', 'Độ trễ máy phát đáp mặt đất: 56 µs'],
    ['DME', 'Độ rộng mỗi xung DME', '3.5 µs ± 0.5 µs', 'Dạng cặp xung hình chuông Gauss'],
    ['DME', 'Tốc độ phát xung hỏi máy bay', 'Search: ≤ 150 ppps, Track: 25 – 30 ppps', 'ppps = pulse pairs per second'],
    ['DME', 'Dung lượng phục vụ đồng thời', 'Tối thiểu 100 tàu bay', 'Tối đa ~2700 ppps trước khi bão hòa'],
    ['DME', 'Độ chính xác đo cự ly', 'Sai số ≤ ±0.17 NM (hoặc ±0.2 NM)', 'Công suất phát: 100W đến 1 kW'],
    // ILS
    ['ILS - LLZ', 'Dải tần Localizer (hướng tim)', '108.100 – 111.950 MHz (thập phân lẻ)', 'Điều chế 90 Hz (trái) và 150 Hz (phải)'],
    ['ILS - LLZ', 'Độ sâu điều chế & DDM', 'SDM = 40% (mỗi tần số 20%), DDM = 0 trên tim', 'Displacement Sensitivity: 0.00145 DDM/m'],
    ['ILS - LLZ', 'Tầm phủ sóng Localizer', '25 NM (trong ±10°), 17 NM (trong ±35°)', 'Báo động khi lệch tim > 10.5m (CAT I) hoặc 7.5m'],
    ['ILS - GP', 'Dải tần Glide Path (đường trượt)', '329.150 – 335.000 MHz (UHF)', 'Ghép kênh tự động với Localizer'],
    ['ILS - GP', 'Góc hạ cánh chuẩn & Tầm phủ', 'Góc θ = 3.0° (2.5° – 3.5°), Tầm phủ 10 NM', 'Báo động khi góc lệch quá ±0.075 θ (±0.225°)'],
    ['ILS - Marker', 'Đài Outer Marker (OM)', 'Cách thềm 7.2 km (3.9 NM), 400 Hz, Đèn xanh', 'Đánh dấu điểm bắt đầu hạ cánh'],
    ['ILS - Marker', 'Đài Middle Marker (MM)', 'Cách thềm 1050 m (3500 ft), 1300 Hz, Đèn vàng', 'Đánh dấu điểm quyết định CAT I'],
    ['ILS - Marker', 'Đài Inner Marker (IM)', 'Cách thềm 75 – 450 m, 3000 Hz, Đèn trắng', 'Đánh dấu điểm quyết định CAT II'],
    ['ILS - CAT', 'Tiêu chuẩn phân cấp CAT I', 'DH ≥ 60m (200 ft), RVR ≥ 550m (hoặc 800m)', 'CAT II: DH 30-60m, RVR ≥ 300m'],
    ['ILS - CAT', 'Tiêu chuẩn CAT IIIa, b, c', 'IIIa: RVR≥175m, IIIb: RVR 50-175m, IIIc: 0/0', 'Hạ cánh hoàn toàn tự động Autoland'],
    // GNSS
    ['GNSS - GPS', 'Số lượng vệ tinh GPS', 'Tối thiểu 24 vệ tinh; Hiện khai thác: 31 vệ tinh', '6 mặt phẳng quỹ đạo (4 vệ tinh/mặt phẳng)'],
    ['GNSS - GPS', 'Độ cao, độ nghiêng & chu kỳ', 'Độ cao 20.200 km, Góc 55°, Chu kỳ 11h58m', 'Quay 2 vòng quanh Trái Đất mỗi ngày'],
    ['GNSS - GPS', 'Tần số phát sóng GPS', 'L1 = 1575.42 MHz, L2 = 1227.60, L5 = 1176.45', 'Kỹ thuật đa truy cập CDMA'],
    ['GNSS - GPS', 'Số vệ tinh tối thiểu định vị', '2D: 3 vệ tinh; 3D: 4 vệ tinh; RAIM: 5; FDE: 6', '4 vệ tinh giải (X, Y, Z, sai số đồng hồ)'],
    ['GNSS - GLONASS', 'Số lượng, độ nghiêng & chu kỳ', '24 vệ tinh, 3 quỹ đạo, Góc 64.8°, Chu kỳ 11h15m', 'Độ cao 19.100 km, Đa truy cập FDMA'],
    ['GNSS - GALILEO', 'Số lượng vệ tinh GALILEO', '30 vệ tinh (24 hoạt động, 6 dự phòng), 3 quỹ đạo', 'Độ cao 23.222 km, Góc nghiêng 56°'],
    ['GNSS - SBAS/GBAS', 'Hệ thống tăng cường vệ tinh', 'SBAS: WAAS, EGNOS, MSAS; GBAS: tại sân bay', 'GBAS phát vi sai dải VHF (108-117.975 MHz)'],
    // Avionics
    ['Avionics', 'Góc dốc PFD hiển thị bất thường', 'Pitch > 25° hoặc < -13°, Roll > 45° (hoặc 67°)', 'Màn hình tự xóa chi tiết phụ để cứu nguy'],
    ['Avionics', 'Chu kỳ cập nhật dữ liệu FMS/AIRAC', 'Mỗi 28 ngày một lần', 'Chu kỳ quy chuẩn hàng không quốc tế'],
    ['Avionics', 'Tần số Ra đa thời tiết (WXR)', 'Băng X (khoảng 9.3 – 9.5 GHz, bước sóng ~3cm)', '4 mức màu: Xanh lá, Vàng, Đỏ, Tím magenta'],
    ['Avionics', 'Đo cao vô tuyến (Radio Altimeter)', 'Dải tần 4.2 – 4.4 GHz (băng C), dải đo 0 – 2500 ft', 'Đo độ cao tuyệt đối so với địa hình mặt đất'],
    ['Avionics', 'Hệ thống tránh va chạm TCAS II', '1030 MHz (hỏi), 1090 MHz (đáp), Tầm quét 30-40 NM', 'Cảnh báo: TA trước 35-45s, RA trước 20-30s'],
    ['Avionics', 'Dẫn đường quán tính (INS/IRS)', 'Gồm 3 Con quay hồi chuyển + 3 Gia tốc kế', '2 loại: Khung Gimballed & Dây buộc Strapdown']
  ];

  cheatData.forEach((row, idx) => {
    const isAlt = idx % 2 === 1;
    cheatSheetRows.push(
      new TableRow({
        children: [
          createTableCell(row[0], 18, isAlt, true, AlignmentType.LEFT, COLOR_PRIMARY),
          createTableCell(row[1], 32, isAlt, false, AlignmentType.LEFT),
          createTableCell(row[2], 28, isAlt, true, AlignmentType.LEFT, COLOR_DARK),
          createTableCell(row[3], 22, isAlt, false, AlignmentType.LEFT, '64748B')
        ]
      })
    );
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: cheatSheetRows
    }),
    new Paragraph({ spacing: { before: 200, after: 200 } })
  );

  // SECTION 3: TỔNG HỢP KIẾN THỨC SỐ LIỆU CHI TIẾT & TOÀN BỘ CÂU HỎI THEO 10 PHÂN MÔN
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    createSectionHeading('PHẦN III: TỔNG HỢP KIẾN THỨC & NGÂN HÀNG CÂU HỎI THEO PHÂN MÔN', HeadingLevel.HEADING_1)
  );

  // Define theoretical bullet points for each domain
  const domainTheory = {
    thoai: [
      'Dải tần số vô tuyến VHF hàng không: 118.000 MHz đến 136.975 MHz.',
      'Bước kênh: Phổ biến là 25 kHz (ví dụ: 118.025 MHz), các khu vực mật độ bay cao áp dụng chuẩn 8.33 kHz để tăng gấp 3 số lượng kênh.',
      'Tần số cấp cứu quốc tế: 121.500 MHz (tần số phụ tìm kiếm cứu nạn: 123.100 MHz).',
      'Loại điều chế thoại hàng không: Điều chế biên độ AM (A3E) - cho phép phi công nghe thấy tín hiệu đè khi có 2 máy cùng phát đồng thời.',
      'Công suất phát trạm mặt đất: Thường từ 25W đến 50W. Tầm phủ tính theo cự ly tầm nhìn thẳng (Line of Sight): D(NM) = 1.23 × (√H_tx + √H_rx).',
      'Đặc tính anten VHF: Phân cực đứng (Vertical Polarization). Trở kháng danh định 50 Ω, yêu cầu hệ số sóng đứng VSWR ≤ 1.5.'
    ],
    duong_truyen: [
      'Đường truyền hữu tuyến (cáp đồng, cáp quang) có độ ổn định và độ tin cậy rất cao, ít chịu ảnh hưởng của thời tiết.',
      'Cáp đồng trục: Trở kháng danh định 50 Ω (dùng cho truyền dẫn vô tuyến cao tần RF) và 75 Ω (truyền hình, camera). Đang dần được thay thế bởi cáp quang.',
      'Cáp quang: Băng thông cực kỳ lớn, suy hao cực thấp theo khoảng cách, miễn nhiễm 100% với can nhiễu điện từ trường (EMI/RFI).',
      'Đường truyền vô tuyến (vi ba, vệ tinh): Băng thông trung bình, chịu ảnh hưởng đáng kể của điều kiện thời tiết (mưa, tầng điện ly, che khuất địa hình).',
      'Giao thức mạng: TCP/IP và UDP cho truyền dẫn mạng; SNMP cho giám sát và quản lý thiết bị mạng; HDLC cho liên kết dữ liệu công nghiệp.'
    ],
    pbn: [
      'Khái niệm PBN (Performance-Based Navigation): Dẫn đường dựa trên tính năng yêu cầu của trang thiết bị trên tàu bay.',
      'Định nghĩa con số RNAV X và RNP X: Tàu bay phải đảm bảo độ chính xác vị trí ngang (TSE) nằm trong phạm vi bán kính X Hải lý (NM) trong ít nhất 95% tổng thời gian bay.',
      'Sự khác nhau cốt lõi: RNP bắt buộc phải có chức năng giám sát và cảnh báo tính năng trên tàu bay (On-board Performance Monitoring and Alerting - OPMA); RNAV không yêu cầu.',
      'Ứng dụng theo phân đoạn bay:',
      '  • En-route biển/vùng xa: RNAV 10 (RNP 10) và RNP 4.',
      '  • En-route lục địa: RNAV 5 (B-RNAV) và RNAV 2, RNP 2.',
      '  • Đi và đến (Terminal SID/STAR): RNAV 1 (P-RNAV) và RNP 1.',
      '  • Tiếp cận hạ cánh (Approach): RNP 0.3 và RNP APCH; RNP AR APCH (độ chính xác 0.3 NM giảm dần xuống đến 0.1 NM).',
      'Tiêu chuẩn an toàn: Xác suất mất tín hiệu liên tục < 10⁻⁵ trong thời gian bay; cảnh báo đến tổ lái trong vòng 10 giây (hoặc 2 giây đối với RNP AR).'
    ],
    ndb: [
      'Dải tần số công tác của đài NDB: 190 kHz – 535 kHz (dải sóng dài và sóng trung LF/MF).',
      'Tần số NDB ở vùng biển và hải đảo: 190 kHz – 300 kHz (tận dụng đặc tính sóng đất truyền lan cực tốt trên nước biển để mở rộng cự ly phủ sóng).',
      'Tần số NDB ở vùng đất liền: 300 kHz – 535 kHz.',
      'Khoảng cách tần số tối thiểu giữa 2 đài NDB lân cận theo TCCS của Cục Hàng không: 6 kHz (để chống can nhiễu kề kênh).',
      'Phương thức điều chế: Điều chế biên độ AM (A2A với sóng mang và âm hiệu, hoặc NON/A2A). Tần số âm hiệu nhận dạng Morse (Ident): 1020 Hz hoặc 400 Hz. Độ sâu điều chế: 85% – 95%.',
      'Hệ thống anten NDB Nautel: Anten thẳng đứng Polestar kết hợp mặt đất phản xạ (Ground plane):',
      '  • Polestar A: Gồm 6 tia Ground plane.',
      '  • Polestar B: Gồm 18 tia Ground plane.',
      'Phân loại cự ly: Đài Locator (đài gần LMM, đài xa LOM hỗ trợ tiếp cận) có tầm phủ 10 – 25 NM; Đài dẫn đường đường dài (En-route NDB) có tầm phủ 50 – 150 NM.'
    ],
    df_papi: [
      'Đài tìm phương VHF/DF: Thu tín hiệu phát từ tàu bay trên dải 118 – 137 MHz để xác định góc phương vị QDM (hướng từ máy bay về đài) hoặc QDR (hướng từ đài tới máy bay).',
      'Cấp chính xác theo ICAO: Class A (sai số ≤ ±2°); Class B (≤ ±5°); Class C (≤ ±10°); Class D (> ±10°).',
      'Hệ thống đèn tiếp cận chính xác PAPI (Precision Approach Path Indicator): Gồm 4 bộ đèn đặt thành hàng ngang vuông góc với trục đường CHC ở phía bên trái.',
      'Góc tiếp cận chuẩn: 3.0° (3 độ). Góc nghiêng đặt của 4 đèn tính từ ngoài vào trong: Đèn A (3°30\'), Đèn B (3°10\'), Đèn C (2°50\'), Đèn D (2°30\'). Chênh lệch góc giữa 2 đèn kề nhau là 20\' góc (0.33°).',
      'Hiển thị màu: 2 Trắng – 2 Đỏ (Đúng góc); 3 Trắng – 1 Đỏ (Hơi cao); 4 Trắng (Quá cao); 1 Trắng – 3 Đỏ (Hơi thấp); 4 Đỏ (Quá thấp, nguy cơ va chạm địa hình).',
      'Khoảng cách lắp đặt giữa các hộp đèn PAPI: 9m ± 1m (sân bay thương mại) hoặc 15m ± 1m.'
    ],
    vor: [
      'Dải tần số công tác: 108.000 MHz – 117.975 MHz. Khoảng cách kênh: 50 kHz hoặc 100 kHz (tổng 160 kênh).',
      'Nguyên lý đo phương vị: Đo góc lệch pha giữa tín hiệu chuẩn (Reference 30 Hz) và tín hiệu biến đổi (Variable 30 Hz).',
      'Tần số sóng mang phụ (Subcarrier): 9960 Hz. Độ di tần cực đại: Δf = ±480 Hz. Chỉ số điều chế: m = 480 / 30 = 16.',
      'Tốc độ quay của giản đồ bức xạ: 30 vòng/giây (tương ứng 1800 vòng/phút). Tần số âm hiệu nhận dạng Morse: 1020 Hz, điều chế AM độ sâu 10%.',
      'Đài Doppler VOR (DVOR): Gồm 1 anten sóng mang trung tâm và vòng tròn 48 hoặc 50 anten biên (Alcatel/Thales) xếp trên đường kính 13.5m (~5λ).',
      'So sánh điều chế CVOR và DVOR: CVOR phát tín hiệu chuẩn FM 30 Hz (trên sóng mang phụ 9960 Hz) và tín hiệu biến đổi AM 30 Hz; DVOR phát ngược lại (chuẩn AM 30 Hz, biến đổi FM 30 Hz nhờ hiệu ứng Doppler).',
      'Dung sai & Giám sát: Sai số phương vị đài mặt đất ≤ ±1°; hệ thống tự động chuyển máy hoặc tắt khi lệch quá ±1.0° (hoặc ±1.2°).'
    ],
    dme: [
      'Dải tần số hoạt động của DME: 960 MHz – 1215 MHz (phân dải UHF). Tần số hỏi (Interrogation) và tần số trả lời (Reply) luôn lệch nhau đúng 63 MHz.',
      'Chế độ X (Mode X): Cặp xung hỏi cách nhau 12 µs; cặp xung trả lời cách nhau 12 µs; độ trễ máy phát đáp mặt đất: 50 µs.',
      'Chế độ Y (Mode Y): Cặp xung hỏi cách nhau 36 µs; cặp xung trả lời cách nhau 30 µs; độ trễ máy phát đáp mặt đất: 56 µs.',
      'Dạng xung: Cặp xung hình chuông Gauss; độ rộng xung 3.5 µs ± 0.5 µs (đo ở mức 50% biên độ).',
      'Tốc độ phát xung hỏi trên máy bay: Chế độ tìm kiếm (Search) tối đa 150 ppps; chế độ theo dõi (Track) giảm xuống 25 – 30 ppps.',
      'Khả năng phục vụ: Phục vụ đồng thời ít nhất 100 tàu bay; tốc độ phát tối đa ~2700 ppps. Khi bị quá tải/bão hòa xung hỏi, máy phát đáp tự động giảm độ nhạy (ASGC).',
      'Độ chính xác đo cự ly: Sai số toàn hệ thống ≤ ±0.17 NM (hoặc ±0.2 NM). Công suất phát: 100W đến 1 kW.'
    ],
    ils: [
      'Đài hướng dẫn hướng tim đường băng Localizer (LLZ): Dải tần 108.100 – 111.950 MHz (chữ số thập phân đầu tiên là số lẻ). Tín hiệu điều chế 90 Hz (bên trái) và 150 Hz (bên phải). Độ sâu điều chế mỗi tần số 20% (SDM = 40%). Trên tim đường CHC DDM = 0. Tầm phủ 25 NM trong góc ±10°, 17 NM trong góc ±35°. Báo động khi lệch tim > 10.5m (CAT I) hoặc 7.5m (CAT II/III).',
      'Đài hướng dẫn góc hạ cánh Glide Path (GP): Dải tần 329.150 – 335.000 MHz (UHF, ghép kênh đôi tự động với LLZ). Tín hiệu điều chế 90 Hz (phía trên) và 150 Hz (phía dưới). Góc hạ cánh tiêu chuẩn θ = 3.0° (2.5° – 3.5°). Tầm phủ tối thiểu 10 NM trong góc ±8°. Báo động khi góc lệch quá ±0.075 θ (±0.225°).',
      'Đài chỉ giới Marker Beacon (tần số chung 75 MHz):',
      '  • Outer Marker (OM): Cách thềm 7.2 km (3.9 NM), âm hiệu 400 Hz (2 gạch/giây), đèn xanh dương (Blue).',
      '  • Middle Marker (MM): Cách thềm 1050 m (3500 ft), âm hiệu 1300 Hz (chấm-gạch xen kẽ), đèn hổ phách (Amber).',
      '  • Inner Marker (IM): Cách thềm 75 – 450 m, âm hiệu 3000 Hz (chuỗi chấm liên tục), đèn trắng (White).',
      'Tiêu chuẩn phân cấp tiếp cận ILS: CAT I (DH ≥ 60m / 200 ft, RVR ≥ 550m); CAT II (DH 30–60m, RVR ≥ 300m); CAT IIIa (DH < 30m, RVR ≥ 175m); CAT IIIb (DH < 15m, RVR 50–175m); CAT IIIc (DH = 0, RVR = 0).'
    ],
    gnss: [
      'GPS (Navstar GPS - Mỹ): Gồm tối thiểu 24 vệ tinh thiết kế; hiện đang khai thác 31 vệ tinh. Bố trí trên 6 mặt phẳng quỹ đạo (4 vệ tinh/mặt phẳng), góc nghiêng 55°, độ cao 20.200 km, chu kỳ 11 giờ 58 phút (2 vòng/ngày). Đa truy cập CDMA. Tần số: L1 = 1575.42 MHz, L2 = 1227.60 MHz, L5 = 1176.45 MHz.',
      'Số vệ tinh tối thiểu: Cần 3 vệ tinh để định vị 2D; cần 4 vệ tinh để định vị 3D (kinh độ, vĩ độ, độ cao) và đồng bộ sai số thời gian đồng hồ máy thu; cần 5 vệ tinh cho chức năng RAIM cảnh báo lỗi; cần 6 vệ tinh cho RAIM cô lập và loại trừ vệ tinh lỗi (FDE).',
      'GLONASS (Nga): Gồm 24 vệ tinh trên 3 mặt phẳng quỹ đạo, góc nghiêng 64.8°, độ cao 19.100 km, chu kỳ 11 giờ 15 phút. Đa truy cập truyền thống FDMA.',
      'GALILEO (Châu Âu): Gồm 30 vệ tinh (24 hoạt động, 6 dự phòng) trên 3 mặt phẳng quỹ đạo, độ cao 23.222 km, góc nghiêng 56°.',
      'Hệ thống tăng cường: SBAS (WAAS, EGNOS, MSAS) qua vệ tinh địa tĩnh GEO; GBAS tăng cường tại sân bay qua đường truyền dữ liệu VHF VDB (108.000 – 117.975 MHz).'
    ],
    avionics: [
      'Màn hình hiển thị PFD: Hiển thị trạng thái bay chính. Kích hoạt chế độ bất thường (De-clutter) khi góc dốc pitch > 25° hoặc < -13°, hoặc góc nghiêng roll > 45° (hoặc 67°).',
      'Hệ thống quản lý chuyến bay FMS: Cơ sở dữ liệu dẫn đường NavData cập nhật bắt buộc định kỳ mỗi 28 ngày theo chu kỳ AIRAC.',
      'Ra đa thời tiết (WXR): Dải tần băng X (9.3 – 9.5 GHz, bước sóng ~3 cm). Hiển thị 4 mức phản xạ: Xanh lá (mưa nhẹ), Vàng (mưa vừa), Đỏ (mưa lớn nguy hiểm), Tím magenta (mưa cực lớn / lốc tố nghiêm cấm bay vào).',
      'Đo cao vô tuyến (Radio Altimeter): Dải tần 4.2 – 4.4 GHz (băng C). Đo độ cao tuyệt đối từ 0 đến 2500 feet so với địa hình.',
      'Hệ thống cảnh báo va chạm TCAS II: Tần số 1030 MHz (hỏi) và 1090 MHz (đáp). Tầm quét 30 – 40 NM. Tạo vùng bảo vệ: TA cảnh báo trước 35 – 45 giây; RA cảnh báo trước 20 – 30 giây.',
      'Hệ thống dẫn đường quán tính (INS/IRS): Gồm 3 gia tốc kế và 3 con quay hồi chuyển đo trên 3 trục tọa độ. Hai cấu hình chính: Khung Các-đăng (Gimballed) và Dây buộc (Strapdown dùng Laser xoay vòng RLG hoặc sợi quang FOG).'
    ]
  };

  // Iterate over each domain
  domains.forEach((dom, dIdx) => {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      createSectionHeading(`CHƯƠNG ${dIdx + 1}: ${dom.name.toUpperCase()}`, HeadingLevel.HEADING_1),
      new Paragraph({
        spacing: { before: 40, after: 120 },
        children: [
          new TextRun({
            text: `Quy mô dữ liệu: ${dom.uniqueCount} câu hỏi cốt lõi (tổng số ${dom.rawCount} lượt xuất hiện trong ngân hàng CNS P2 & CNS Tổng hợp thi)`,
            italics: true,
            color: '64748B',
            size: 19
          })
        ]
      })
    );

    // Theoretical Highlights Callout Box
    const theoryBullets = domainTheory[dom.id] || [];
    if (theoryBullets.length > 0) {
      children.push(
        createCalloutBox(`Tóm tắt các thông số & kiến thức số liệu cốt lõi - ${dom.name}`, theoryBullets),
        new Paragraph({ spacing: { before: 140, after: 140 } })
      );
    }

    // Questions Table Header
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 100 },
        children: [
          new TextRun({
            text: `Danh mục chi tiết toàn bộ ${dom.uniqueCount} câu hỏi trắc nghiệm số liệu & kỹ thuật:`,
            bold: true,
            color: COLOR_PRIMARY,
            size: 21
          })
        ]
      })
    );

    const qTableRows = [
      new TableRow({
        children: [
          createHeaderCell('STT', 6),
          createHeaderCell('Nội dung câu hỏi trắc nghiệm', 44),
          createHeaderCell('Các phương án lựa chọn', 28),
          createHeaderCell('Đáp án đúng & Phân tích số liệu', 22)
        ]
      })
    ];

    dom.questions.forEach((q, qIdx) => {
      const isAlt = qIdx % 2 === 1;

      // Format options
      const optLines = (q.options || []).map(o => `${o.label.toUpperCase()}. ${o.text}`).join('\n');

      // Highlight the answer and note
      const ansText = q.correctAnswer || 'N/A';
      const explText = q.explanation ? `\n💡 Giải thích: ${q.explanation}` : '';

      qTableRows.push(
        new TableRow({
          children: [
            createTableCell(String(qIdx + 1), 6, isAlt, false, AlignmentType.CENTER),
            createTableCell(q.question, 44, isAlt, true),
            createTableCell(optLines, 28, isAlt, false),
            createTableCell(`✅ ${ansText}${explText}`, 22, isAlt, true, AlignmentType.LEFT, COLOR_PRIMARY)
          ]
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: qTableRows
      }),
      new Paragraph({ spacing: { before: 160, after: 160 } })
    );
  });

  // Create Document structure
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 20, // 10pt
            color: COLOR_DARK
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,    // 2cm
              bottom: 1134, // 2cm
              left: 1417,   // 2.5cm
              right: 1134   // 2cm
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'TÀI LIỆU ÔN THI CNS - THỐNG KÊ SỐ LIỆU KỸ THUẬT',
                    size: 16,
                    color: '94A3B8',
                    italics: true
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Trang ',
                    size: 18,
                    color: '64748B'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    bold: true,
                    color: COLOR_PRIMARY
                  }),
                  new TextRun({
                    text: ' / ',
                    size: 18,
                    color: '64748B'
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    bold: true,
                    color: COLOR_PRIMARY
                  })
                ]
              })
            ]
          })
        },
        children: children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = '/Users/trchuy24/Projects/App Trắc Nghiệm/Tong_Hop_So_Lieu_CNS_Phan2_Va_Tong_Hop_Thi.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully created Word document at:', outPath);
  console.log('File size:', (buffer.length / 1024).toFixed(1), 'KB');
}

buildDoc().catch(err => {
  console.error('Error generating document:', err);
  process.exit(1);
});
