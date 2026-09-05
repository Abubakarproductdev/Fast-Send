import re

file_path = 'src/app/(tabs)/profile.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'const QUALITY_OPTIONS = \[.*?\];\n', '', content)
content = re.sub(r'\s*const \[quality, setQuality\] = useState.*?\n', '\n', content)
content = content.replace("'mode' | 'quality' | 'name'", "'mode' | 'name'")
content = re.sub(r'\s*storage\.getImageQuality\(\)\.then\(setQuality\);\n', '\n', content)
content = re.sub(r'\s*const handlePickQuality = async.*?showToast\(Image quality set to \$\{opt\}\);\n\s*};\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*<View style=\{styles\.rowDivider\} \/>\s*<TouchableOpacity\s*onPress=\{\(\) => setActiveSheet\(''quality''\)\}.*?<\/TouchableOpacity>', '', content, flags=re.DOTALL)
content = re.sub(r'\s*\{\/\* Image Quality Sheet \*\/}.*?<\/NeoSheet>', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Profile updated')
