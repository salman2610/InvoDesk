import os
import subprocess
from PIL import Image

BASE_DIR = os.path.abspath('branding')
LOGOS_DIR = os.path.join(BASE_DIR, 'logos')
ICONS_DIR = os.path.join(BASE_DIR, 'icons')
FAVICONS_DIR = os.path.join(BASE_DIR, 'favicons')
BANNERS_DIR = os.path.join(BASE_DIR, 'banners')
DOCS_DIR = os.path.join(BASE_DIR, 'documentation')

for d in [LOGOS_DIR, ICONS_DIR, FAVICONS_DIR, BANNERS_DIR, DOCS_DIR]:
    os.makedirs(d, exist_ok=True)

# 1. Generate Mark SVG template
def get_mark_svg(primary_color="#166B50", accent_color="#22C55E", dark_color="#172B25", doc_fill="#ffffff", is_mono=False, is_dark=False):
    if is_mono:
        p_col = dark_color
        a_col = dark_color
        d_col = dark_color
        s_col = dark_color
    elif is_dark:
        p_col = "#ffffff"
        a_col = accent_color
        d_col = "#ffffff"
        s_col = accent_color
    else:
        p_col = primary_color
        a_col = accent_color
        d_col = dark_color
        s_col = accent_color

    swoosh_def = f'''
    <linearGradient id="swooshGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{p_col if not is_dark else '#10B981'}" />
      <stop offset="40%" stop-color="{a_col}" />
      <stop offset="100%" stop-color="{a_col}" />
    </linearGradient>
    ''' if not is_mono else ''
    swoosh_fill = 'url(#swooshGrad)' if not is_mono else dark_color

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    {swoosh_def}
  </defs>

  <!-- Document Outline & Body -->
  <path d="M 330 160
           C 270 160, 220 210, 220 270
           L 220 730
           C 220 790, 270 840, 330 840
           L 640 840
           C 700 840, 750 790, 750 730
           L 750 360
           L 550 160
           Z"
        fill="{doc_fill}"
        stroke="{p_col}"
        stroke-width="56"
        stroke-linejoin="round" />

  <!-- Dog-ear fold top-right -->
  <path d="M 550 160
           L 750 360
           L 590 360
           C 568 360, 550 342, 550 320
           Z"
        fill="{a_col}" />

  <!-- Document horizontal lines -->
  <rect x="310" y="300" width="160" height="32" rx="16" fill="{d_col}" />
  <rect x="310" y="380" width="240" height="32" rx="16" fill="{d_col}" />
  <rect x="310" y="460" width="200" height="32" rx="16" fill="{d_col}" />

  <!-- Rising Bar Chart Pillars -->
  <rect x="470" y="650" width="56" height="130" rx="14" fill="{p_col if not is_dark else '#ffffff'}" />
  <rect x="546" y="570" width="56" height="210" rx="14" fill="{p_col if not is_dark else '#ffffff'}" />
  <rect x="622" y="490" width="56" height="290" rx="14" fill="{p_col if not is_dark else '#ffffff'}" />

  <!-- Dynamic Orbit Swoosh Arc -->
  <path d="M 140 690
           C 100 840, 260 950, 460 910
           C 660 870, 820 700, 840 510
           C 844 470, 800 470, 790 510
           C 750 680, 580 820, 390 830
           C 260 836, 170 770, 190 680
           C 196 650, 150 650, 140 690
           Z"
        fill="{swoosh_fill}" />
</svg>'''

# Write standalone mark SVGs
with open(os.path.join(LOGOS_DIR, 'invodesk-mark.svg'), 'w') as f:
    f.write(get_mark_svg())

with open(os.path.join(LOGOS_DIR, 'invodesk-mark-mono.svg'), 'w') as f:
    f.write(get_mark_svg(is_mono=True))

print("Mark SVGs generated")
