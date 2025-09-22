#!/usr/bin/env python3
"""验证智能体模板图标是否正确配置"""

import asyncio
import httpx
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

# 图标映射（与前端保持一致）
ICON_EMOJIS = {
    'ApiOutlined': '🔌',
    'TeamOutlined': '👥',
    'ExperimentOutlined': '🧪',
    'SettingOutlined': '⚙️',
    'DashboardOutlined': '📊',
    'FileTextOutlined': '📄',
    'AppstoreOutlined': '📱',
    'CloudOutlined': '☁️',
    'ToolOutlined': '🔧',
    'CodeOutlined': '💻',
    'GlobalOutlined': '🌐'
}

async def main():
    async with httpx.AsyncClient() as client:
        try:
            # 获取所有模板
            response = await client.get("http://localhost:8000/api/v1/agent-templates/list")
            response.raise_for_status()
            templates = response.json()
            
            # 创建表格
            table = Table(title="🎨 智能体模板图标验证", show_header=True, header_style="bold magenta")
            table.add_column("图标", style="cyan", width=6, justify="center")
            table.add_column("图标名称", style="green", width=20)
            table.add_column("模板代码", style="yellow", width=30)
            table.add_column("模板名称", style="blue", width=20)
            table.add_column("描述", style="white", width=40)
            
            # 统计
            icon_usage = {}
            
            for template in templates:
                icon_name = template.get("icon", "")
                icon_emoji = ICON_EMOJIS.get(icon_name, '❓')
                
                # 统计图标使用
                icon_usage[icon_name] = icon_usage.get(icon_name, 0) + 1
                
                # 添加到表格
                table.add_row(
                    icon_emoji,
                    icon_name,
                    template.get("template_code", ""),
                    template.get("template_name", ""),
                    template.get("description", "")[:40] + "..." if len(template.get("description", "")) > 40 else template.get("description", "")
                )
            
            console.print(table)
            
            # 显示统计信息
            stats_text = f"""
📊 统计信息:
• 总模板数: {len(templates)}
• 不同图标种类: {len(icon_usage)}
• 无RobotOutlined图标: {'✅ 是' if 'RobotOutlined' not in icon_usage else '❌ 否'}
            """
            
            console.print(Panel(stats_text, title="✨ 图标多样性检查", border_style="green"))
            
            # 图标使用频率
            console.print("\n📈 图标使用频率:")
            for icon, count in sorted(icon_usage.items(), key=lambda x: x[1], reverse=True):
                emoji = ICON_EMOJIS.get(icon, '❓')
                bar = '█' * count + '░' * (5 - count)
                console.print(f"  {emoji} {icon:20} {bar} ({count}次)")
            
            # 成功提示
            if 'RobotOutlined' not in icon_usage:
                console.print("\n[bold green]✅ 成功！已完全移除RobotOutlined图标，所有模板使用了多样化的图标。[/bold green]")
            else:
                console.print(f"\n[bold yellow]⚠️ 警告：仍有 {icon_usage.get('RobotOutlined', 0)} 个模板使用RobotOutlined图标[/bold yellow]")
                
        except Exception as e:
            console.print(f"[red]❌ 错误: {str(e)}[/red]")

if __name__ == "__main__":
    asyncio.run(main())