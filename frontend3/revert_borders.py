import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Revert the exact replacement
            new_content = re.sub(r'borderWidth:\s*1\.5,\s*borderTopWidth:\s*4,', 'borderWidth: 2,', content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Reverted {path}')
