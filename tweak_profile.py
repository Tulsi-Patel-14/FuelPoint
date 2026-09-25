import re

with open('src/routes/_admin.profile.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('size-24', 'size-20')
content = content.replace('mt-4', 'mt-3')

with open('src/routes/_admin.profile.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Tweaked profile sizing")
