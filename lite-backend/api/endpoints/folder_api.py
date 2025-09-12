"""
文件夹管理API接口
提供文件夹的增删改查和文档管理功能
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from db.database import get_db
from service.folder_service_simple import SimpleFolderService
from core.logger import logger


router = APIRouter(prefix="/folders", tags=["文件夹管理"])


# Pydantic 模型
class FolderCreateRequest(BaseModel):
    """创建文件夹请求"""
    name: str = Field(..., min_length=1, max_length=200, description="文件夹名称")
    collection_id: str = Field(..., description="知识库ID")
    parent_folder_id: Optional[str] = Field(None, description="父文件夹ID")
    description: Optional[str] = Field(None, max_length=1000, description="文件夹描述")
    metadata: Optional[Dict[str, Any]] = Field(None, description="文件夹元数据")


class FolderUpdateRequest(BaseModel):
    """更新文件夹请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="文件夹名称")
    description: Optional[str] = Field(None, max_length=1000, description="文件夹描述")
    metadata: Optional[Dict[str, Any]] = Field(None, description="文件夹元数据")


class FolderMoveRequest(BaseModel):
    """移动文件夹请求"""
    new_parent_id: Optional[str] = Field(None, description="新父文件夹ID，null表示移动到根目录")


class DocumentMoveRequest(BaseModel):
    """移动文档到文件夹请求"""
    document_ids: List[str] = Field(..., description="文档ID列表")
    target_folder_id: str = Field(..., description="目标文件夹ID")


@router.post("/", summary="创建文件夹")
async def create_folder(
    request: FolderCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    创建新文件夹
    - 支持最多2层嵌套（根文件夹 + 子文件夹）
    - 同级文件夹名称必须唯一
    """
    try:
        folder_service = SimpleFolderService(db)
        result = await folder_service.create_folder(
            name=request.name,
            collection_id=request.collection_id,
            parent_folder_id=request.parent_folder_id,
            description=request.description,
            metadata=request.metadata,
            created_by="user"  # TODO: 从认证信息获取
        )
        
        return {
            "success": True,
            "data": result["folder"],
            "message": result["message"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Create folder API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建文件夹失败: {str(e)}")


@router.get("/collection/{collection_id}", summary="获取知识库文件夹列表")
async def get_collection_folders(
    collection_id: str = Path(..., description="知识库ID"),
    parent_folder_id: Optional[str] = Query(None, description="父文件夹ID"),
    recursive: bool = Query(False, description="是否递归获取所有子文件夹"),
    include_documents: bool = Query(True, description="是否包含文档统计信息"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取知识库中的文件夹列表
    - parent_folder_id=None: 获取根文件夹
    - recursive=True: 递归获取所有层级的文件夹
    """
    try:
        folder_service = SimpleFolderService(db)
        folders = await folder_service.get_folders_by_collection(
            collection_id=collection_id,
            parent_folder_id=parent_folder_id,
            include_documents=include_documents,
            recursive=recursive
        )
        
        return {
            "success": True,
            "data": folders,
            "total": len(folders)
        }
        
    except Exception as e:
        logger.error(f"Get collection folders API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取文件夹列表失败: {str(e)}")


@router.get("/collection/{collection_id}/hierarchy", summary="获取文件夹层级结构")
async def get_folder_hierarchy(
    collection_id: str = Path(..., description="知识库ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取完整的文件夹层级树结构"""
    try:
        folder_service = SimpleFolderService(db)
        result = await folder_service.get_folder_hierarchy(collection_id)
        
        return {
            "success": True,
            "data": {
                "hierarchy": result["hierarchy"],
                "total_folders": result["total_folders"]
            }
        }
        
    except Exception as e:
        logger.error(f"Get folder hierarchy API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取文件夹层级结构失败: {str(e)}")


@router.put("/{folder_id}", summary="更新文件夹")
async def update_folder(
    folder_id: str = Path(..., description="文件夹ID"),
    request: FolderUpdateRequest = Body(...),
    collection_id: str = Query(..., description="知识库ID"),
    db: AsyncSession = Depends(get_db)
):
    """更新文件夹信息"""
    try:
        # 如果只是重命名
        folder_service = SimpleFolderService(db)
        if request.name and not request.description and not request.metadata:
            result = await folder_service.rename_folder(
                folder_id=folder_id,
                new_name=request.name,
                collection_id=collection_id
            )
        else:
            # TODO: 实现完整的更新逻辑
            raise HTTPException(status_code=501, detail="完整更新功能尚未实现")
        
        return {
            "success": True,
            "data": result["folder"],
            "message": result["message"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Update folder API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新文件夹失败: {str(e)}")


@router.put("/{folder_id}/move", summary="移动文件夹")
async def move_folder(
    folder_id: str = Path(..., description="文件夹ID"),
    request: FolderMoveRequest = Body(...),
    collection_id: str = Query(..., description="知识库ID"),
    db: AsyncSession = Depends(get_db)
):
    """移动文件夹到新的父文件夹"""
    try:
        folder_service = SimpleFolderService(db)
        result = await folder_service.move_folder(
            folder_id=folder_id,
            new_parent_id=request.new_parent_id,
            collection_id=collection_id
        )
        
        return {
            "success": True,
            "data": result["folder"],
            "message": result["message"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Move folder API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"移动文件夹失败: {str(e)}")


@router.delete("/{folder_id}", summary="删除文件夹")
async def delete_folder(
    folder_id: str = Path(..., description="文件夹ID"),
    collection_id: str = Query(..., description="知识库ID"),
    force: bool = Query(False, description="是否强制删除（包括子文件夹和文档）"),
    db: AsyncSession = Depends(get_db)
):
    """
    删除文件夹
    - force=False: 只能删除空文件夹
    - force=True: 删除文件夹并将内容移动到根文件夹
    """
    try:
        folder_service = SimpleFolderService(db)
        result = await folder_service.delete_folder(
            folder_id=folder_id,
            collection_id=collection_id,
            force=force
        )
        
        return {
            "success": True,
            "message": result["message"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Delete folder API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除文件夹失败: {str(e)}")


@router.get("/{folder_id}/documents", summary="获取文件夹中的文档")
async def get_folder_documents(
    folder_id: str = Path(..., description="文件夹ID"),
    collection_id: str = Query(..., description="知识库ID"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页大小"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    file_type: Optional[str] = Query(None, description="文件类型过滤"),
    status: Optional[str] = Query(None, description="状态过滤"),
    db: AsyncSession = Depends(get_db)
):
    """获取指定文件夹中的文档列表"""
    try:
        folder_service = SimpleFolderService(db)
        result = await folder_service.get_folder_documents(
            folder_id=folder_id,
            collection_id=collection_id,
            page=page,
            size=size,
            search_query=search,
            file_type=file_type,
            status_filter=status
        )
        
        return {
            "success": True,
            "data": {
                "documents": result["documents"],
                "folder": result["folder"],
                "pagination": {
                    "page": result["page"],
                    "size": result["size"],
                    "total": result["total"],
                    "total_pages": result["total_pages"]
                }
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Get folder documents API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取文件夹文档失败: {str(e)}")


@router.put("/{folder_id}/documents/move", summary="移动文档到文件夹")
async def move_documents_to_folder(
    folder_id: str = Path(..., description="目标文件夹ID"),
    request: DocumentMoveRequest = Body(...),
    collection_id: str = Query(..., description="知识库ID"),
    db: AsyncSession = Depends(get_db)
):
    """批量移动文档到指定文件夹"""
    try:
        # TODO: 实现文档移动功能
        # 这里需要调用知识文档服务来更新文档的folder_id
        raise HTTPException(status_code=501, detail="文档移动功能尚未实现")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Move documents API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"移动文档失败: {str(e)}")


@router.get("/metadata/filters", summary="获取元数据级别的过滤选项")
async def get_metadata_filters(
    collection_id: str = Query(..., description="知识库ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取可用的元数据过滤选项（文档分类、领域类型等）"""
    try:
        # TODO: 实现元数据过滤选项获取
        # 这里应该查询该知识库中所有文档的document_category和domain_type等字段的唯一值
        raise HTTPException(status_code=501, detail="元数据过滤功能尚未实现")
        
    except Exception as e:
        logger.error(f"Get metadata filters API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取过滤选项失败: {str(e)}")


# 健康检查接口
@router.get("/health", summary="文件夹服务健康检查")
async def folder_health_check():
    """文件夹服务健康检查"""
    return {
        "success": True,
        "service": "folder_management",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "create_folder": True,
            "nested_folders": True,
            "max_depth": 2,
            "folder_hierarchy": True,
            "document_organization": True,
            "metadata_filtering": False  # TODO: 待实现
        }
    }