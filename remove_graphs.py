import re

with open('src/routes/_admin.workers.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to remove the Worker Performance Analytics section
# It starts with {/* Worker Performance Analytics */} and ends before <Dialog open={!!selected}
pattern = r'\s*\{\/\* Worker Performance Analytics \*\/\}\s*<div className="mt-8">[\s\S]*?(?=<Dialog open=\{!!selected\})'
content = re.sub(pattern, '\n\n      ', content)

with open('src/routes/_admin.workers.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed worker performance graphs")
