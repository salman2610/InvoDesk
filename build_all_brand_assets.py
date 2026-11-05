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

# Helper: Render an SVG file to PNG using google-chrome headless with transparent background
def render_svg_to_png(svg_path, png_path, width, height):
    html_content = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{
    width: {width}px;
    height: {height}px;
    background: transparent;
    overflow: hidden;
  }}
  img {{
    width: {width}px;
    height: {height}px;
    display: block;
  }}
</style>
</head>
<body>
  <img src="file://{svg_path}" width="{width}" height="{height}" />
</body>
</html>'''

    temp_html = svg_path + '.render.html'
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    cmd = [
        'google-chrome',
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--default-background-color=00000000',
        f'--window-size={width},{height}',
        f'--screenshot={png_path}',
        temp_html
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(temp_html):
        os.remove(temp_html)
    print(f"Rendered {png_path} ({width}x{height})")

# 1. MARK SVGs
def create_mark_svg(mode="standard"):
    # mode: "standard", "mono", "dark"
    if mode == "mono":
        p_col = "#172B25"
        a_col = "#172B25"
        d_col = "#172B25"
        s_col = "#172B25"
        doc_fill = "transparent"
        stroke_w = "56"
        swoosh_markup = f'<path d="M 140 700 C 100 850, 260 950, 460 910 C 660 870, 820 700, 840 510 C 844 470, 800 470, 790 510 C 750 680, 580 820, 390 830 C 260 836, 170 770, 190 690 C 196 660, 150 660, 140 700 Z" fill="{s_col}" />'
    elif mode == "dark":
        p_col = "#FFFFFF"
        a_col = "#22C55E"
        d_col = "#FFFFFF"
        s_col = "#22C55E"
        doc_fill = "transparent"
        stroke_w = "56"
        swoosh_markup = f'''
        <defs>
          <linearGradient id="swooshDark" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#166B50" />
            <stop offset="35%" stop-color="#22C55E" />
            <stop offset="100%" stop-color="#4ADE80" />
          </linearGradient>
        </defs>
        <path d="M 140 700 C 100 850, 260 950, 460 910 C 660 870, 820 700, 840 510 C 844 470, 800 470, 790 510 C 750 680, 580 820, 390 830 C 260 836, 170 770, 190 690 C 196 660, 150 660, 140 700 Z" fill="url(#swooshDark)" />
        '''
    else: # standard
        p_col = "#166B50"
        a_col = "#22C55E"
        d_col = "#172B25"
        s_col = "#22C55E"
        doc_fill = "#FFFFFF"
        stroke_w = "56"
        swoosh_markup = f'''
        <defs>
          <linearGradient id="swooshStd" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#166B50" />
            <stop offset="35%" stop-color="#199E6E" />
            <stop offset="100%" stop-color="#22C55E" />
          </linearGradient>
        </defs>
        <path d="M 140 700 C 100 850, 260 950, 460 910 C 660 870, 820 700, 840 510 C 844 470, 800 470, 790 510 C 750 680, 580 820, 390 830 C 260 836, 170 770, 190 690 C 196 660, 150 660, 140 700 Z" fill="url(#swooshStd)" />
        '''

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  {swoosh_markup.split('<path')[0] if '<defs>' in swoosh_markup else ''}
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
        stroke-width="{stroke_w}"
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
  <rect x="470" y="650" width="56" height="130" rx="14" fill="{p_col}" />
  <rect x="546" y="570" width="56" height="210" rx="14" fill="{p_col}" />
  <rect x="622" y="490" width="56" height="290" rx="14" fill="{p_col}" />

  <!-- Orbit Swoosh -->
  {swoosh_markup.split('</defs>')[-1] if '</defs>' in swoosh_markup else swoosh_markup}
</svg>'''

# 2. HORIZONTAL LOGO SVG (2048 x 512)
def create_horizontal_logo_svg(mode="standard", boxed=False):
    # viewBox: 2048 x 512
    bg_box = ""
    if boxed:
        bg_box = '<rect width="2048" height="512" rx="48" fill="#062219" />'

    if mode == "mono":
        t1_col = "#172B25"
        t2_col = "#172B25"
        sub_col = "#172B25"
        rule_col = "#172B25"
        mark_svg_inner = create_mark_svg("mono")
    elif mode == "dark":
        t1_col = "#FFFFFF"
        t2_col = "#22C55E"
        sub_col = "#F5F7F6"
        rule_col = "#22C55E"
        mark_svg_inner = create_mark_svg("dark")
    else: # standard
        t1_col = "#172B25"
        t2_col = "#166B50"
        sub_col = "#172B25"
        rule_col = "#172B25"
        mark_svg_inner = create_mark_svg("standard")

    inner_mark = mark_svg_inner.split('<svg', 1)[1].split('>', 1)[1].rsplit('</svg>', 1)[0]

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 512" width="2048" height="512">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&amp;display=swap');
      .brand-title {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 800;
        font-size: 215px;
        letter-spacing: -3px;
      }}
      .brand-sub {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 700;
        font-size: 30px;
        letter-spacing: 6.5px;
      }}
    </style>
  </defs>

  {bg_box}

  <!-- Left Mark: scale and translate from 1024x1024 to 460x460, placed at x=100, y=26 -->
  <g transform="translate(100, 26) scale(0.45)">
    {inner_mark}
  </g>

  <!-- Brand Typography -->
  <g transform="translate(605, 305)">
    <text class="brand-title">
      <tspan fill="{t1_col}">Invo</tspan><tspan fill="{t2_col}">Desk</tspan>
    </text>
  </g>

  <!-- Tagline & Rules -->
  <!-- Left Rule -->
  <line x1="610" y1="395" x2="710" y2="395" stroke="{rule_col}" stroke-width="4.5" stroke-linecap="round" />

  <!-- Subtitle Text -->
  <text x="735" y="405" class="brand-sub" fill="{sub_col}">GST BILLING &amp; BUSINESS OPERATIONS</text>

  <!-- Right Rule -->
  <line x1="1560" y1="395" x2="1660" y2="395" stroke="{rule_col}" stroke-width="4.5" stroke-linecap="round" />
</svg>'''

# 3. VERTICAL LOGO SVG (1024 x 1024)
def create_vertical_logo_svg(mode="standard"):
    # viewBox: 1024 x 1024
    if mode == "mono":
        t1_col = "#172B25"
        t2_col = "#172B25"
        sub_col = "#172B25"
        rule_col = "#172B25"
        mark_svg_inner = create_mark_svg("mono")
    elif mode == "dark":
        t1_col = "#FFFFFF"
        t2_col = "#22C55E"
        sub_col = "#F5F7F6"
        rule_col = "#22C55E"
        mark_svg_inner = create_mark_svg("dark")
    else: # standard
        t1_col = "#172B25"
        t2_col = "#166B50"
        sub_col = "#172B25"
        rule_col = "#172B25"
        mark_svg_inner = create_mark_svg("standard")

    inner_mark = mark_svg_inner.split('<svg', 1)[1].split('>', 1)[1].rsplit('</svg>', 1)[0]

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&amp;display=swap');
      .vert-title {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 800;
        font-size: 155px;
        letter-spacing: -2px;
        text-anchor: middle;
      }}
      .vert-sub {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 700;
        font-size: 23px;
        letter-spacing: 5px;
        text-anchor: middle;
      }}
    </style>
  </defs>

  <!-- Top Mark: centered, scaled from 1024 to 550 -->
  <g transform="translate(237, 50) scale(0.54)">
    {inner_mark}
  </g>

  <!-- Title -->
  <text x="512" y="730" class="vert-title">
    <tspan fill="{t1_col}">Invo</tspan><tspan fill="{t2_col}">Desk</tspan>
  </text>

  <!-- Subtitle -->
  <text x="512" y="805" class="vert-sub" fill="{sub_col}">GST BILLING &amp; BUSINESS OPERATIONS</text>
</svg>'''

# 4. SQUIRCLE APP ICON SVG (1024x1024)
def create_app_icon_svg():
    mark_svg_inner = create_mark_svg("dark")
    inner_mark = mark_svg_inner.split('<svg', 1)[1].split('>', 1)[1].rsplit('</svg>', 1)[0]

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#166B50" />
      <stop offset="50%" stop-color="#11553F" />
      <stop offset="100%" stop-color="#093526" />
    </linearGradient>
    <radialGradient id="iconGlow" cx="50%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#22C55E" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#22C55E" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Rounded Squircle Base -->
  <rect x="24" y="24" width="976" height="976" rx="224" fill="url(#iconBg)" stroke="#22C55E" stroke-opacity="0.3" stroke-width="4" />
  <rect x="24" y="24" width="976" height="976" rx="224" fill="url(#iconGlow)" />

  <!-- Centered InvoDesk Mark -->
  <g transform="translate(192, 192) scale(0.625)">
    {inner_mark}
  </g>
</svg>'''

# 5. BRAND BANNER SVG (1920x640)
def create_brand_banner_svg():
    dark_logo_svg = create_horizontal_logo_svg("dark")
    inner_logo = dark_logo_svg.split('<svg', 1)[1].split('>', 1)[1].rsplit('</svg>', 1)[0]

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 640" width="1920" height="640">
  <defs>
    <linearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#062219" />
      <stop offset="40%" stop-color="#0E3D2F" />
      <stop offset="85%" stop-color="#166B50" />
      <stop offset="100%" stop-color="#125640" />
    </linearGradient>
    <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22C55E" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#10B981" stop-opacity="0.04" />
    </linearGradient>
    <linearGradient id="wave2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#166B50" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#22C55E" stop-opacity="0.18" />
    </linearGradient>
  </defs>

  <!-- Banner Background -->
  <rect width="1920" height="640" fill="url(#bannerBg)" rx="24" />

  <!-- Ambient Wave Ribbons -->
  <path d="M 0 450 C 400 350, 700 550, 1100 420 C 1500 290, 1750 380, 1920 320 L 1920 640 L 0 640 Z" fill="url(#wave1)" />
  <path d="M 0 540 C 350 480, 650 620, 1050 500 C 1450 380, 1680 490, 1920 440 L 1920 640 L 0 640 Z" fill="url(#wave2)" />

  <!-- Left: InvoDesk Horizontal Brand Logo -->
  <g transform="translate(20, 120) scale(0.64)">
    {inner_logo}
  </g>

  <!-- Right: Sleek Retail POS Hardware Line Illustrations -->
  <!-- 1. Thermal Receipt Printer -->
  <g transform="translate(1180, 390)" stroke="#E2E8F0" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round">
    <!-- Printer Base Body -->
    <rect x="0" y="50" width="160" height="110" rx="12" fill="#0E3D2F" fill-opacity="0.7" stroke="#22C55E" stroke-width="3" />
    <!-- Paper Feed Slot -->
    <line x1="30" y1="50" x2="130" y2="50" stroke="#FFFFFF" stroke-width="6" />
    <!-- Paper Receipt Coming Out -->
    <path d="M 35 50 L 35 0 C 35 -15, 125 -15, 125 0 L 125 50" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="3" />
    <!-- Receipt Lines -->
    <line x1="50" y1="12" x2="110" y2="12" stroke="#172B25" stroke-width="3" />
    <line x1="50" y1="24" x2="100" y2="24" stroke="#172B25" stroke-width="3" />
    <line x1="50" y1="36" x2="110" y2="36" stroke="#172B25" stroke-width="3" />
    <!-- LED Status Light -->
    <circle cx="135" cy="80" r="4" fill="#22C55E" />
  </g>

  <!-- 2. POS Terminal Monitor with Shopping Cart -->
  <g transform="translate(1380, 150)" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round">
    <!-- Monitor Bezel -->
    <rect x="0" y="0" width="310" height="220" rx="18" fill="#0B2C21" fill-opacity="0.8" stroke="#FFFFFF" stroke-width="5" />
    <!-- Stand -->
    <path d="M 125 220 L 110 310 L 200 310 L 185 220" stroke="#FFFFFF" stroke-width="5" fill="#0E3D2F" />
    <rect x="80" y="310" width="150" height="16" rx="6" fill="#FFFFFF" />

    <!-- Shopping Cart Icon on Monitor Screen -->
    <g transform="translate(95, 45)" stroke="#22C55E" stroke-width="5" fill="none">
      <path d="M 0 10 L 22 10 L 40 75 L 105 75 L 120 25 L 28 25" />
      <circle cx="48" cy="95" r="9" fill="#22C55E" />
      <circle cx="98" cy="95" r="9" fill="#22C55E" />
      <line x1="50" y1="42" x2="100" y2="42" stroke="#22C55E" stroke-width="3" />
      <line x1="55" y1="58" x2="95" y2="58" stroke="#22C55E" stroke-width="3" />
    </g>
  </g>

  <!-- 3. Handheld Barcode Scanner Pistol -->
  <g transform="translate(1720, 310)" stroke="#FFFFFF" stroke-width="4.5" fill="none" stroke-linejoin="round" stroke-linecap="round">
    <!-- Scanner Head -->
    <path d="M 20 0 L 70 0 C 85 0, 95 15, 95 35 C 95 55, 85 70, 70 70 L 20 70 C 5 70, -5 55, -5 35 C -5 15, 5 0, 20 0 Z" fill="#0E3D2F" stroke="#22C55E" stroke-width="4" />
    <!-- Scanner Window Lens -->
    <ellipse cx="8" cy="35" rx="5" ry="22" fill="#22C55E" stroke="#FFFFFF" stroke-width="3" />
    <!-- Scanner Handle -->
    <path d="M 45 70 L 30 150 C 28 162, 38 172, 50 172 C 60 172, 70 162, 68 150 L 75 70" fill="#0B2C21" stroke="#FFFFFF" stroke-width="4" />
    <!-- Scanner Trigger -->
    <path d="M 33 90 C 20 90, 20 110, 30 110" stroke="#22C55E" stroke-width="4" />
  </g>
</svg>'''

print("Writing SVGs...")

# 1. Logos
svg_files = {
    os.path.join(LOGOS_DIR, 'invodesk-mark.svg'): create_mark_svg("standard"),
    os.path.join(LOGOS_DIR, 'invodesk-mark-mono.svg'): create_mark_svg("mono"),
    os.path.join(LOGOS_DIR, 'invodesk-logo-horizontal.svg'): create_horizontal_logo_svg("standard"),
    os.path.join(LOGOS_DIR, 'invodesk-logo-vertical.svg'): create_vertical_logo_svg("standard"),
    os.path.join(LOGOS_DIR, 'invodesk-logo-dark.svg'): create_horizontal_logo_svg("dark"),
    os.path.join(LOGOS_DIR, 'invodesk-logo-dark-boxed.svg'): create_horizontal_logo_svg("dark", boxed=True),
    os.path.join(LOGOS_DIR, 'invodesk-logo-monochrome.svg'): create_horizontal_logo_svg("mono"),
    os.path.join(ICONS_DIR, 'app-icon.svg'): create_app_icon_svg(),
    os.path.join(BANNERS_DIR, 'invodesk-banner.svg'): create_brand_banner_svg(),
}

for path, content in svg_files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Saved SVG: {path}")

# Render Master PNGs
png_targets = [
    # Logos
    (os.path.join(LOGOS_DIR, 'invodesk-mark.svg'), os.path.join(LOGOS_DIR, 'invodesk-mark.png'), 1024, 1024),
    (os.path.join(LOGOS_DIR, 'invodesk-mark-mono.svg'), os.path.join(LOGOS_DIR, 'invodesk-mark-mono.png'), 1024, 1024),
    (os.path.join(LOGOS_DIR, 'invodesk-logo-horizontal.svg'), os.path.join(LOGOS_DIR, 'invodesk-logo-horizontal.png'), 2048, 512),
    (os.path.join(LOGOS_DIR, 'invodesk-logo-vertical.svg'), os.path.join(LOGOS_DIR, 'invodesk-logo-vertical.png'), 1024, 1024),
    (os.path.join(LOGOS_DIR, 'invodesk-logo-dark.svg'), os.path.join(LOGOS_DIR, 'invodesk-logo-dark.png'), 2048, 512),
    (os.path.join(LOGOS_DIR, 'invodesk-logo-dark-boxed.svg'), os.path.join(LOGOS_DIR, 'invodesk-logo-dark-boxed.png'), 2048, 512),
    (os.path.join(LOGOS_DIR, 'invodesk-logo-monochrome.svg'), os.path.join(LOGOS_DIR, 'invodesk-logo-monochrome.png'), 2048, 512),
    # Banner
    (os.path.join(BANNERS_DIR, 'invodesk-banner.svg'), os.path.join(BANNERS_DIR, 'invodesk-banner-1920x640.png'), 1920, 640),
    # App Icon master
    (os.path.join(ICONS_DIR, 'app-icon.svg'), os.path.join(ICONS_DIR, 'app-icon-1024.png'), 1024, 1024)
]

for svg_p, png_p, w, h in png_targets:
    render_svg_to_png(svg_p, png_p, w, h)

# Generate Desktop App Icons from 1024x1024
master_icon = Image.open(os.path.join(ICONS_DIR, 'app-icon-1024.png'))
icon_sizes = [512, 256, 128, 64, 48, 32, 16]
for s in icon_sizes:
    resized = master_icon.resize((s, s), Image.Resampling.LANCZOS)
    resized.save(os.path.join(ICONS_DIR, f'app-icon-{s}.png'), optimize=True)
    print(f"Saved app-icon-{s}.png")

# Generate Windows ICO (containing 256, 128, 64, 48, 32, 16)
master_icon.save(
    os.path.join(ICONS_DIR, 'icon.ico'),
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
)
print("Saved Windows icon.ico")

# Generate macOS ICNS
try:
    master_icon.save(os.path.join(ICONS_DIR, 'icon.icns'), format='ICNS')
    print("Saved macOS icon.icns")
except Exception as e:
    print("ICNS creation note:", e)

# Linux desktop file
desktop_entry = '''[Desktop Entry]
Name=InvoDesk POS
Comment=InvoDesk Native Retail POS Counter & Business Operations
Exec=invodesk-pos %U
Terminal=false
Type=Application
Icon=invodesk-pos
StartupWMClass=invodesk-pos
Categories=Office;Finance;
'''
with open(os.path.join(ICONS_DIR, 'invodesk-pos.desktop'), 'w') as f:
    f.write(desktop_entry)

# Copy Linux icons
shutil_copy = Image.open(os.path.join(ICONS_DIR, 'app-icon-512.png'))
shutil_copy.save(os.path.join(ICONS_DIR, 'invodesk-pos.png'))

# Generate Web Favicons & PWA
master_mark = Image.open(os.path.join(LOGOS_DIR, 'invodesk-mark.png'))
favicon_sizes = [16, 32, 48]
for s in favicon_sizes:
    res = master_mark.resize((s, s), Image.Resampling.LANCZOS)
    res.save(os.path.join(FAVICONS_DIR, f'favicon-{s}x{s}.png'), optimize=True)

# favicon.ico (16, 32, 48)
master_mark.save(
    os.path.join(FAVICONS_DIR, 'favicon.ico'),
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48)]
)

# apple-touch-icon.png (180x180)
apple_touch = master_icon.resize((180, 180), Image.Resampling.LANCZOS)
apple_touch.save(os.path.join(FAVICONS_DIR, 'apple-touch-icon.png'), optimize=True)

# android-chrome-192x192.png
android_192 = master_icon.resize((192, 192), Image.Resampling.LANCZOS)
android_192.save(os.path.join(FAVICONS_DIR, 'android-chrome-192x192.png'), optimize=True)

# android-chrome-512x512.png
android_512 = master_icon.resize((512, 512), Image.Resampling.LANCZOS)
android_512.save(os.path.join(FAVICONS_DIR, 'android-chrome-512x512.png'), optimize=True)

# site.webmanifest
manifest = '''{
  "name": "InvoDesk POS & GST Billing",
  "short_name": "InvoDesk",
  "description": "Cross-platform GST Billing, Retail POS & Business Operations Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F7F6",
  "theme_color": "#166B50",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
'''
with open(os.path.join(FAVICONS_DIR, 'site.webmanifest'), 'w') as f:
    f.write(manifest)

print("Brand Asset Generation Completed Successfully!")
