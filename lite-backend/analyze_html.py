"""分析已抓取的HTML"""
from bs4 import BeautifulSoup

# 读取之前抓取的HTML
with open('/Users/wxn/Desktop/NextAgentLite/lite-backend/debug_page.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

print("1. 查找.basic_result_content容器:")
print("="*80)
result_content = soup.select('.basic_result_content')
if result_content:
    container = result_content[0]
    print(f"找到容器，display属性: {container.get('style', 'N/A')}")
    print(f"内容长度: {len(container.get_text(strip=True))}")
    print(f"子元素数量: {len(list(container.children))}")
    print(f"\n容器HTML (前1000字符):")
    print(container.prettify()[:1000])
else:
    print("未找到容器")

print("\n2. 查找所有包含'未能搜到'的元素:")
print("="*80)
no_result_elems = soup.find_all(string=lambda x: x and '未能搜到' in x)
for i, elem in enumerate(no_result_elems[:3]):
    print(f"\n元素{i+1}:")
    print(f"  文本: {elem.strip()[:100]}")
    if elem.parent:
        print(f"  父元素: {elem.parent.name}")
        print(f"  父class: {elem.parent.get('class', [])}")

print("\n3. 查找所有.item元素(非模板):")
print("="*80)
# 查找不包含模板语法的.item元素
items = soup.find_all(class_='item')
non_template_items = []
for item in items:
    html_str = str(item)
    # 检查是否包含模板语法
    if '{{' not in html_str and '}}' not in html_str:
        non_template_items.append(item)

print(f"找到 {len(items)} 个.item元素")
print(f"其中非模板元素: {len(non_template_items)} 个")

if non_template_items:
    print("\n前3个非模板.item元素:")
    for i, item in enumerate(non_template_items[:3]):
        print(f"\n元素{i+1}:")
        print(f"  class: {item.get('class', [])}")
        # 查找标题
        title = item.find(['h1', 'h2', 'h3', 'h4', 'h5', 'a'])
        if title:
            print(f"  标题: {title.get_text(strip=True)[:100]}")
        # 查找链接
        link = item.find('a')
        if link:
            print(f"  链接: {link.get('href', 'N/A')[:100]}")
        print(f"  HTML (前500字符):")
        print(item.prettify()[:500])

print("\n4. 查找左侧栏 .left 元素内容:")
print("="*80)
left_div = soup.select_one('.left.js_basic_result_left')
if left_div:
    print(f"找到左侧栏")
    # 查找其中的所有文本
    text = left_div.get_text(separator='\n', strip=True)
    print(f"文本内容 (前1000字符):")
    print(text[:1000])
