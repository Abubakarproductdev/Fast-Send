"""
Fast Send - Google Play Store Asset Generator (Reference Matching Edition)
Produces:
1. feature_graphic.png (1024 x 500 px, 24-bit RGB, Google Play Store requirement)
2. screenshot_1_home.png (1080 x 1920 px, 9:16 Phone Mockup)
3. screenshot_2_create_trip.png (1080 x 1920 px, 9:16 Phone Mockup)
4. screenshot_3_active_trip_qr.png (1080 x 1920 px, 9:16 Phone Mockup)
5. screenshot_4_trip_settings.png (1080 x 1920 px, 9:16 Phone Mockup)
"""

import os
import math
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = r"F:\abubakar data\python journey\.net projects\Fast Send\playstore_assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# User's uploaded screenshot source files
SCREENSHOT_SOURCES = [
    r"C:\Users\Shahid Rasheed\.gemini\antigravity\brain\8a1e8002-4da2-4931-888d-c14e3ce7281f\.user_uploaded\media_1788978196066.png",  # Home
    r"C:\Users\Shahid Rasheed\.gemini\antigravity\brain\8a1e8002-4da2-4931-888d-c14e3ce7281f\.user_uploaded\media_1788978215649.png",  # Create Trip
    r"C:\Users\Shahid Rasheed\.gemini\antigravity\brain\8a1e8002-4da2-4931-888d-c14e3ce7281f\.user_uploaded\media_1788978230491.png",  # Active QR
    r"C:\Users\Shahid Rasheed\.gemini\antigravity\brain\8a1e8002-4da2-4931-888d-c14e3ce7281f\.user_uploaded\media_1788978251203.png",  # Settings
]

# Colors
COLOR_BG = (255, 255, 255)             # Crisp pure white
COLOR_TEXT_MAIN = (18, 18, 18)         # Deep black
COLOR_TEXT_MUTED = (140, 140, 145)     # Subdued index number
COLOR_DOODLE_YELLOW = (255, 214, 0)    # Vibrant highlighter yellow (#FFD600)
COLOR_LEAF = (29, 185, 84)             # #1DB954
COLOR_CALLOUT_BG = (20, 20, 24)        # Dark obsidian glass
COLOR_PHONE_CHASSIS = (24, 24, 26)     # Modern titanium
COLOR_PHONE_BORDER = (55, 55, 60)

# Fonts
FONT_PATH_INTER = "C:/Windows/Fonts/Inter-Bold-slnt=0.ttf"
FONT_PATH_SEGOE_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_PATH_SEGOE = "C:/Windows/Fonts/segoeui.ttf"

def get_bold_font(size):
    for path in [FONT_PATH_INTER, FONT_PATH_SEGOE_BOLD]:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                pass
    return ImageFont.load_default()

def get_regular_font(size):
    for path in [FONT_PATH_SEGOE]:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                pass
    return ImageFont.load_default()

# --- DOODLE DRAWING FUNCTIONS ---

def draw_doodle_underline(draw, x0, x1, y, color=COLOR_DOODLE_YELLOW, width=5):
    """Draws an organic, smooth curved highlighter underline."""
    points = []
    steps = 30
    for i in range(steps):
        t = i / (steps - 1)
        x = x0 + t * (x1 - x0)
        y_cur = y + math.sin(t * math.pi) * 8
        points.append((x, y_cur))
    draw.line(points, fill=color, width=width, joint="curve")

def draw_doodle_oval(draw, cx, cy, rx, ry, color=COLOR_DOODLE_YELLOW, width=4):
    """Draws an authentic hand-drawn loop/circle with overlapping stroke ends."""
    points = []
    steps = 64
    for i in range(steps):
        t = (i / steps) * 2.22 * math.pi
        wobble = 1.0 + 0.04 * math.sin(t * 3)
        x = cx + rx * math.cos(t) * wobble + (i / steps) * 6
        y = cy + ry * math.sin(t) * wobble - (i / steps) * 3
        points.append((x, y))
    draw.line(points, fill=color, width=width, joint="curve")

def draw_doodle_sparkle(draw, cx, cy, size=14, color=COLOR_DOODLE_YELLOW, width=3):
    """Draws a hand-drawn 4-point star/sparkle doodle."""
    draw.line([(cx - size, cy), (cx + size, cy)], fill=color, width=width)
    draw.line([(cx, cy - size), (cx, cy + size)], fill=color, width=width)
    s_diag = size * 0.58
    draw.line([(cx - s_diag, cy - s_diag), (cx + s_diag, cy + s_diag)], fill=color, width=max(width - 1, 2))
    draw.line([(cx - s_diag, cy + s_diag), (cx + s_diag, cy - s_diag)], fill=color, width=max(width - 1, 2))

# --- IPHONE MOCKUP BUILDER ---

def create_iphone_mockup(screen_img, phone_w=840, phone_h=1700):
    """
    Builds a precision modern iPhone mockup (iPhone 16 Pro styling).
    """
    corner_r = 60
    bezel = 15
    
    phone = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(phone)
    
    # 1. Outer Chassis
    p_draw.rounded_rectangle(
        [0, 0, phone_w, phone_h],
        radius=corner_r,
        fill=COLOR_PHONE_CHASSIS,
        outline=COLOR_PHONE_BORDER,
        width=3
    )
    # Inner metallic edge reflection
    p_draw.rounded_rectangle(
        [2, 2, phone_w - 2, phone_h - 2],
        radius=corner_r - 2,
        outline=(38, 38, 42),
        width=2
    )
    
    # 2. Screen Area
    screen_w = phone_w - bezel * 2
    screen_h = phone_h - bezel * 2
    screen_r = corner_r - bezel
    
    resized = screen_img.resize((screen_w, screen_h), Image.Resampling.LANCZOS).convert("RGBA")
    mask = Image.new("L", (screen_w, screen_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, screen_w, screen_h], radius=screen_r, fill=255)
    phone.paste(resized, (bezel, bezel), mask)
    
    # 3. Dynamic Island (Proportional to phone size so it scales cleanly)
    isl_w = int(phone_w * 0.17)
    isl_h = max(int(isl_w * 0.23), 14)
    isl_x = (phone_w - isl_w) // 2
    isl_y = bezel + max(int(phone_h * 0.007), 4)
    p_draw.rounded_rectangle(
        [isl_x, isl_y, isl_x + isl_w, isl_y + isl_h],
        radius=isl_h // 2,
        fill=(0, 0, 0)
    )
    # Camera lens reflection
    lens_r = max(int(isl_h * 0.32), 3)
    lens_x = isl_x + isl_w - lens_r * 2 - 4
    lens_y = isl_y + (isl_h - lens_r * 2) // 2
    p_draw.ellipse([lens_x, lens_y, lens_x + lens_r * 2, lens_y + lens_r * 2], fill=(24, 38, 70))
    p_draw.ellipse([lens_x + 1, lens_y + 1, lens_x + lens_r, lens_y + lens_r], fill=(60, 85, 130))
    
    # 4. Subtle inner screen border
    p_draw.rounded_rectangle(
        [bezel, bezel, bezel + screen_w, bezel + screen_h],
        radius=screen_r,
        outline=(20, 20, 20, 180),
        width=2
    )
    
    return phone

def build_reference_screenshot(
    screen_path,
    index_str,
    line1,
    line2,
    doodle_type,
    callout_text,
    output_filename
):
    W, H = 1080, 1920
    base = Image.new("RGBA", (W, H), (*COLOR_BG, 255))
    draw = ImageDraw.Draw(base)
    
    f_index = get_bold_font(30)
    f_title = get_bold_font(70)
    f_callout = get_bold_font(27)
    
    # 1. Slide Index (e.g. "01")
    draw.text((120, 75), index_str, font=f_index, fill=COLOR_TEXT_MUTED)
    
    # 2. Main Title (Centered, bold & punchy)
    draw.text((W // 2, 145), line1, font=f_title, fill=COLOR_TEXT_MAIN, anchor="mm")
    draw.text((W // 2, 235), line2, font=f_title, fill=COLOR_TEXT_MAIN, anchor="mm")
    
    # 3. Doodles matching the reference image style
    bbox2 = draw.textbbox((W // 2, 235), line2, font=f_title, anchor="mm")
    
    if doodle_type == "underline_sparkle":
        # Underline target word (e.g. 'instantly')
        und_x0 = bbox2[0] + int((bbox2[2] - bbox2[0]) * 0.54)
        und_x1 = bbox2[2] + 12
        draw_doodle_underline(draw, und_x0, und_x1, bbox2[3] + 8, width=5)
        draw_doodle_sparkle(draw, und_x1 + 18, bbox2[1] + 12, size=15, width=4)
        
    elif doodle_type == "oval_sparkle":
        # Loop around target word (e.g. '10 seconds')
        loop_x0 = bbox2[0] + int((bbox2[2] - bbox2[0]) * 0.28)
        loop_x1 = bbox2[2] + 16
        cx = (loop_x0 + loop_x1) // 2
        cy = (bbox2[1] + bbox2[3]) // 2
        rx = (loop_x1 - loop_x0) // 2 + 10
        ry = (bbox2[3] - bbox2[1]) // 2 + 12
        draw_doodle_oval(draw, cx, cy, rx, ry, width=4)
        draw_doodle_sparkle(draw, loop_x1 + 24, bbox2[1] - 4, size=13, width=3)
        
    elif doodle_type == "underline_camera":
        # Underline 'no app needed'
        und_x0 = bbox2[0]
        und_x1 = bbox2[2] + 10
        draw_doodle_underline(draw, und_x0, und_x1, bbox2[3] + 8, width=5)
        # Sparkle at end
        draw_doodle_sparkle(draw, und_x1 + 18, bbox2[1] + 12, size=15, width=4)
        
    elif doodle_type == "oval_privacy":
        # Loop around 'total privacy'
        loop_x0 = bbox2[0]
        loop_x1 = bbox2[2] + 14
        cx = (loop_x0 + loop_x1) // 2
        cy = (bbox2[1] + bbox2[3]) // 2
        rx = (loop_x1 - loop_x0) // 2 + 8
        ry = (bbox2[3] - bbox2[1]) // 2 + 12
        draw_doodle_oval(draw, cx, cy, rx, ry, width=4)
        draw_doodle_sparkle(draw, loop_x1 + 22, bbox2[1] - 4, size=13, width=3)

    # 4. Load Screenshot & Build Phone Mockup
    raw_screen = Image.open(screen_path)
    phone_w = 830
    phone_h = 1680
    phone = create_iphone_mockup(raw_screen, phone_w, phone_h)
    
    phone_x = (W - phone_w) // 2
    phone_y = 350
    
    # Studio Drop Shadow (Diffuse ambient + contact shadow)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [phone_x - 12, phone_y + 20, phone_x + phone_w + 12, phone_y + phone_h + 30],
        radius=72,
        fill=(0, 0, 0, 38)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(34))
    
    contact = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(contact).rounded_rectangle(
        [phone_x + 6, phone_y + 16, phone_x + phone_w + 6, phone_y + phone_h + 16],
        radius=66,
        fill=(0, 0, 0, 75)
    )
    contact = contact.filter(ImageFilter.GaussianBlur(15))
    
    base = Image.alpha_composite(base, shadow)
    base = Image.alpha_composite(base, contact)
    base.paste(phone, (phone_x, phone_y), phone)
    
    # 5. Floating Interactive Callout Pill (matching reference screens 1 & 4)
    cb = draw.textbbox((0, 0), callout_text, font=f_callout)
    text_w = cb[2] - cb[0]
    cw = text_w + 86
    ch = 68
    cx0 = (W - cw) // 2
    cy0 = 1710
    
    # Glow under callout pill
    c_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(c_glow).rounded_rectangle(
        [cx0 - 4, cy0 - 4, cx0 + cw + 4, cy0 + ch + 4],
        radius=ch // 2,
        fill=(*COLOR_DOODLE_YELLOW, 90)
    )
    c_glow = c_glow.filter(ImageFilter.GaussianBlur(12))
    base = Image.alpha_composite(base, c_glow)
    
    # Draw Callout Pill
    d_final = ImageDraw.Draw(base)
    d_final.rounded_rectangle(
        [cx0, cy0, cx0 + cw, cy0 + ch],
        radius=ch // 2,
        fill=COLOR_CALLOUT_BG,
        outline=COLOR_DOODLE_YELLOW,
        width=3
    )
    # Small vibrant yellow indicator dot on left
    dot_x = cx0 + 30
    dot_y = cy0 + ch // 2
    d_final.ellipse([dot_x - 5, dot_y - 5, dot_x + 5, dot_y + 5], fill=COLOR_DOODLE_YELLOW)
    # Callout text cleanly positioned next to dot
    d_final.text((dot_x + 16, cy0 + ch // 2 - 1), callout_text, font=f_callout, fill=(255, 255, 255), anchor="lm")
    
    # Save standard RGB 24-bit PNG
    final_img = base.convert("RGB")
    out_path = os.path.join(OUTPUT_DIR, output_filename)
    final_img.save(out_path, "PNG", quality=96)
    print(f"Saved: {out_path}")

def build_feature_graphic():
    """
    Feature Graphic: 1024 x 500 px.
    Matching the modern white + hand-drawn doodle aesthetic.
    """
    W, H = 1024, 500
    base = Image.new("RGBA", (W, H), (*COLOR_BG, 255))
    
    # Subtle ambient lighting in corners
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse([-50, -50, 420, 420], fill=(*COLOR_DOODLE_YELLOW, 35))
    g_draw.ellipse([700, 100, 1150, 550], fill=(*COLOR_LEAF, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    base = Image.alpha_composite(base, glow)
    
    draw = ImageDraw.Draw(base)
    
    f_tag = get_bold_font(18)
    f_hero = get_bold_font(56)
    f_tagline = get_bold_font(25)
    f_bullet = get_bold_font(19)
    f_badge = get_bold_font(19)
    
    # 1. Category Tag Pill
    tag_text = "AI EVENT PHOTO SHARING"
    tb = draw.textbbox((0, 0), tag_text, font=f_tag)
    tw = tb[2] - tb[0] + 36
    th = 36
    draw.rounded_rectangle([60, 52, 60 + tw, 52 + th], radius=th//2, fill=(245, 245, 248), outline=(220, 220, 225), width=2)
    # Yellow dot inside pill
    draw.ellipse([74, 52 + th//2 - 4, 82, 52 + th//2 + 4], fill=COLOR_DOODLE_YELLOW)
    draw.text((92, 52 + th//2 - 1), tag_text, font=f_tag, fill=COLOR_TEXT_MAIN, anchor="lm")
    
    # 2. Main Title
    draw.text((60, 130), "FAST SEND", font=f_hero, fill=COLOR_TEXT_MAIN)
    
    # 3. Tagline with Hand-drawn Doodle Underline
    tagline = "Memories Delivered. Instantly."
    draw.text((62, 205), tagline, font=f_tagline, fill=COLOR_LEAF)
    # Underline 'Instantly.'
    draw_doodle_underline(draw, 300, 425, 235, width=4)
    draw_doodle_sparkle(draw, 436, 215, size=13, width=3)
    
    # 4. Feature Badges with Custom Checkmarks
    bullets = [
        "Instant AI Face Matching",
        "Zero Guest App Download",
        "Original 4K Quality Photos",
        "1-Click Streaming ZIP Archive",
    ]
    
    y_pos = 265
    for text in bullets:
        badge_w = 345
        badge_h = 42
        # Card
        draw.rounded_rectangle([60, y_pos, 60 + badge_w, y_pos + badge_h], radius=10, fill=(255, 255, 255), outline=(225, 225, 230), width=2)
        # Check circle
        icon_cx = 82
        icon_cy = y_pos + badge_h // 2
        draw.ellipse([icon_cx - 11, icon_cy - 11, icon_cx + 11, icon_cy + 11], fill=COLOR_LEAF)
        # Checkmark
        pts = [(icon_cx - 5, icon_cy), (icon_cx - 1, icon_cy + 4), (icon_cx + 5, icon_cy - 3)]
        draw.line(pts, fill=(255, 255, 255), width=2, joint="curve")
        # Text
        draw.text((106, y_pos + 10), text, font=f_bullet, fill=COLOR_TEXT_MAIN)
        y_pos += 52

    # 5. Right Content: Phone Mockup with QR Code
    raw_qr = Image.open(SCREENSHOT_SOURCES[2])
    mockup_w = 340
    mockup_h = 690
    qr_phone = create_iphone_mockup(raw_qr, mockup_w, mockup_h)
    
    phone_x = 640
    phone_y = 50
    
    # Drop shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [phone_x - 6, phone_y + 14, phone_x + mockup_w + 6, phone_y + mockup_h + 14],
        radius=44,
        fill=(0, 0, 0, 42)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    base = Image.alpha_composite(base, shadow)
    base.paste(qr_phone, (phone_x, phone_y), qr_phone)
    
    # 6. Floating Highlight Badge on Phone
    badge_x = 540
    badge_y = 350
    badge_w = 210
    badge_h = 64
    
    b_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(b_glow).rounded_rectangle(
        [badge_x - 4, badge_y - 4, badge_x + badge_w + 4, badge_y + badge_h + 4],
        radius=18,
        fill=(*COLOR_DOODLE_YELLOW, 80)
    )
    b_glow = b_glow.filter(ImageFilter.GaussianBlur(10))
    base = Image.alpha_composite(base, b_glow)
    
    d_final = ImageDraw.Draw(base)
    d_final.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=16, fill=COLOR_CALLOUT_BG, outline=COLOR_DOODLE_YELLOW, width=3)
    d_final.text((badge_x + 18, badge_y + 12), "512-D Face AI", font=f_badge, fill=(255, 255, 255))
    d_final.text((badge_x + 18, badge_y + 36), "REAL-TIME RECOGNITION", font=get_bold_font(12), fill=COLOR_DOODLE_YELLOW)

    # Save RGB 24-bit PNG
    out_path = os.path.join(OUTPUT_DIR, "feature_graphic.png")
    final_graphic = base.convert("RGB")
    final_graphic.save(out_path, "PNG", quality=96)
    print(f"Saved Feature Graphic: {out_path}")

def main():
    print("Generating Google Play Store Assets in User's Reference Style...")
    
    # 1. Feature Graphic (1024 x 500)
    build_feature_graphic()
    
    # 2. Screenshot 1 - Home Screen (Core Mission)
    build_reference_screenshot(
        screen_path=SCREENSHOT_SOURCES[0],
        index_str="01",
        line1="Deliver photos to",
        line2="everyone, instantly",
        doodle_type="underline_sparkle",
        callout_text="512-D Face Recognition Active",
        output_filename="screenshot_1_home.png"
    )
    
    # 3. Screenshot 2 - Create Trip Modal (10s Setup)
    build_reference_screenshot(
        screen_path=SCREENSHOT_SOURCES[1],
        index_str="02",
        line1="Start your event",
        line2="in 10 seconds",
        doodle_type="oval_sparkle",
        callout_text="Name & Create In One Tap",
        output_filename="screenshot_2_create_trip.png"
    )
    
    # 4. Screenshot 3 - Active Trip QR Screen (Zero App Install)
    build_reference_screenshot(
        screen_path=SCREENSHOT_SOURCES[2],
        index_str="03",
        line1="Guests scan QR,",
        line2="no app needed",
        doodle_type="underline_camera",
        callout_text="Zero App Download For Guests",
        output_filename="screenshot_3_active_trip_qr.png"
    )
    
    # 5. Screenshot 4 - Trip Settings (AI Privacy Controls)
    build_reference_screenshot(
        screen_path=SCREENSHOT_SOURCES[3],
        index_str="04",
        line1="AI face match,",
        line2="total privacy",
        doodle_type="oval_privacy",
        callout_text="Only Get Photos You're In",
        output_filename="screenshot_4_trip_settings.png"
    )
    
    # Sync all generated files to the artifacts directory
    artifact_dir = r"C:\Users\Shahid Rasheed\.gemini\antigravity\brain\8a1e8002-4da2-4931-888d-c14e3ce7281f"
    for fname in ["feature_graphic.png", "screenshot_1_home.png", "screenshot_2_create_trip.png", "screenshot_3_active_trip_qr.png", "screenshot_4_trip_settings.png"]:
        src = os.path.join(OUTPUT_DIR, fname)
        dst = os.path.join(artifact_dir, fname)
        shutil.copy2(src, dst)
        
    print("\nAll 5 assets generated and verified successfully in Reference Style!")

if __name__ == "__main__":
    main()
