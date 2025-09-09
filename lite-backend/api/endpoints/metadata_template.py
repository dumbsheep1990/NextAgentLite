"""
元数据模版管理API接口

提供四种元数据模版的管理和查询功能：
- 通用场景元数据模版
- 政策问答场景元数据模版  
- 学术领域元数据模版
- 企业场景元数据模版
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

try:
    from db.database import get_db, get_async_session
except ImportError:
    from database import get_db, get_async_session

try:
    from service.knowledge_collection.template_service import MetadataTemplateService
    from service.metadata_extraction.extraction_service import MetadataExtractionService
except ImportError:
    # 暂时跳过服务导入，避免阻塞API注册
    MetadataTemplateService = None
    MetadataExtractionService = None

router = APIRouter(tags=["Metadata Templates"])

# Request/Response Models
class TemplateResponse(BaseModel):
    """元数据模版响应模型"""
    id: str
    name: str
    type: str
    description: Optional[str] = None
    template_schema: Dict[str, Any]
    extraction_config: Dict[str, Any]
    is_system_default: bool
    status: str
    created_at: str
    updated_at: str

class TemplateListResponse(BaseModel):
    """元数据模版列表响应"""
    templates: List[TemplateResponse]
    total: int

class MetadataExtractionRequest(BaseModel):
    """元数据提取请求模型"""
    template_id: str = Field(..., description="元数据模版ID")
    content: str = Field(..., description="文档内容")
    filename: Optional[str] = Field(None, description="文件名称")
    additional_context: Optional[Dict[str, Any]] = Field(None, description="额外上下文信息")

class MetadataExtractionResponse(BaseModel):
    """元数据提取响应模型"""
    template_id: str
    template_name: str
    extracted_metadata: Dict[str, Any]
    confidence_score: Optional[float] = None
    extraction_time: float
    validation_result: Dict[str, Any]

class TemplateValidationResponse(BaseModel):
    """模版验证响应"""
    is_valid: bool
    validation_errors: List[str]
    suggestions: List[str]

# API Endpoints
@router.get("/", response_model=TemplateListResponse)
async def list_templates(
    template_type: Optional[str] = Query(None, description="模版类型过滤"),
    status: Optional[str] = Query("active", description="状态过滤"),
    include_system_defaults: bool = Query(True, description="是否包含系统默认模版"),
    db: AsyncSession = Depends(get_db)
):
    """获取元数据模版列表"""
    try:
        service = MetadataTemplateService(db)
        # Simple call with only the parameters we know work
        if template_type:
            templates = await service.list_templates(template_type=template_type)
        else:
            templates = await service.list_templates()
        
        template_responses = []
        for template in templates:
            try:
                # 添加调试信息
                logger.info(f"处理模板: {template.id}, 类型: {type(template)}, 属性: {dir(template)}")
                
                template_responses.append(TemplateResponse(
                    id=template.id,
                    name=template.name,
                    type=template.template_type,  # 修正：使用template_type字段
                    description=template.description,
                    template_schema=template.schema_definition,  # 修正：使用schema_definition字段
                    extraction_config=template.extraction_config or {},
                    is_system_default=template.is_system,  # 修正：使用is_system字段
                    status="active" if template.is_active else "inactive",  # 修正：根据is_active生成状态
                    created_at=template.created_at.isoformat(),
                    updated_at=template.updated_at.isoformat() if template.updated_at else template.created_at.isoformat()
                ))
            except AttributeError as e:
                logger.error(f"模板对象属性访问失败: {e}, 对象: {template}, 类型: {type(template)}")
                raise
        
        return TemplateListResponse(
            templates=template_responses,
            total=len(template_responses)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模版列表失败: {str(e)}")

@router.get("/types")
async def get_template_types():
    """获取可用的模版类型"""
    # 返回静态的模版类型配置
    return {
        "types": [
            {
                "id": "general",
                "name": "通用场景",
                "description": "适用于一般文档的通用元数据提取"
            },
            {
                "id": "policy",
                "name": "政策问答",
                "description": "专门针对政策文档的结构化元数据提取"
            },
            {
                "id": "academic",
                "name": "学术领域",
                "description": "学术论文和研究文档的专业元数据"
            },
            {
                "id": "enterprise",
                "name": "企业场景",
                "description": "企业内部文档和知识管理元数据"
            }
        ]
    }

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取指定元数据模版详情"""
    try:
        service = MetadataTemplateService(db)
        template = await service.get_template(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="元数据模版未找到")
        
        return TemplateResponse(
            id=template.id,
            name=template.name,
            type=template.template_type,
            description=template.description,
            template_schema=template.schema_definition,
            extraction_config=template.extraction_config or {},
            is_system_default=template.is_system,
            status="active" if template.is_active else "inactive",
            created_at=template.created_at.isoformat(),
            updated_at=template.updated_at.isoformat() if template.updated_at else template.created_at.isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模版详情失败: {str(e)}")

@router.get("/{template_id}/schema")
async def get_template_schema(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取元数据模版的JSON Schema"""
    try:
        service = MetadataTemplateService(db)
        template = await service.get_template(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="元数据模版未找到")
        
        return {
            "template_id": template_id,
            "template_name": template.name,
            "template_type": template.template_type,
            "schema": template.schema_definition,
            "extraction_config": template.extraction_config
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模版Schema失败: {str(e)}")

@router.post("/extract", response_model=MetadataExtractionResponse)
async def extract_metadata(
    request: MetadataExtractionRequest,
    db: AsyncSession = Depends(get_db)
):
    """使用指定模版提取文档元数据"""
    try:
        # 获取模版信息
        template_service = MetadataTemplateService(db)
        template = await template_service.get_template(request.template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="元数据模版未找到")
        
        # 执行元数据提取
        extraction_service = MetadataExtractionService(db)
        result = await extraction_service.extract_metadata(
            content=request.content,
            template_type=template.template_type,
            filename=request.filename,
            additional_context=request.additional_context or {}
        )
        
        return MetadataExtractionResponse(
            template_id=request.template_id,
            template_name=template.name,
            extracted_metadata=result.extracted_metadata,
            confidence_score=result.confidence_score,
            extraction_time=result.extraction_time,
            validation_result=result.validation_result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"元数据提取失败: {str(e)}")

@router.post("/batch-extract")
async def batch_extract_metadata(
    requests: List[MetadataExtractionRequest],
    db: AsyncSession = Depends(get_db)
):
    """批量提取元数据"""
    try:
        extraction_service = MetadataExtractionService(db)
        template_service = MetadataTemplateService(db)
        
        results = []
        for request in requests:
            try:
                # 获取模版信息
                template = await template_service.get_template(request.template_id)
                if not template:
                    results.append({
                        "template_id": request.template_id,
                        "status": "error",
                        "error": "模版未找到"
                    })
                    continue
                
                # 执行提取
                result = await extraction_service.extract_metadata(
                    content=request.content,
                    template_type=template.template_type,
                    filename=request.filename,
                    additional_context=request.additional_context or {}
                )
                
                results.append({
                    "template_id": request.template_id,
                    "template_name": template.name,
                    "status": "success",
                    "extracted_metadata": result.extracted_metadata,
                    "confidence_score": result.confidence_score,
                    "extraction_time": result.extraction_time,
                    "validation_result": result.validation_result
                })
            
            except Exception as e:
                results.append({
                    "template_id": request.template_id,
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "batch_results": results,
            "total_processed": len(requests),
            "success_count": len([r for r in results if r["status"] == "success"]),
            "error_count": len([r for r in results if r["status"] == "error"])
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量提取失败: {str(e)}")

@router.post("/{template_id}/validate", response_model=TemplateValidationResponse)
async def validate_template(
    template_id: str,
    metadata: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """验证元数据是否符合模版规范"""
    try:
        service = MetadataTemplateService(db)
        template = await service.get_template(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="元数据模版未找到")
        
        validation_result = await service.validate_metadata(template_id, metadata)
        
        return TemplateValidationResponse(
            is_valid=validation_result["is_valid"],
            validation_errors=validation_result.get("errors", []),
            suggestions=validation_result.get("suggestions", [])
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"模版验证失败: {str(e)}")

@router.get("/{template_id}/statistics")
async def get_template_usage_statistics(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取元数据模版使用统计"""
    try:
        service = MetadataTemplateService(db)
        template = await service.get_template(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="元数据模版未找到")
        
        stats = await service.get_template_usage_stats(template_id)
        
        return {
            "template_id": template_id,
            "template_name": template.name,
            "template_type": template.template_type,
            "usage_statistics": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")