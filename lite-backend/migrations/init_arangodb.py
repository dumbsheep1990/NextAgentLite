"""
ArangoDB 数据库初始化脚本
"""
import asyncio
from arango import ArangoClient
from core.config_optimized import optimized_config_manager
from core.logger import logger


async def init_arangodb():
    """初始化ArangoDB数据库和集合"""
    try:
        config = optimized_config_manager.settings.database_arangodb
        
        # 创建客户端连接
        client = ArangoClient(hosts=config.url)
        
        # 连接到系统数据库以检查/创建目标数据库
        sys_db = client.db('_system', username=config.username, password=config.password)
        
        # 检查数据库是否存在，不存在则创建
        if not sys_db.has_database(config.database):
            sys_db.create_database(config.database)
            logger.info(f"创建数据库: {config.database}")
        else:
            logger.info(f"数据库已存在: {config.database}")
        
        # 连接到目标数据库
        db = client.db(config.database, username=config.username, password=config.password)
        
        # 创建顶点集合
        vertex_collections = [
            {
                'name': 'entities',
                'description': '实体节点集合'
            },
            {
                'name': 'concepts', 
                'description': '概念节点集合'
            },
            {
                'name': 'materials',
                'description': '材料节点集合'
            },
            {
                'name': 'papers',
                'description': '论文节点集合'
            }
        ]
        
        for collection in vertex_collections:
            if not db.has_collection(collection['name']):
                db.create_collection(collection['name'])
                logger.info(f"创建顶点集合: {collection['name']} - {collection['description']}")
            else:
                logger.info(f"顶点集合已存在: {collection['name']}")
        
        # 创建边集合
        edge_collections = [
            {
                'name': 'relationships',
                'description': '通用关系边集合'
            },
            {
                'name': 'citations',
                'description': '论文引用关系边集合'
            },
            {
                'name': 'contains',
                'description': '包含关系边集合'
            }
        ]
        
        for collection in edge_collections:
            if not db.has_collection(collection['name']):
                db.create_collection(collection['name'], edge=True)
                logger.info(f"创建边集合: {collection['name']} - {collection['description']}")
            else:
                logger.info(f"边集合已存在: {collection['name']}")
        
        # 创建图
        if not db.has_graph(config.graph_name):
            # 定义边定义
            edge_definitions = [
                {
                    'edge_collection': 'relationships',
                    'from_vertex_collections': ['entities', 'concepts', 'materials', 'papers'],
                    'to_vertex_collections': ['entities', 'concepts', 'materials', 'papers']
                },
                {
                    'edge_collection': 'citations',
                    'from_vertex_collections': ['papers'],
                    'to_vertex_collections': ['papers']
                },
                {
                    'edge_collection': 'contains',
                    'from_vertex_collections': ['papers'],
                    'to_vertex_collections': ['entities', 'concepts', 'materials']
                }
            ]
            
            graph = db.create_graph(config.graph_name, edge_definitions)
            logger.info(f"创建图: {config.graph_name}")
        else:
            logger.info(f"图已存在: {config.graph_name}")
        
        # 创建索引
        await create_indexes(db)
        
        logger.info("ArangoDB 初始化完成")
        return True
        
    except Exception as e:
        logger.error(f"ArangoDB 初始化失败: {e}")
        return False


async def create_indexes(db):
    """创建索引"""
    try:
        # 为顶点集合创建索引
        vertex_collections = ['entities', 'concepts', 'materials', 'papers']
        
        for collection_name in vertex_collections:
            collection = db.collection(collection_name)
            
            # 创建标签索引
            if not collection.has_index(['label']):
                collection.add_index({'type': 'persistent', 'fields': ['label']})
                logger.info(f"为 {collection_name} 创建标签索引")
            
            # 创建类型索引
            if not collection.has_index(['type']):
                collection.add_index({'type': 'persistent', 'fields': ['type']})
                logger.info(f"为 {collection_name} 创建类型索引")
            
            # 创建全文搜索索引
            if not collection.has_index(['label', 'name', 'title']):
                collection.add_index({
                    'type': 'fulltext', 
                    'fields': ['label', 'name', 'title'],
                    'minLength': 2
                })
                logger.info(f"为 {collection_name} 创建全文搜索索引")
        
        # 为边集合创建索引
        edge_collections = ['relationships', 'citations', 'contains']
        
        for collection_name in edge_collections:
            collection = db.collection(collection_name)
            
            # 创建类型索引
            if not collection.has_index(['type']):
                collection.add_index({'type': 'persistent', 'fields': ['type']})
                logger.info(f"为 {collection_name} 创建类型索引")
            
            # 创建权重索引
            if not collection.has_index(['weight']):
                collection.add_index({'type': 'persistent', 'fields': ['weight']})
                logger.info(f"为 {collection_name} 创建权重索引")
        
        logger.info("索引创建完成")
        
    except Exception as e:
        logger.error(f"创建索引失败: {e}")


async def cleanup_arangodb():
    """清理ArangoDB数据库（用于测试）"""
    try:
        config = optimized_config_manager.settings.database_arangodb
        
        client = ArangoClient(hosts=config.url)
        sys_db = client.db('_system', username=config.username, password=config.password)
        
        if sys_db.has_database(config.database):
            sys_db.delete_database(config.database)
            logger.info(f"删除数据库: {config.database}")
        
        return True
        
    except Exception as e:
        logger.error(f"清理ArangoDB失败: {e}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "cleanup":
        # 清理模式
        success = asyncio.run(cleanup_arangodb())
        if success:
            print("ArangoDB 清理完成")
        else:
            print("ArangoDB 清理失败")
            sys.exit(1)
    else:
        # 初始化模式
        success = asyncio.run(init_arangodb())
        if success:
            print("ArangoDB 初始化完成")
        else:
            print("ArangoDB 初始化失败")
            sys.exit(1) 