"""Generate devmeet's pixel heart app icons using only the Python standard library."""
from pathlib import Path
import struct
import zlib

OUT = Path(__file__).resolve().parents[1] / 'public'
HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']
BG = (30, 31, 34)
POINT = (57, 255, 20)  # 메인 포인트 컬러 #39ff14

def write_icon(name, size):
    cell = size // 12
    left = (size - 7 * cell) // 2
    top = (size - 6 * cell) // 2
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            col, line = (x - left) // cell, (y - top) // cell
            filled = 0 <= line < 6 and 0 <= col < 7 and HEART[line][col] == '1'
            row.extend(POINT if filled else BG)
        rows.append(row)
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(b''.join(rows))) + chunk(b'IEND', b'')
    (OUT / 'icons' / name).write_bytes(png)

for filename, size in [('icon-192.png', 192), ('icon-512.png', 512), ('maskable-512.png', 512), ('apple-touch-icon.png', 180)]:
    write_icon(filename, size)
rects = ''.join(f'<rect x="{x + 2}" y="{y + 2}" width="1" height="1"/>'
                for y, row in enumerate(HEART) for x, value in enumerate(row) if value == '1')
(OUT / 'favicon.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 10"><rect width="11" height="10" rx="2" fill="#1e1f22"/><g fill="#39ff14">{rects}</g></svg>\n')
