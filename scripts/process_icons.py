import zlib
import struct
import subprocess
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PNG = os.path.join(BASE_DIR, "icon-master.png")
OUT_MASTER = os.path.join(BASE_DIR, "icon-fullbleed-1024.png")

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
            for i in range(bpp, len(row)):
                row[i] = (row[i] + row[i - bpp]) & 0xff
        elif filter_type == 2:
            for i in range(len(row)):
                row[i] = (row[i] + prev_row[i]) & 0xff
        elif filter_type == 3:
            for i in range(len(row)):
                a = row[i - bpp] if i >= bpp else 0
                b = prev_row[i]
                row[i] = (row[i] + ((a + b) // 2)) & 0xff
        elif filter_type == 4:
            for i in range(len(row)):
                a = row[i - bpp] if i >= bpp else 0
                b = prev_row[i]
                c = prev_row[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                row[i] = (row[i] + pr) & 0xff
        img[y * w * bpp : (y + 1) * w * bpp] = row
        prev_row = row

    return w, h, bpp, img

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

def generate_fullbleed():
    w, h, bpp, img = read_png(SRC_PNG)
    print(f"Loaded {SRC_PNG}: {w}x{h}, bpp={bpp}")

    out = bytearray(w * h * 4)

    # Let's inspect each pixel.
    # The squircle is centered around cx=511, cy=520, radius ~ 365
    # The grid background has r > 190 and b - r < 20.
    # Let's build a smooth gradient function for the blue background across the canvas:
    # At top: (32, 98, 235), at bottom: (38, 42, 168)
    for y in range(h):
        t = y / (h - 1)
        # Background gradient
        bg_r = int(30 * (1 - t) + 38 * t)
        bg_g = int(98 * (1 - t) + 40 * t)
        bg_b = int(238 * (1 - t) + 168 * t)

        for x in range(w):
            idx = (y * w + x) * bpp
            r, g, b = img[idx], img[idx+1], img[idx+2]

            # Detect if pixel is outside the squircle (background grid)
            # Background grid is light grayish (r > 190 and abs(r - g) < 20 and abs(g - b) < 20)
            # Or low saturation (max(r, g, b) - min(r, g, b) < 25 and r > 180)
            is_grid = (max(r, g, b) - min(r, g, b) < 28 and r > 175) or (b < 140 and r > 160)

            out_idx = (y * w + x) * 4
            if is_grid:
                out[out_idx] = bg_r
                out[out_idx+1] = bg_g
                out[out_idx+2] = bg_b
                out[out_idx+3] = 255
            else:
                # Inside squircle or emblem
                out[out_idx] = r
                out[out_idx+1] = g
                out[out_idx+2] = b
                out[out_idx+3] = 255

    write_png(OUT_MASTER, w, h, out)
    print(f"Generated full-bleed master icon: {OUT_MASTER}")

def create_ico(ico_path, png_32_path, png_16_path):
    with open(png_32_path, 'rb') as f:
        png_32 = f.read()
    with open(png_16_path, 'rb') as f:
        png_16 = f.read()

    # ICO header: 2 bytes reserved (0), 2 bytes type (1 = icon), 2 bytes count (2)
    header = struct.pack('<HHH', 0, 1, 2)
    
    offset_1 = 6 + 16 * 2
    entry_1 = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_32), offset_1)
    
    offset_2 = offset_1 + len(png_32)
    entry_2 = struct.pack('<BBBBHHII', 16, 16, 0, 0, 1, 32, len(png_16), offset_2)

    with open(ico_path, 'wb') as f:
        f.write(header + entry_1 + entry_2 + png_32 + png_16)
    print(f"Generated ICO: {ico_path}")

if __name__ == "__main__":
    generate_fullbleed()
