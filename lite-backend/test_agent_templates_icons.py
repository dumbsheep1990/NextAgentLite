#!/usr/bin/env python3
"""测试智能体模板图标是否正确显示"""

import asyncio
import httpx
from rich.console import Console
from rich.table import Table

console = Console()

async def test_agent_templates():
    """测试获取智能体模板列表"""
    async with httpx.AsyncClient() as client:
        try:
            # 获取所有模板
            response = await client.get("http://localhost:8000/api/agent-templates/list")
            response.raise_for_status()
            templates = response.json()
            
            # 创建表格显示
            table = Table(title="智能体模板图标列表")
            table.add_column("模板代码", style="cyan")
            table.add_column("模板名称", style="magenta")
            table.add_column("图标", style="green")
            table.add_column("颜色", style="yellow")
            table.add_column("类型", style="blue")
            
            for template in templates:
                table.add_row(
                    template.get("template_code", ""),
                    template.get("template_name", ""),
                    template.get("icon", ""),
                    template.get("color", ""),
                    template.get("template_type", "")
                )
            
            console.print(table)
            console.print(f"\n✅ 成功获取 {len(templates)} 个模板")
            
            # 验证图标是否都不同
            icons = [t.get("icon") for t in templates]
            unique_icons = set(icons)
            console.print(f"📊 共使用了 {len(unique_icons)} 种不同的图标")
            
            # 统计图标使用情况
            icon_count = {}
            for icon in icons:
                icon_count[icon] = icon_count.get(icon, 0) + 1
            
            console.print("\n📈 图标使用统计:")
            for icon, count in sorted(icon_count.items(), key=lambda x: x[1], reverse=True):
                console.print(f"  - {icon}: {count}次")
            
        except Exception as e:
            console.print(f"[red]❌ 错误: {str(e)}[/red]")

if __name__ == "__main__":
    asyncio.run(test_agent_templates())