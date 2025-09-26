DataGraph WebUI 分页嵌入改造与重打包指南

目的
- 允许通过 URL 参数选择单页并仅渲染该功能：/webui/?tab=documents|knowledge-graph|retrieval&embed=1
- 主系统以 iframe 嵌入不同功能页，实现“半拆分”。

修改点（已合入）
- matgraph_webui/src/App.tsx
  - 启动时解析 window.location.search：
    - tab=documents|knowledge-graph|retrieval → 设置 currentTab
    - embed=1|true → 仅渲染对应 Feature（DocumentManager/GraphViewer/RetrievalTesting），不显示头部与 Tabs

重打包与备份
1) 进入 DataGraph 目录
   cd lite-backend/DataGraph

2) 执行带备份的构建脚本
   bash scripts/rebuild_webui.sh
   - 备份目录：backups/webui_YYYYmmdd_HHMMSS.bak
   - 构建输出：lightrag/api/webui

3) 回滚（如需）
   ls backups
   bash scripts/rollback_webui.sh webui_YYYYmmdd_HHMMSS.bak

运行与验证
- 启动 DataGraph（lightrag FastAPI 9622 端口）后，访问：
  - http://127.0.0.1:9622/webui/?tab=knowledge-graph&embed=1 → 仅渲染图谱
  - http://127.0.0.1:9622/webui/?tab=documents&embed=1 → 仅渲染文档
  - http://127.0.0.1:9622/webui/?tab=retrieval&embed=1 → 仅渲染检索

注意
- 该改造不改变原有完整页面：不带 embed 参数时，仍显示头部 + Tabs 三页。
- 若构建报依赖错误，可先 npm ci 再 npm run build（脚本已自动处理 node_modules 不存在时的安装）。

