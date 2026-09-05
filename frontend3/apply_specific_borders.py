import os
import re

card_patterns = [
    'heroCard', 'stepCard', 'tripCard', 'emptyCard', 'userCard', 'groupCard',
    'qrCard', 'statsRow', 'uploadProgressBox', 'permissionCard', 'toggleRow',
    'infoBanner', 'sectionCard', 'noticeCard', 'card'
]

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pat in card_patterns:
                # We want to match: pat: { ... borderWidth: 2,
                # Since the content inside { ... } could span multiple lines, we use DOTALL.
                # However, DOTALL might jump to another class. We can use a non-greedy match inside the class.
                regex = r'(' + pat + r':\s*\{[^\}]*?)borderWidth:\s*2,'
                new_content = re.sub(regex, r'\1borderWidth: 1.5,\n      borderTopWidth: 4,', new_content, flags=re.DOTALL)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
