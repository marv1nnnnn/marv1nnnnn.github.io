"""Make the Chinese type the players are lettered in: static Noto Sans SC (OFL, see OFL.txt) at 500,
700 and 900, cut down to ASCII and the characters the scripts in this folder's parent use, with overlapping
outlines merged (Blender fills overlapping contours wrongly). The system's Noto CJK is a variable
font, which Blender reads as its Thin master with broken fills, so kit.text_mesh uses these instead.

Run after adding Chinese lettering to a script (needs network, fontTools and skia-pathops):
    python3 scripts/blender/repeat/fonts/make.py
"""

import glob
import io
import os
import re
import urllib.parse
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps

HERE = os.path.dirname(os.path.abspath(__file__))
CJK = re.compile(r'[　-〿㐀-鿿＀-￯]')
UA = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0 Safari/537.36'


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()


chars = set()
for path in glob.glob(os.path.join(HERE, '..', '*.py')):
    chars |= set(CJK.findall(open(path, encoding='utf-8').read()))
# with the printable ASCII too: Chinese print mixes in digits and slashes (480秒, 放音/自动)
text = ''.join(sorted(chars | set(chr(c) for c in range(0x21, 0x7f))))
print(len(text), 'characters:', text)

for weight in (500, 700, 900):
    css = fetch(f'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@{weight}&text={urllib.parse.quote(text)}').decode()
    url = re.search(r'url\((https://[^)]+)\)', css).group(1)
    font = TTFont(io.BytesIO(fetch(url)))
    removeOverlaps(font)
    out = os.path.join(HERE, f'NotoSansSC-{weight}.ttf')
    font.save(out)
    print('wrote', out, os.path.getsize(out), 'bytes')
