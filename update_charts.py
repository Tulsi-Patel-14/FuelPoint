with open('src/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add chart-6 to root
css = css.replace('--chart-5: #0EA5E9;\n', '--chart-5: #0EA5E9;\n  --chart-6: #F43F5E;\n')

# Find the .dark block
import re
dark_block_match = re.search(r'\.dark \{[^}]+\}', css)
if dark_block_match:
    dark_block = dark_block_match.group(0)
    # Remove existing chart variables from dark block if they exist
    dark_block = re.sub(r'  --chart-\d: [^;]+;\n', '', dark_block)
    
    new_charts = """  --chart-1: #14C7A3;
  --chart-2: #38BDF8;
  --chart-3: #FBBF24;
  --chart-4: #94A3B8;
  --chart-5: #60A5FA;
  --chart-6: #FB7185;
}"""
    dark_block = dark_block.replace('}', new_charts)
    css = css.replace(dark_block_match.group(0), dark_block)
else:
    print("No dark block found")

with open('src/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated charts")
