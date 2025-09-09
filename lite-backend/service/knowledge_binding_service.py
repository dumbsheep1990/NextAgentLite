"""
知识库绑定服务 - 为Agno智能体提供知识库支持
"""
import os
from typing import Dict, List, Optional, Any
from pathlib import Path

from core.config_optimized import optimized_config_manager
from core.logger import logger
from service.knowledge_service import knowledge_service as base_knowledge_service


class KnowledgeBindingService:
    """知识库绑定服务 - 专为Agno智能体设计"""
    
    def __init__(self):
        self.knowledge_mappings = {
            # 智能体到知识库的映射配置
            "qa_agent": {
                "knowledge_types": ["geopolymer_materials", "general_qa"],
                "priority": ["text", "pdf", "vector"]
            },
            "doc_analyzer": {
                "knowledge_types": ["documents", "papers", "technical_specs"],
                "priority": ["pdf", "text"]
            },
            "multimodal_agent": {
                "knowledge_types": ["images", "charts", "multimedia"],
                "priority": ["vector", "text"]
            }
        }
    
    def get_agent_documents(self, agent_name: str) -> List[Dict[str, Any]]:
        """获取智能体相关的文档列表"""
        try:
            documents = []
            
            # 获取智能体的知识库配置
            agent_knowledge_config = self.knowledge_mappings.get(agent_name, {})
            knowledge_types = agent_knowledge_config.get("knowledge_types", [])
            
            # 为每个知识类型获取文档
            for knowledge_type in knowledge_types:
                docs = self._get_documents_by_type(knowledge_type)
                documents.extend(docs)
            
            logger.info(f"为智能体 {agent_name} 找到 {len(documents)} 个知识文档")
            return documents
            
        except Exception as e:
            logger.error(f"获取智能体文档失败: {e}")
            return []
    
    def _get_documents_by_type(self, knowledge_type: str) -> List[Dict[str, Any]]:
        """根据知识类型获取文档"""
        documents = []
        
        try:
            # 获取上传目录
            upload_dir = Path(optimized_config_manager.settings.upload_dir)
            
            # 根据知识类型搜索文档
            if knowledge_type == "geopolymer_materials":
                # 地聚物材料相关文档
                patterns = ["*地聚物*", "*geopolymer*", "*材料*", "*cement*", "*concrete*"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
                
            elif knowledge_type == "general_qa":
                # 通用问答文档
                patterns = ["*问答*", "*qa*", "*faq*"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
                
            elif knowledge_type == "documents":
                # 通用文档
                patterns = ["*.pdf", "*.txt", "*.md", "*.docx"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
                
            elif knowledge_type == "papers":
                # 学术论文
                patterns = ["*paper*", "*研究*", "*journal*", "*conference*"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
                
            elif knowledge_type == "technical_specs":
                # 技术规范文档
                patterns = ["*spec*", "*标准*", "*规范*", "*technical*"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
                
            elif knowledge_type == "images":
                # 图片文档
                patterns = ["*.png", "*.jpg", "*.jpeg", "*.gif", "*.bmp"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
                
            elif knowledge_type == "charts":
                # 图表文档
                patterns = ["*chart*", "*图表*", "*diagram*", "*graph*"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
                
            elif knowledge_type == "multimedia":
                # 多媒体文档
                patterns = ["*.mp4", "*.avi", "*.mov", "*.mp3", "*.wav"]
                documents.extend(self._find_documents_by_patterns(upload_dir, patterns))
        
        except Exception as e:
            logger.error(f"根据类型获取文档失败 ({knowledge_type}): {e}")
        
        return documents
    
    def _find_documents_by_patterns(self, search_dir: Path, patterns: List[str]) -> List[Dict[str, Any]]:
        """根据模式搜索文档"""
        documents = []
        
        try:
            if not search_dir.exists():
                logger.warning(f"搜索目录不存在: {search_dir}")
                return documents
            
            for pattern in patterns:
                try:
                    for file_path in search_dir.rglob(pattern):
                        if file_path.is_file():
                            # 确定文档类型
                            doc_type = self._determine_document_type(file_path)
                            
                            documents.append({
                                "path": str(file_path),
                                "name": file_path.stem,
                                "type": doc_type,
                                "extension": file_path.suffix.lower(),
                                "size": file_path.stat().st_size,
                                "modified": file_path.stat().st_mtime
                            })
                except Exception as e:
                    logger.warning(f"搜索模式 {pattern} 失败: {e}")
        
        except Exception as e:
            logger.error(f"搜索文档失败: {e}")
        
        return documents
    
    def _determine_document_type(self, file_path: Path) -> str:
        """确定文档类型"""
        extension = file_path.suffix.lower()
        
        if extension in ['.pdf']:
            return 'pdf'
        elif extension in ['.txt', '.md', '.rtf']:
            return 'text'
        elif extension in ['.docx', '.doc']:
            return 'document'
        elif extension in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
            return 'image'
        elif extension in ['.mp4', '.avi', '.mov']:
            return 'video'
        elif extension in ['.mp3', '.wav', '.m4a']:
            return 'audio'
        else:
            return 'text'  # 默认作为文本处理
    
    def bind_knowledge_to_agent(self, agent_name: str, knowledge_source: str, knowledge_type: str = "text") -> bool:
        """将知识源绑定到智能体"""
        try:
            # 验证知识源存在
            if not os.path.exists(knowledge_source):
                logger.error(f"知识源不存在: {knowledge_source}")
                return False
            
            # 更新智能体知识映射
            if agent_name not in self.knowledge_mappings:
                self.knowledge_mappings[agent_name] = {
                    "knowledge_types": [],
                    "priority": ["text", "pdf", "vector"]
                }
            
            # 添加新的知识源
            agent_config = self.knowledge_mappings[agent_name]
            if knowledge_type not in agent_config["knowledge_types"]:
                agent_config["knowledge_types"].append(knowledge_type)
            
            logger.info(f"成功绑定知识源到智能体: {agent_name} <- {knowledge_source} ({knowledge_type})")
            return True
            
        except Exception as e:
            logger.error(f"绑定知识源失败: {e}")
            return False
    
    def get_agent_knowledge_stats(self, agent_name: str) -> Dict[str, Any]:
        """获取智能体知识库统计信息"""
        try:
            documents = self.get_agent_documents(agent_name)
            
            stats = {
                "total_documents": len(documents),
                "by_type": {},
                "total_size": 0,
                "knowledge_types": self.knowledge_mappings.get(agent_name, {}).get("knowledge_types", [])
            }
            
            # 按类型统计
            for doc in documents:
                doc_type = doc.get("type", "unknown")
                if doc_type not in stats["by_type"]:
                    stats["by_type"][doc_type] = 0
                stats["by_type"][doc_type] += 1
                stats["total_size"] += doc.get("size", 0)
            
            return stats
            
        except Exception as e:
            logger.error(f"获取智能体知识统计失败: {e}")
            return {"total_documents": 0, "by_type": {}, "total_size": 0}
    
    def list_available_knowledge_types(self) -> List[str]:
        """列出可用的知识类型"""
        return [
            "geopolymer_materials",
            "general_qa", 
            "documents",
            "papers",
            "technical_specs",
            "images", 
            "charts",
            "multimedia"
        ]
    
    def validate_agent_knowledge_setup(self, agent_name: str) -> Dict[str, Any]:
        """验证智能体知识库设置"""
        try:
            documents = self.get_agent_documents(agent_name)
            stats = self.get_agent_knowledge_stats(agent_name)
            
            validation_result = {
                "agent_name": agent_name,
                "is_valid": True,
                "warnings": [],
                "errors": [],
                "stats": stats
            }
            
            # 检查是否有知识文档
            if stats["total_documents"] == 0:
                validation_result["warnings"].append("智能体没有配置任何知识文档")
            
            # 检查知识类型配置
            agent_config = self.knowledge_mappings.get(agent_name)
            if not agent_config:
                validation_result["warnings"].append("智能体没有知识类型配置")
            
            # 检查文档可访问性
            inaccessible_docs = []
            for doc in documents:
                if not os.path.exists(doc["path"]):
                    inaccessible_docs.append(doc["path"])
            
            if inaccessible_docs:
                validation_result["errors"].extend([f"无法访问文档: {path}" for path in inaccessible_docs])
                validation_result["is_valid"] = False
            
            return validation_result
            
        except Exception as e:
            logger.error(f"验证智能体知识库设置失败: {e}")
            return {
                "agent_name": agent_name,
                "is_valid": False,
                "warnings": [],
                "errors": [f"验证过程出错: {str(e)}"],
                "stats": {}
            }


# 全局知识绑定服务实例
knowledge_binding_service = KnowledgeBindingService()