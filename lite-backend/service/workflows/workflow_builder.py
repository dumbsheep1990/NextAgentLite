from __future__ import annotations

from typing import Any, Dict, Tuple


def _get_base_type(template: Dict[str, Any]) -> str:
    name = (template.get('template_name') or '').lower()
    code = (template.get('template_code') or '').lower()
    if '图谱' in template.get('template_name','') or 'graph' in name or 'kg' in name or 'graph' in code:
        return 'graph'
    if '知识库' in template.get('template_name','') or 'knowledge' in name or 'kb' in code:
        return 'knowledge'
    return 'qa'


def build_workflow_for_agent(template: Dict[str, Any], resources: Dict[str, Any] | None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """根据基础类型和资源，生成 execution_flow 与 team_config。

    返回 (execution_flow, team_config)
    """
    base_type = _get_base_type(template)
    resources = resources or {}

    steps = []
    deps: Dict[str, Any] = {}

    if base_type == 'qa':
        # 规划 → 对话
        steps.append({"name": "plan", "agent": "planner"})
        steps.append({"name": "chat", "agent": "qa_agent"})
        deps['chat'] = ['plan']
    elif base_type == 'knowledge':
        # 检索 → （可选重排）→ 回答
        coll_id = resources.get('knowledge_collection',{}).get('collection_id')
        emb_id = resources.get('embedding_model',{}).get('model_id')
        steps.append({"name": "retrieve", "agent": "kb_retriever", "params": {"collection_id": coll_id, "embedding_model_id": emb_id}})
        deps['retrieve'] = deps.get('retrieve', [])
        # 预留重排占位（如后续接入 rerank 模型）
        steps.append({"name": "answer", "agent": "kb_answerer", "params": {"use_context": True}})
        deps['answer'] = ['retrieve']
    elif base_type == 'graph':
        # KG 查询 → 回答
        host = resources.get('graph_service',{}).get('host', 'localhost')
        port = resources.get('graph_service',{}).get('port', 9622)
        steps.append({"name": "kg_query", "agent": "kg_query_agent", "params": {"host": host, "port": port}})
        steps.append({"name": "answer", "agent": "kg_answerer", "params": {"use_context": True}})
        deps['answer'] = ['kg_query']
    else:
        steps.append({"name": "chat", "agent": "qa_agent"})

    execution_flow = {
        "steps": steps,
        "dependencies": deps
    }
    team_config = {
        "mode": "sequential",
        "members": [s.get('agent') for s in steps if s.get('agent')],
        "timeout_seconds": 60
    }
    return execution_flow, team_config
