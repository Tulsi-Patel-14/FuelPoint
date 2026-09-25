from PIL import Image
from collections import Counter

def get_dominant_colors(path, n=5):
    img = Image.open(path).convert('RGB')
    # resize to speed up
    img.thumbnail((100, 100))
    pixels = list(img.getdata())
    counter = Counter(pixels)
    return counter.most_common(n)

images = [
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102685.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102686.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102691.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102695.jpg",
    r"C:\Users\Admin\.gemini\antigravity\brain\3f34e91e-bb9f-40e3-81ca-706612c2e6e5\.user_uploaded\media_1790329102704.jpg"
]

for idx, p in enumerate(images):
    print(f"Image {idx}:")
    for color, count in get_dominant_colors(p, 10):
        hex_color = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
        print(f"  {hex_color}: {count}")
