import os
import subprocess
import struct

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_PNG = os.path.join(BASE_DIR, "icon-minimal-1024.png")

sizes = [
    ("apple-touch-icon.png", 180, 180),
    ("apple-touch-icon-precomposed.png", 180, 180),
    ("apple-touch-icon-180x180.png", 180, 180),
    ("apple-touch-icon-152x152.png", 152, 152),
    ("apple-touch-icon-120x120.png", 120, 120),
    ("icon-192.png", 192, 192),
    ("icon-512.png", 512, 512),
    ("icon-maskable-192.png", 192, 192),
    ("icon-maskable-512.png", 512, 512),
    ("favicon-32x32.png", 32, 32),
    ("favicon-16x16.png", 16, 16),
]

for filename, w, h in sizes:
    target = os.path.join(BASE_DIR, filename)
    cmd = ["sips", "-z", str(h), str(w), MASTER_PNG, "--out", target]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Created {filename} ({w}x{h})")
    else:
        print(f"Failed {filename}: {res.stderr}")

# Create favicon.ico using 32x32 and 16x16
ico_path = os.path.join(BASE_DIR, "favicon.ico")
f32_path = os.path.join(BASE_DIR, "favicon-32x32.png")
f16_path = os.path.join(BASE_DIR, "favicon-16x16.png")

with open(f32_path, 'rb') as f:
    png_32 = f.read()
with open(f16_path, 'rb') as f:
    png_16 = f.read()

header = struct.pack('<HHH', 0, 1, 2)
offset_1 = 6 + 16 * 2
entry_1 = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_32), offset_1)
offset_2 = offset_1 + len(png_32)
entry_2 = struct.pack('<BBBBHHII', 16, 16, 0, 0, 1, 32, len(png_16), offset_2)

with open(ico_path, 'wb') as f:
    f.write(header + entry_1 + entry_2 + png_32 + png_16)
print("Created favicon.ico")
