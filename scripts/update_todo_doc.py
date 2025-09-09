#!/usr/bin/env python3
"""
TODO文档自动更新脚本

功能：
1. 读取当前的todo状态
2. 生成格式化的Markdown文档
3. 自动更新PROJECT_TODO.md文件
4. 支持手动调用和定时任务

使用方法：
  python scripts/update_todo_doc.py
"""

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent

# TODO任务定义 (与实际todolist同步)
TODOS = [
    {"id": "1", "content": "制定知识库管理扩展实施计划", "status": "completed", "category": "系统架构与设计"},
    {"id": "2", "content": "分析当前系统架构和逻辑", "status": "completed", "category": "系统架构与设计"},
    {"id": "3", "content": "设计知识库Collection概念模型", "status": "completed", "category": "系统架构与设计"},
    {"id": "4", "content": "定义API接口变动和兼容性方案", "status": "completed", "category": "系统架构与设计"},
    {"id": "5", "content": "创建完整的实施计划文档", "status": "completed", "category": "系统架构与设计"},
    
    {"id": "6", "content": "检查政策文档元数据设计现状", "status": "completed", "category": "元数据管理系统"},
    {"id": "7", "content": "完善政策元数据设计并更新实施计划", "status": "completed", "category": "元数据管理系统"},
    {"id": "8", "content": "创建MetadataExtractionService和四种提取器", "status": "completed", "category": "元数据管理系统"},
    
    {"id": "9", "content": "创建KnowledgeCollectionService服务组件", "status": "completed", "category": "核心服务开发"},
    {"id": "10", "content": "创建API接口层", "status": "completed", "category": "核心服务开发"},
    {"id": "11", "content": "扩展检索服务以支持知识库绑定", "status": "completed", "category": "核心服务开发"},
    {"id": "12", "content": "创建Filter-then-Rerank检索服务", "status": "completed", "category": "核心服务开发"},
    {"id": "13", "content": "创建时间轴管理服务", "status": "completed", "category": "核心服务开发"},
    
    {"id": "14", "content": "开发前端知识库管理页面", "status": "completed", "category": "前端界面开发"},
    {"id": "15", "content": "实现Agent与Collection绑定机制", "status": "completed", "category": "前端界面开发"},
    
    {"id": "30", "content": "创建向量索引管理服务和API接口", "status": "completed", "category": "向量索引管理系统"},
    {"id": "31", "content": "创建向量索引管理前端组件", "status": "completed", "category": "向量索引管理系统"},
    
    {"id": "18", "content": "修复API路由前缀重复问题", "status": "completed", "category": "系统修复和优化"},
    {"id": "19", "content": "修复前端globalStatistics undefined错误", "status": "completed", "category": "系统修复和优化"},
    {"id": "20", "content": "修复元数据模板字段映射错误", "status": "completed", "category": "系统修复和优化"},
    {"id": "21", "content": "初始化元数据模板数据", "status": "completed", "category": "系统修复和优化"},
    {"id": "22", "content": "修复KnowledgeCollectionService search参数错误", "status": "completed", "category": "系统修复和优化"},
    {"id": "23", "content": "整合测试和验证系统", "status": "completed", "category": "系统修复和优化"},
    {"id": "24", "content": "修复知识库创建modal中Select下拉框背景色问题", "status": "completed", "category": "系统修复和优化"},
    {"id": "25", "content": "重新设计知识库管理页面样式", "status": "completed", "category": "系统修复和优化"},
    
    {"id": "26", "content": "检查当前知识库与文档管理融合需求", "status": "completed", "category": "需求分析与规划"},
    {"id": "27", "content": "分析现有检索逻辑的Collection绑定支持", "status": "completed", "category": "需求分析与规划"},
    {"id": "28", "content": "评估数据库架构对融合的支持程度", "status": "completed", "category": "需求分析与规划"},
    {"id": "29", "content": "制定知识库文档管理融合实施计划", "status": "completed", "category": "需求分析与规划"},
    
    {"id": "39", "content": "创建实时更新的TODO文档", "status": "completed", "category": "文档管理"},
    
    # 待完成任务
    {"id": "16", "content": "更新Agent配置以支持Collection过滤", "status": "pending", "category": "Agent配置集成", "priority": 1},
    {"id": "17", "content": "集成Collection检索到QA API", "status": "pending", "category": "检索系统集成", "priority": 1},
    {"id": "32", "content": "创建默认Collection和数据迁移脚本", "status": "pending", "category": "数据迁移与兼容", "priority": 1},
    {"id": "33", "content": "扩展文档服务支持Collection上下文", "status": "pending", "category": "数据迁移与兼容", "priority": 2},
    {"id": "34", "content": "集成Collection检索到现有API", "status": "pending", "category": "API系统集成", "priority": 2},
    {"id": "35", "content": "重构前端路由为层次化架构", "status": "pending", "category": "前端架构重构", "priority": 2},
    {"id": "36", "content": "开发Collection上下文管理组件", "status": "pending", "category": "前端架构重构", "priority": 2},
    {"id": "37", "content": "实现向后兼容和数据迁移", "status": "pending", "category": "系统完善", "priority": 3},
    {"id": "38", "content": "创建测试数据集和集成测试", "status": "pending", "category": "系统完善", "priority": 3},
]

# 里程碑定义
MILESTONES = [
    {
        "name": "M1 - 基础架构完成",
        "date": "2025-07-15",
        "status": "completed",
        "description": "Collection概念模型设计完成、核心服务组件开发完成、API接口层实现完成"
    },
    {
        "name": "M2 - 前端界面完成", 
        "date": "2025-07-28",
        "status": "completed",
        "description": "知识库管理页面开发完成、Collection CRUD操作完成、UI/UX优化完成"
    },
    {
        "name": "M3 - 检索系统完成",
        "date": "2025-08-05", 
        "status": "completed",
        "description": "Filter-then-Rerank检索实现、Collection级别检索隔离、检索性能优化"
    },
    {
        "name": "M4 - 向量索引系统完成",
        "date": "2025-08-22",
        "status": "completed", 
        "description": "PostgreSQL + pgvector 索引管理、HNSW/IVFFlat 索引支持、前端索引管理界面"
    },
    {
        "name": "M5 - 系统集成完成",
        "date": "2025-08-30",
        "status": "planned",
        "description": "Agent配置集成、QA API支持Collection、数据迁移完成"
    },
    {
        "name": "M6 - 前端重构完成",
        "date": "2025-09-05",
        "status": "planned",
        "description": "层次化路由架构、Collection上下文管理、用户体验优化"
    },
    {
        "name": "M7 - 项目完成",
        "date": "2025-09-10", 
        "status": "planned",
        "description": "所有功能完成、测试体系完善、系统优化调试"
    }
]

def get_status_stats():
    """获取任务状态统计"""
    completed = len([t for t in TODOS if t["status"] == "completed"])
    in_progress = len([t for t in TODOS if t["status"] == "in_progress"])
    pending = len([t for t in TODOS if t["status"] == "pending"])
    total = len(TODOS)
    
    return {
        "completed": completed,
        "in_progress": in_progress, 
        "pending": pending,
        "total": total,
        "completed_percent": round(completed / total * 100, 1)
    }

def group_todos_by_category():
    """按类别分组TODO任务"""
    categories = {}
    for todo in TODOS:
        category = todo.get("category", "其他")
        if category not in categories:
            categories[category] = []
        categories[category].append(todo)
    
    return categories

def generate_markdown():
    """生成Markdown文档内容"""
    now = datetime.now()
    stats = get_status_stats()
    categories = group_todos_by_category()
    
    # 文档头部
    md_content = f"""# NextAgentLite 项目开发进度

> **最后更新时间**: {now.strftime('%Y-%m-%d %H:%M:%S')}  
> **项目状态**: 向量索引管理系统已完成，继续Collection集成开发  
> **完成进度**: {stats['completed']}/{stats['total']} ({stats['completed_percent']}%)

## 📊 总体进度

```
🟢 已完成: {stats['completed']} 项 ({stats['completed_percent']}%)
🟡 进行中: {stats['in_progress']} 项 ({round(stats['in_progress'] / stats['total'] * 100, 1)}%) 
🔴 待完成: {stats['pending']} 项 ({round(stats['pending'] / stats['total'] * 100, 1)}%)
```

---

"""

    # 已完成任务
    completed_todos = [t for t in TODOS if t["status"] == "completed"]
    if completed_todos:
        md_content += f"## 🟢 已完成任务 ({len(completed_todos)}项)\n\n"
        
        completed_categories = {}
        for todo in completed_todos:
            category = todo.get("category", "其他")
            if category not in completed_categories:
                completed_categories[category] = []
            completed_categories[category].append(todo)
        
        for category, todos in completed_categories.items():
            md_content += f"### {get_category_icon(category)} {category}\n"
            for todo in todos:
                md_content += f"- ✅ **[{todo['id'].zfill(2)}]** {todo['content']}\n"
            md_content += "\n"

    # 进行中任务
    in_progress_todos = [t for t in TODOS if t["status"] == "in_progress"]
    if in_progress_todos:
        md_content += f"## 🟡 进行中任务 ({len(in_progress_todos)}项)\n\n"
        
        for todo in in_progress_todos:
            category = todo.get("category", "其他")
            md_content += f"### {get_category_icon(category)} {category}\n"
            md_content += f"- 🔄 **[{todo['id'].zfill(2)}]** {todo['content']}\n"
            if todo.get("details"):
                for detail in todo["details"]:
                    md_content += f"  - {detail}\n"
            md_content += "\n"

    # 待完成任务
    pending_todos = [t for t in TODOS if t["status"] == "pending"]
    if pending_todos:
        md_content += f"## 🔴 待完成任务 ({len(pending_todos)}项)\n\n"
        
        pending_categories = {}
        for todo in pending_todos:
            category = todo.get("category", "其他")
            if category not in pending_categories:
                pending_categories[category] = []
            pending_categories[category].append(todo)
        
        for category, todos in pending_categories.items():
            md_content += f"### {get_category_icon(category)} {category}\n"
            for todo in todos:
                priority_mark = get_priority_mark(todo.get("priority", 3))
                md_content += f"- {priority_mark} **[{todo['id'].zfill(2)}]** {todo['content']}\n"
                if todo.get("details"):
                    for detail in todo["details"]:
                        md_content += f"  - {detail}\n"
            md_content += "\n"

    # 优先级说明
    md_content += """---

## 🎯 下一步工作重点

### 优先级 1 - 核心功能完善
1. **Agent配置集成** - 让智能体支持Collection过滤
2. **数据迁移脚本** - 为现有系统提供平滑升级路径
3. **QA API集成** - 实现Collection级别的问答功能

### 优先级 2 - 用户体验优化
1. **前端路由重构** - 实现层次化导航体验
2. **Collection上下文管理** - 全局状态管理优化
3. **向后兼容处理** - 确保现有功能不受影响

### 优先级 3 - 系统完善
1. **文档服务扩展** - 完整的Collection支持
2. **测试体系完善** - 全面的测试覆盖
3. **性能优化调试** - 系统性能调优

---

## 📈 项目里程碑

### 🎉 已达成里程碑
"""
    
    # 添加里程碑
    for milestone in MILESTONES:
        if milestone["status"] == "completed":
            md_content += f"- ✅ **{milestone['name']}** ({milestone['date']})\n"
            md_content += f"  - {milestone['description']}\n\n"
    
    md_content += "### 🎯 计划里程碑\n"
    for milestone in MILESTONES:
        if milestone["status"] == "planned":
            md_content += f"- 🎯 **{milestone['name']}** (预计 {milestone['date']})\n"
            md_content += f"  - {milestone['description']}\n\n"

    # 技术债务和相关文档
    md_content += """---

## 📋 技术债务跟踪

### 🔧 代码优化需求
- 部分API接口需要统一错误处理格式
- 前端组件props类型定义需要完善
- 数据库查询性能需要进一步优化

### 📚 文档完善需求
- API文档需要补充Collection相关接口
- 用户操作手册需要更新
- 开发者指南需要补充向量索引部分

### 🔍 测试覆盖需求
- Collection相关功能的单元测试
- 向量索引管理的集成测试
- 前端组件的E2E测试

---

## 🔗 相关文档

- [技术架构文档](design/TECHNICAL_ARCHITECTURE.md)
- [知识库融合实施计划](KNOWLEDGE_DOCUMENT_INTEGRATION_PLAN.md)
- [向量索引管理系统文档](mat-backend/docs/VECTOR_INDEX_MANAGEMENT.md)
- [数据库设计文档](design/complete_database_schema.sql)

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系项目团队：
- 项目管理: NextAgentLite开发团队
- 技术支持: Claude Code Assistant

---

*本文档由 Claude Code 自动生成和维护*
"""

    return md_content

def get_category_icon(category):
    """获取类别图标"""
    icons = {
        "系统架构与设计": "📋",
        "元数据管理系统": "🔧", 
        "核心服务开发": "🏗️",
        "前端界面开发": "🎨",
        "向量索引管理系统": "⚡",
        "系统修复和优化": "🔧",
        "需求分析与规划": "📊",
        "文档管理": "📝",
        "Agent配置集成": "🤖",
        "检索系统集成": "🔍",
        "数据迁移与兼容": "💾",
        "API系统集成": "🔗",
        "前端架构重构": "🎯",
        "系统完善": "🔄"
    }
    return icons.get(category, "📋")

def get_priority_mark(priority):
    """获取优先级标记"""
    if priority == 1:
        return "⏰"  # 高优先级
    elif priority == 2:
        return "⏳"  # 中优先级 
    else:
        return "⏳"  # 低优先级

def update_todo_document():
    """更新TODO文档"""
    try:
        markdown_content = generate_markdown()
        todo_file = PROJECT_ROOT / "PROJECT_TODO.md"
        
        with open(todo_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        print(f"✅ TODO文档已更新: {todo_file}")
        print(f"📊 当前进度: {get_status_stats()['completed']}/{get_status_stats()['total']} ({get_status_stats()['completed_percent']}%)")
        
    except Exception as e:
        print(f"❌ 更新TODO文档失败: {e}")
        return False
    
    return True

def main():
    """主函数"""
    print("🔄 开始更新TODO文档...")
    
    if update_todo_document():
        print("🎉 TODO文档更新完成！")
    else:
        print("❌ TODO文档更新失败！")
        sys.exit(1)

if __name__ == "__main__":
    main()