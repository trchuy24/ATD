import os
import zlib
import struct
import base64

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(BASE_DIR, "logo-app.png")

def read_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    pos = 8
    idat = bytearray()
    w, h, depth, ctype = 0, 0, 0, 0
    while pos < len(data):
        length, tag = struct.unpack('>I4s', data[pos:pos+8])
        if tag == b'IHDR':
            w, h, depth, ctype, _, _, _ = struct.unpack('>IIBBBBB', data[pos+8:pos+8+length])
        elif tag == b'IDAT':
            idat.extend(data[pos+8:pos+8+length])
        pos += 8 + length + 4
    compressed = zlib.decompress(idat)
    bpp = 4 if ctype == 6 else 3
    stride = 1 + w * bpp
    img = bytearray(w * h * bpp)
    prev_row = bytearray(w * bpp)
    for y in range(h):
        filter_type = compressed[y * stride]
        row = bytearray(compressed[y * stride + 1 : (y + 1) * stride])
        if filter_type == 1:
            for i in range(bpp, len(row)): row[i] = (row[i] + row[i - bpp]) & 0xff
        elif filter_type == 2:
            for i in range(len(row)): row[i] = (row[i] + prev_row[i]) & 0xff
        elif filter_type == 3:
            for i in range(len(row)): row[i] = (row[i] + ((row[i - bpp] if i >= bpp else 0) + prev_row[i]) // 2) & 0xff
        elif filter_type == 4:
            for i in range(len(row)):
                a = row[i - bpp] if i >= bpp else 0; b = prev_row[i]; c = prev_row[i - bpp] if i >= bpp else 0
                p = a + b - c; pa = abs(p - a); pb = abs(p - b); pc = abs(p - c)
                row[i] = (row[i] + (a if (pa <= pb and pa <= pc) else (b if pb <= pc else c))) & 0xff
        img[y * w * bpp : (y + 1) * w * bpp] = row
        prev_row = row
    return w, h, img

def write_png(path, w, h, rgba_bytes):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    raw = b''.join(b'\x00' + rgba_bytes[y*w*4:(y+1)*w*4] for y in range(h))
    png_data = b'\x89PNG\r\n\x1a\n' + \
               chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + \
               chunk(b'IDAT', zlib.compress(raw, 9)) + \
               chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png_data)

def resize_bilinear(src_img, sw, sh, dw, dh):
    out = bytearray(dw * dh * 4)
    x_ratio = float(sw - 1) / dw if dw > 1 else 0
    y_ratio = float(sh - 1) / dh if dh > 1 else 0

    for i in range(dh):
        src_y = int(y_ratio * i)
        y_diff = (y_ratio * i) - src_y
        next_y = min(src_y + 1, sh - 1)

        for j in range(dw):
            src_x = int(x_ratio * j)
            x_diff = (x_ratio * j) - src_x
            next_x = min(src_x + 1, sw - 1)

            idx_a = (src_y * sw + src_x) * 4
            idx_b = (src_y * sw + next_x) * 4
            idx_c = (next_y * sw + src_x) * 4
            idx_d = (next_y * sw + next_x) * 4

            out_idx = (i * dw + j) * 4
            for c in range(4):
                val = (src_img[idx_a + c] * (1 - x_diff) * (1 - y_diff) +
                       src_img[idx_b + c] * x_diff * (1 - y_diff) +
                       src_img[idx_c + c] * y_diff * (1 - x_diff) +
                       src_img[idx_d + c] * (x_diff * y_diff))
                out[out_idx + c] = min(255, max(0, int(val + 0.5)))
    return out

def composite_on_background(src_img, sw, sh, canvas_size, logo_size, bg_color=(255, 255, 255, 255)):
    # Resize logo
    resized_logo = resize_bilinear(src_img, sw, sh, logo_size, logo_size)
    canvas = bytearray(canvas_size * canvas_size * 4)

    # Fill background
    r_bg, g_bg, b_bg, a_bg = bg_color
    for i in range(canvas_size * canvas_size):
        canvas[i*4] = r_bg
        canvas[i*4 + 1] = g_bg
        canvas[i*4 + 2] = b_bg
        canvas[i*4 + 3] = a_bg

    # Compute center offset
    offset_x = (canvas_size - logo_size) // 2
    offset_y = (canvas_size - logo_size) // 2

    # Alpha blend logo onto canvas
    for y in range(logo_size):
        for x in range(logo_size):
            l_idx = (y * logo_size + x) * 4
            r_fg = resized_logo[l_idx]
            g_fg = resized_logo[l_idx + 1]
            b_fg = resized_logo[l_idx + 2]
            a_fg = resized_logo[l_idx + 3] / 255.0

            if a_fg <= 0:
                continue

            c_idx = ((offset_y + y) * canvas_size + (offset_x + x)) * 4
            if a_bg == 0:
                # Transparent canvas
                canvas[c_idx] = r_fg
                canvas[c_idx + 1] = g_fg
                canvas[c_idx + 2] = b_fg
                canvas[c_idx + 3] = int(a_fg * 255)
            else:
                r_orig = canvas[c_idx]
                g_orig = canvas[c_idx + 1]
                b_orig = canvas[c_idx + 2]

                canvas[c_idx] = int(r_fg * a_fg + r_orig * (1 - a_fg))
                canvas[c_idx + 1] = int(g_fg * a_fg + g_orig * (1 - a_fg))
                canvas[c_idx + 2] = int(b_fg * a_fg + b_orig * (1 - a_fg))
                canvas[c_idx + 3] = 255

    return canvas

def make_ico(ico_path, png_32_path, png_16_path):
    with open(png_32_path, 'rb') as f: png_32 = f.read()
    with open(png_16_path, 'rb') as f: png_16 = f.read()
    header = struct.pack('<HHH', 0, 1, 2)
    offset_1 = 6 + 16 * 2
    entry_1 = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_32), offset_1)
    offset_2 = offset_1 + len(png_32)
    entry_2 = struct.pack('<BBBBHHII', 16, 16, 0, 0, 1, 32, len(png_16), offset_2)
    with open(ico_path, 'wb') as f:
        f.write(header + entry_1 + entry_2 + png_32 + png_16)

def generate_svg(svg_path, logo_png_path):
    with open(logo_png_path, 'rb') as f:
        png_b64 = base64.b64encode(f.read()).decode('ascii')
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- App Background Squircle -->
  <rect width="512" height="512" rx="115" fill="#ffffff" />
  <!-- Embedded High-Quality App Logo -->
  <image href="data:image/png;base64,{png_b64}" x="40" y="40" width="432" height="432" preserveAspectRatio="xMidYMid meet" />
</svg>
'''
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

def main():
    sw, sh, logo_img = read_png(LOGO_PATH)
    print(f"Loaded logo: {sw}x{sh}")

    # App icons for Add to Home Screen (white background for clean squircle on iOS / Android)
    home_screen_icons = [
        ("apple-touch-icon.png", 180, 150),
        ("apple-touch-icon-precomposed.png", 180, 150),
        ("apple-touch-icon-180x180.png", 180, 150),
        ("apple-touch-icon-152x152.png", 152, 126),
        ("apple-touch-icon-120x120.png", 120, 100),
        ("icon-192.png", 192, 160),
        ("icon-512.png", 512, 426),
        ("icon-maskable-192.png", 192, 140), # 80% safe zone for Android adaptive mask
        ("icon-maskable-512.png", 512, 374), # 80% safe zone for Android adaptive mask
    ]

    for filename, c_size, l_size in home_screen_icons:
        target = os.path.join(BASE_DIR, filename)
        canvas = composite_on_background(logo_img, sw, sh, c_size, l_size, bg_color=(255, 255, 255, 255))
        write_png(target, c_size, c_size, canvas)
        print(f"Created {filename} ({c_size}x{c_size})")

    # Browser tab favicons (transparent background so it sits cleanly on browser tab bar)
    tab_favicons = [
        ("favicon-32x32.png", 32, 32),
        ("favicon-16x16.png", 16, 16),
    ]

    for filename, c_size, l_size in tab_favicons:
        target = os.path.join(BASE_DIR, filename)
        canvas = composite_on_background(logo_img, sw, sh, c_size, l_size, bg_color=(0, 0, 0, 0))
        write_png(target, c_size, c_size, canvas)
        print(f"Created {filename} ({c_size}x{c_size})")

    # Generate favicon.ico
    ico_path = os.path.join(BASE_DIR, "favicon.ico")
    f32_path = os.path.join(BASE_DIR, "favicon-32x32.png")
    f16_path = os.path.join(BASE_DIR, "favicon-16x16.png")
    make_ico(ico_path, f32_path, f16_path)
    print("Created favicon.ico")

    # Generate favicon.svg
    svg_path = os.path.join(BASE_DIR, "favicon.svg")
    generate_svg(svg_path, LOGO_PATH)
    print("Created favicon.svg")

if __name__ == "__main__":
    main()
