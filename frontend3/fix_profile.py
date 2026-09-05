import re

file_path = 'src/app/(tabs)/profile.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const QUALITY_OPTIONS = ['High (1080p)', 'Medium (720p)', 'Original (4K)'];\n", "")
content = content.replace("const [quality, setQuality] = useState('High (1080p)');\n", "")
content = content.replace("'mode' | 'quality' | 'name'", "'mode' | 'name'")
content = content.replace("storage.getImageQuality().then(setQuality);\n", "")

quality_func = '''  const handlePickQuality = async (opt: string) => {
    setQuality(opt);
    await storage.setImageQuality(opt);
    setActiveSheet(null);
    showToast(Image quality set to );
  };'''
content = content.replace(quality_func, "")
content = re.sub(r'\n\s*<View style=\{styles\.rowDivider\} />\s*<TouchableOpacity\s*onPress=\{\(\) => setActiveSheet\(''quality''\)\}.*?<Text style=\{styles\.rowValue\}>\{quality\}</Text>\s*<ChevronRight size=\{17\} color=\{colors\.mut\} />\s*</View>\s*</TouchableOpacity>', '', content, flags=re.DOTALL)
content = re.sub(r'\n\s*\{\/\* Image Quality Sheet \*\/}.*?{quality === opt \? <BadgeCheck size=\{19\} color=\{colors\.ink\} strokeWidth=\{2\.8\} /> : null}\s*</TouchableOpacity>\s*\)\)}\s*</View>\s*</NeoSheet>', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
