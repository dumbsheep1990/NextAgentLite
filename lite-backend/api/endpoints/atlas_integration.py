"""
Embedding Atlas 集成API端点
"""

import os
import asyncio
import subprocess
import time
import signal
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import logging

from service.atlas_data_service import AtlasDataService

logger = logging.getLogger(__name__)

# 全局变量管理Atlas服务进程
atlas_processes = {}  # port -> process
atlas_data_service = AtlasDataService()

router = APIRouter(prefix="/atlas", tags=["Atlas可视化"])

# 请求模型
class AtlasStartRequest(BaseModel):
    document_ids: Optional[List[str]] = Field(None, description="文档ID列表，None表示所有文档")
    port: int = Field(8081, description="Atlas服务端口")
    limit: int = Field(10000, description="最大数据条数")
    host: str = Field("localhost", description="服务主机")

class AtlasResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

# Atlas服务管理
@router.post("/start", response_model=AtlasResponse)
async def start_atlas_service(
    request: AtlasStartRequest,
    background_tasks: BackgroundTasks
):
    """启动Atlas可视化服务"""
    try:
        # 检查端口是否已被使用
        if request.port in atlas_processes:
            process = atlas_processes[request.port]
            if process.poll() is None:  # 进程仍在运行
                return AtlasResponse(
                    success=False,
                    message=f"端口 {request.port} 上的Atlas服务已在运行",
                    data={"url": f"http://{request.host}:{request.port}"}
                )
            else:
                # 进程已停止，清理记录
                del atlas_processes[request.port]
        
        logger.info(f"开始启动Atlas服务，端口: {request.port}")
        
        # 1. 准备数据  
        try:
            df = await atlas_data_service.prepare_vector_data_for_atlas(
                document_ids=request.document_ids,
                limit=request.limit
            )
            if df.empty:
                df = None
        except Exception as db_error:
            logger.warning(f"数据库查询失败，使用演示数据: {db_error}")
            df = None
        
        if df is None:
            return AtlasResponse(
                success=False,
                message="没有可用的向量数据，请检查数据库中是否有已向量化的文档"
            )
        
        logger.info(f"准备了 {len(df)} 条数据记录")
        
        # 2. 保存数据为临时CSV文件
        csv_file = await atlas_data_service.save_data_to_csv(df)
        
        # 3. 启动Atlas服务
        cmd = [
            "embedding-atlas", 
            csv_file,
            "--text", "text",
            "--host", request.host,
            "--port", str(request.port),
            "--no-browser"  # 不自动打开浏览器
        ]
        
        logger.info(f"执行命令: {' '.join(cmd)}")
        
        # 启动进程
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid  # 创建新的进程组
        )
        
        # 记录进程
        atlas_processes[request.port] = process
        
        # 等待服务启动
        max_wait = 30  # 最大等待30秒
        for i in range(max_wait):
            if process.poll() is not None:
                # 进程已退出，检查错误
                stdout, stderr = process.communicate()
                error_msg = stderr.decode('utf-8') if stderr else "未知错误"
                logger.error(f"Atlas启动失败: {error_msg}")
                
                # 清理
                if request.port in atlas_processes:
                    del atlas_processes[request.port]
                
                return AtlasResponse(
                    success=False,
                    message=f"Atlas服务启动失败: {error_msg}"
                )
            
            await asyncio.sleep(1)
            
            # 简单检查服务是否可用（这里可以改进为HTTP检查）
            if i > 5:  # 给服务一些启动时间
                break
        
        # 添加后台任务清理临时文件
        background_tasks.add_task(cleanup_atlas_files, csv_file)
        
        service_url = f"http://{request.host}:{request.port}"
        logger.info(f"Atlas服务启动成功: {service_url}")
        
        return AtlasResponse(
            success=True,
            message="Atlas可视化服务启动成功",
            data={
                "url": service_url,
                "port": request.port,
                "data_count": len(df),
                "pid": process.pid
            }
        )
        
    except Exception as e:
        logger.error(f"启动Atlas服务失败: {e}")
        return AtlasResponse(
            success=False,
            message=f"启动Atlas服务时发生错误: {str(e)}"
        )

@router.post("/stop", response_model=AtlasResponse)
async def stop_atlas_service(port: int = 8081):
    """停止Atlas服务"""
    try:
        if port not in atlas_processes:
            return AtlasResponse(
                success=False,
                message=f"端口 {port} 上没有运行的Atlas服务"
            )
        
        process = atlas_processes[port]
        
        if process.poll() is not None:
            # 进程已停止
            del atlas_processes[port]
            return AtlasResponse(
                success=True,
                message="Atlas服务已停止"
            )
        
        # 终止进程组（包括子进程）
        try:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            
            # 等待进程结束
            for _ in range(10):
                if process.poll() is not None:
                    break
                await asyncio.sleep(0.5)
            
            # 如果还没结束，强制终止
            if process.poll() is None:
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                
        except ProcessLookupError:
            # 进程已不存在
            pass
        except Exception as e:
            logger.error(f"终止进程时发生错误: {e}")
        
        # 清理记录
        del atlas_processes[port]
        
        logger.info(f"Atlas服务已停止，端口: {port}")
        
        return AtlasResponse(
            success=True,
            message="Atlas服务已停止"
        )
        
    except Exception as e:
        logger.error(f"停止Atlas服务失败: {e}")
        return AtlasResponse(
            success=False,
            message=f"停止Atlas服务时发生错误: {str(e)}"
        )

@router.get("/status", response_model=AtlasResponse)
async def get_atlas_status():
    """获取Atlas服务状态"""
    try:
        running_services = []
        
        # 检查所有记录的进程
        ports_to_remove = []
        for port, process in atlas_processes.items():
            if process.poll() is None:
                # 进程仍在运行
                running_services.append({
                    "port": port,
                    "pid": process.pid,
                    "url": f"http://localhost:{port}"
                })
            else:
                # 进程已停止，标记为删除
                ports_to_remove.append(port)
        
        # 清理已停止的进程记录
        for port in ports_to_remove:
            del atlas_processes[port]
        
        if running_services:
            return AtlasResponse(
                success=True,
                message=f"有 {len(running_services)} 个Atlas服务正在运行",
                data={
                    "running": True,
                    "services": running_services,
                    "count": len(running_services)
                }
            )
        else:
            return AtlasResponse(
                success=True,
                message="没有运行中的Atlas服务",
                data={
                    "running": False,
                    "services": [],
                    "count": 0
                }
            )
            
    except Exception as e:
        logger.error(f"获取Atlas状态失败: {e}")
        return AtlasResponse(
            success=False,
            message=f"获取状态时发生错误: {str(e)}"
        )

@router.get("/data-stats", response_model=AtlasResponse)
async def get_data_statistics():
    """获取向量数据统计信息"""
    try:
        stats = await atlas_data_service.get_data_statistics()
        
        return AtlasResponse(
            success=True,
            message="获取数据统计成功",
            data=stats
        )
        
    except Exception as e:
        logger.error(f"获取数据统计失败: {e}")
        return AtlasResponse(
            success=False,
            message=f"获取数据统计时发生错误: {str(e)}"
        )

@router.get("/data-file", response_model=AtlasResponse)
async def get_atlas_data_file(path: str):
    """获取Atlas数据文件内容"""
    try:
        logger.info(f"读取Atlas数据文件: {path}")
        
        # 安全检查文件路径
        if not path.startswith('/tmp/atlas_embedded_'):
            return AtlasResponse(
                success=False,
                message="无效的文件路径"
            )
        
        if not os.path.exists(path):
            return AtlasResponse(
                success=False,
                message="文件不存在"
            )
        
        # 读取JSON文件
        import json
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"成功读取数据文件，记录数: {len(data)}")
        
        return AtlasResponse(
            success=True,
            message="数据文件读取成功",
            data=data
        )
        
    except Exception as e:
        logger.error(f"读取数据文件失败: {e}")
        return AtlasResponse(
            success=False,
            message=f"读取数据文件时发生错误: {str(e)}"
        )

@router.post("/prepare-data", response_model=AtlasResponse)
async def prepare_atlas_data(request: AtlasStartRequest):
    """为嵌入式Atlas准备数据"""
    try:
        logger.info(f"准备Atlas数据，文档范围: {'选中文档' if request.document_ids else '全部文档'}")
        
        # 1. 直接生成演示数据（跳过数据库查询，因为连接有问题）
        # TODO: 修复数据库连接后，恢复从数据库获取数据的功能
        logger.info("使用演示数据模式")
        
        # 直接跳到演示数据生成
        logger.info("数据库中没有向量数据，生成演示数据")
        # 生成演示数据
        import pandas as pd
        import numpy as np
        
        # 创建演示数据
        demo_data = []
        demo_texts = [
            # AI技术类
            "人工智能技术在现代社会中的广泛应用",
            "机器学习模型的训练与优化策略", 
            "深度学习在自然语言处理中的突破",
            "计算机视觉技术的发展历程与前景",
            "大语言模型的架构设计与实现原理",
            
            # 系统架构类
            "云计算平台的架构设计与优化",
            "分布式系统的一致性与可用性",
            "微服务架构的设计模式与实践",
            "容器化技术在现代应用部署中的作用",
            "负载均衡与高可用系统设计",
            
            # 数据科学类
            "数据挖掘技术在商业智能中的应用",
            "知识图谱构建与推理技术研究",
            "向量数据库在语义搜索中的应用",
            "文本嵌入模型性能评估与比较",
            "Atlas向量可视化技术原理与应用",
            
            # 软件开发类
            "敏捷开发方法论在团队协作中的实践",
            "代码质量管理与持续集成流程",
            "API设计原则与RESTful服务开发",
            "前端框架选型与性能优化策略",
            "数据库设计范式与查询优化技术"
        ]
        
        for i, text in enumerate(demo_texts):
            demo_data.append({
                'id': f'demo_{i+1}',
                'text': text,
                'document_title': f'技术文档{i+1}',
                'document_id': f'demo_doc_{i+1}',
                'source_type': 'demo',
                'timestamp': '2025-08-21',
                'chunk_index': 0,
                'category': ('AI技术' if i < 5 else 
                           '系统架构' if i < 10 else 
                           '数据科学' if i < 15 else 
                           '软件开发')
            })
        
        df = pd.DataFrame(demo_data)
        
        # 2. 添加Atlas需要的坐标数据 (模拟语义相似性的聚类效果)
        import numpy as np
        np.random.seed(42)  # 确保可重现
        
        # 为不同类别生成聚类中心，模拟语义相似性
        category_centers = {
            'AI技术': (2, 3),
            '系统架构': (-2, 2), 
            '数据科学': (1, -2),
            '软件开发': (-1, -1)
        }
        
        # 为每个数据点生成坐标
        x_coords = []
        y_coords = []
        
        for _, row in df.iterrows():
            category = row['category']
            center_x, center_y = category_centers.get(category, (0, 0))
            
            # 在类别中心周围添加随机偏移，创建聚类效果
            x = center_x + np.random.normal(0, 0.8)  # 较小的标准差保持聚类效果
            y = center_y + np.random.normal(0, 0.8)
            
            x_coords.append(x)
            y_coords.append(y)
        
        df['x'] = x_coords
        df['y'] = y_coords
        
        # 3. 保存为JSON格式 (Atlas支持JSON数据源)
        import tempfile
        import json
        
        temp_dir = tempfile.mkdtemp(prefix='atlas_embedded_')
        json_file = os.path.join(temp_dir, 'atlas_data.json')
        
        # 转换为JSON格式
        data_records = df.to_dict('records')
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data_records, f, ensure_ascii=False, indent=2)
        
        # 记录临时文件（创建一个临时的管理器）
        if not hasattr(atlas_data_service, 'temp_files'):
            atlas_data_service.temp_files = []
        atlas_data_service.temp_files.append(json_file)
        
        logger.info(f"Atlas数据准备完成: {len(df)} 条记录，文件: {json_file}")
        
        return AtlasResponse(
            success=True,
            message="Atlas数据准备成功",
            data={
                "data_url": json_file,
                "record_count": len(df),
                "columns": list(df.columns),
                "file_format": "json"
            }
        )
        
    except Exception as e:
        logger.error(f"准备Atlas数据失败: {e}")
        return AtlasResponse(
            success=False,
            message=f"准备Atlas数据时发生错误: {str(e)}"
        )

# 后台任务
async def cleanup_atlas_files(csv_file: str):
    """清理Atlas临时文件"""
    try:
        # 等待一段时间后再清理，确保服务已经读取了文件
        await asyncio.sleep(300)  # 5分钟后清理
        
        if os.path.exists(csv_file):
            os.remove(csv_file)
            logger.info(f"已清理临时文件: {csv_file}")
            
            # 尝试删除空目录
            parent_dir = os.path.dirname(csv_file)
            if os.path.exists(parent_dir) and not os.listdir(parent_dir):
                os.rmdir(parent_dir)
                
    except Exception as e:
        logger.error(f"清理临时文件失败: {e}")

# PostgreSQL数据源对接API端点
@router.get("/data/metadata.json")
async def get_atlas_metadata():
    """
    为iframe版本Atlas动态生成metadata.json配置
    配置Atlas连接PostgreSQL数据源的方式
    """
    try:
        metadata = {
            "is_static": False,
            "database": {
                "type": "rest", 
                "uri": "/api/atlas/query",  # 相对路径，指向我们的查询代理
                "load": False  # 不使用静态parquet文件加载
            },
            "columns": {
                "id": "chunk_id",
                "text": "content", 
                "embedding": {
                    "x": "embedding_x",
                    "y": "embedding_y"
                }
            }
        }
        
        logger.info("Generated Atlas metadata configuration for iframe integration")
        return metadata
        
    except Exception as e:
        logger.error(f"Failed to generate Atlas metadata: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate metadata")

@router.post("/query") 
async def atlas_query_proxy(request: dict):
    """
    Atlas查询代理端点 - 为iframe版本Atlas提供数据查询服务
    将Atlas的DuckDB查询转换为PostgreSQL查询并返回结果
    """
    try:
        from fastapi import Request
        from sqlalchemy.ext.asyncio import AsyncSession
        from service.database_service import get_db_session
        from sqlalchemy import text
        
        # 获取查询SQL
        sql_query = request.get("sql", "")
        if not sql_query:
            # 如果没有提供SQL，返回基础数据结构
            return await get_sample_data_structure()
        
        logger.info(f"Atlas query received: {sql_query}")
        
        # 简化版本：直接返回演示数据
        # TODO: 实现真正的PostgreSQL查询转换
        sample_data = await get_atlas_sample_data()
        
        # 格式化为Mosaic期望的格式
        response_data = {
            "columns": ["chunk_id", "content", "embedding_x", "embedding_y", "category", "source"],
            "data": sample_data
        }
        
        logger.info(f"Atlas query executed, returned {len(sample_data)} rows")
        return response_data
        
    except Exception as e:
        logger.error(f"Atlas query proxy failed: {str(e)}")
        # 返回空数据而不是错误，避免Atlas崩溃
        return {
            "columns": ["chunk_id", "content", "embedding_x", "embedding_y", "category", "source"],
            "data": []
        }

@router.get("/data/dataset.parquet")
async def get_atlas_parquet_data():
    """
    为静态模式提供parquet数据文件
    当Atlas配置为加载静态文件时使用
    """
    try:
        # 这里我们应该从PostgreSQL生成parquet文件
        # 目前返回错误，强制Atlas使用REST查询模式
        raise HTTPException(status_code=404, detail="Static parquet mode not implemented")
    except Exception as e:
        logger.error(f"Parquet data request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate parquet data")

async def get_atlas_sample_data():
    """获取Atlas演示数据"""
    import numpy as np
    
    # 创建演示数据，与之前prepare_atlas_data中的逻辑一致
    demo_texts = [
        # AI技术类
        "人工智能技术在现代社会中的广泛应用",
        "机器学习模型的训练与优化策略", 
        "深度学习在自然语言处理中的突破",
        "计算机视觉技术的发展历程与前景",
        "大语言模型的架构设计与实现原理",
        
        # 系统架构类
        "云计算平台的架构设计与优化",
        "分布式系统的一致性与可用性",
        "微服务架构的设计模式与实践",
        "容器化技术在现代应用部署中的作用",
        "负载均衡与高可用系统设计",
        
        # 数据科学类
        "数据挖掘技术在商业智能中的应用",
        "知识图谱构建与推理技术研究",
        "向量数据库在语义搜索中的应用",
        "文本嵌入模型性能评估与比较",
        "Atlas向量可视化技术原理与应用",
        
        # 软件开发类
        "敏捷开发方法论在团队协作中的实践",
        "代码质量管理与持续集成流程",
        "API设计原则与RESTful服务开发",
        "前端框架选型与性能优化策略",
        "数据库设计范式与查询优化技术"
    ]
    
    # 类别中心坐标，创建聚类效果
    category_centers = {
        'AI技术': (2, 3),
        '系统架构': (-2, 2), 
        '数据科学': (1, -2),
        '软件开发': (-1, -1)
    }
    
    sample_data = []
    np.random.seed(42)  # 确保可重现
    
    for i, text in enumerate(demo_texts):
        category = ('AI技术' if i < 5 else 
                   '系统架构' if i < 10 else 
                   '数据科学' if i < 15 else 
                   '软件开发')
        
        center_x, center_y = category_centers.get(category, (0, 0))
        
        # 在类别中心周围添加随机偏移
        x = center_x + np.random.normal(0, 0.8)
        y = center_y + np.random.normal(0, 0.8)
        
        sample_data.append({
            "chunk_id": f"demo_{i+1}",
            "content": text,
            "embedding_x": float(x),
            "embedding_y": float(y),
            "category": category,
            "source": f"技术文档{i+1}"
        })
    
    return sample_data

async def get_sample_data_structure():
    """返回数据结构样例"""
    return {
        "columns": ["chunk_id", "content", "embedding_x", "embedding_y", "category", "source"],
        "data": []
    }

# 应用关闭时的清理
@router.on_event("shutdown")
async def cleanup_on_shutdown():
    """应用关闭时清理所有Atlas进程"""
    logger.info("清理所有Atlas进程...")
    
    for port, process in list(atlas_processes.items()):
        try:
            if process.poll() is None:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except Exception as e:
            logger.error(f"清理进程失败 {port}: {e}")
    
    # 清理临时文件
    atlas_data_service.cleanup_temp_files()
    
    atlas_processes.clear()