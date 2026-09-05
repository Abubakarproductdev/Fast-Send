import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace 'borderWidth: 2,' with 'borderWidth: 1.5, borderTopWidth: 4,'
            # Need to handle potential spacing issues
            new_content = re.sub(r'borderWidth:\s*2,', 'borderWidth: 1.5, borderTopWidth: 4,', content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
