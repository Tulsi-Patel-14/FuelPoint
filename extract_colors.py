from PIL import Image

images = [
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102685.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102686.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102691.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102695.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102704.jpg"
]

for idx, path in enumerate(images):
    try:
        img = Image.open(path)
        rgb_img = img.convert('RGB')
        print(f"Image {idx}: {img.size}")
        
        # Header (top area)
        r, g, b = rgb_img.getpixel((100, 150))
        print(f"Header (100,150): #{r:02x}{g:02x}{b:02x}")
        
        # Background (side area)
        r, g, b = rgb_img.getpixel((10, 300))
        print(f"Bg (10,300): #{r:02x}{g:02x}{b:02x}")
        
        # Try finding a cyan button (y=1500 or similar? Let's just sample a few places)
        # We can find the bluest pixel
        pixels = list(rgb_img.getdata())
        # cyan has high g and b, low r. Let's find pixel where b>150, g>120, r<100
        cyan_pixels = [p for p in pixels if p[2]>150 and p[1]>120 and p[0]<100]
        if cyan_pixels:
            p = cyan_pixels[0]
            print(f"Cyan candidate: #{p[0]:02x}{p[1]:02x}{p[2]:02x}")
        print("---")
    except Exception as e:
        print(e)
