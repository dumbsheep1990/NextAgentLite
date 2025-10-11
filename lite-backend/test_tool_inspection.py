"""检查BaiduSearchTools的工具信息"""
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.baidu_search_tools import BaiduSearchTools

tool_instance = BaiduSearchTools()

print("工具实例:", tool_instance)
print("\n属性列表:")
for attr_name in dir(tool_instance):
    if not attr_name.startswith('_'):
        print(f"  - {attr_name}")

print("\n检查 baidu_search 方法:")
if hasattr(tool_instance, 'baidu_search'):
    method = tool_instance.baidu_search
    print(f"  callable: {callable(method)}")
    print(f"  has 'name': {hasattr(method, 'name')}")
    if hasattr(method, 'name'):
        print(f"  name = {method.name}")
    if hasattr(method, 'description'):
        print(f"  description = {method.description}")
    print(f"  __name__ = {getattr(method, '__name__', 'N/A')}")