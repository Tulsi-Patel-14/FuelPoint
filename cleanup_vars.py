import re

with open('src/routes/_admin.workers.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove scansData useMemo block
content = re.sub(r'  const scansData = useMemo\([\s\S]*?\n  \);\n', '', content)

# Remove discountData useMemo block
content = re.sub(r'  const discountData = useMemo\([\s\S]*?\n  \);\n', '', content)

with open('src/routes/_admin.workers.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed unused variables")
