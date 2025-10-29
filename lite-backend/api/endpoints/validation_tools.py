"""
敏感词校验工具API
提供简单的敏感词检测和校验功能
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from core.logger import logger

router = APIRouter(prefix="/validation-tools", tags=["校验工具"])


# ==================== 敏感词库配置 ====================

# 简单的敏感词库（实际使用时可以从数据库加载）
SENSITIVE_WORDS = {
    "政治类": ["暴力", "恐怖", "极端"],
    "色情类": ["色情", "淫秽"],
    "违法类": ["赌博", "毒品", "诈骗"],
    "其他": ["垃圾", "spam"]
}

# 中英文分类映射（支持英文参数传入）
CATEGORY_MAPPING = {
    "political": "政治类",
    "adult": "色情类",
    "illegal": "违法类",
    "legal": "违法类",  # legal也映射到违法类
    "ethnic": "政治类",  # ethnic映射到政治类（民族相关也属于政治敏感）
    "other": "其他"
}


# ==================== Pydantic Models ====================

class SensitiveWordCheckRequest(BaseModel):
    """敏感词检测请求"""
    text: str = Field(..., description="要检测的文本内容", min_length=1)
    categories: Optional[List[str]] = Field(
        None,
        description="要检测的敏感词类别，不指定则检测所有类别"
    )
    return_details: bool = Field(
        True,
        description="是否返回详细的匹配信息"
    )


class SensitiveWordMatch(BaseModel):
    """敏感词匹配信息"""
    word: str = Field(..., description="匹配到的敏感词")
    category: str = Field(..., description="敏感词类别")
    position: int = Field(..., description="在文本中的位置")


class SensitiveWordCheckResponse(BaseModel):
    """敏感词检测响应"""
    success: bool = Field(..., description="检测是否成功执行")
    is_valid: bool = Field(..., description="文本是否通过校验（无敏感词为True）")
    message: str = Field(..., description="检测结果消息")
    matched_count: int = Field(..., description="匹配到的敏感词数量")
    matches: Optional[List[SensitiveWordMatch]] = Field(
        None,
        description="详细的匹配信息列表"
    )
    checked_at: datetime = Field(..., description="检测时间")


# ==================== Helper Functions ====================

def check_sensitive_words(
    text: str,
    categories: Optional[List[str]] = None,
    return_details: bool = True
) -> Dict[str, Any]:
    """
    检测文本中的敏感词

    Args:
        text: 要检测的文本
        categories: 要检测的类别列表（支持中英文），None表示检测所有类别
        return_details: 是否返回详细匹配信息

    Returns:
        检测结果字典
    """
    matches = []

    # 确定要检测的类别
    if categories:
        # 将英文categories转换为中文
        check_categories = []
        for cat in categories:
            # 如果是英文，通过映射转换为中文
            if cat in CATEGORY_MAPPING:
                chinese_cat = CATEGORY_MAPPING[cat]
                if chinese_cat not in check_categories:
                    check_categories.append(chinese_cat)
            # 如果已经是中文，直接使用
            elif cat in SENSITIVE_WORDS:
                if cat not in check_categories:
                    check_categories.append(cat)

        logger.info(f"[敏感词检测] 类别转换: {categories} -> {check_categories}")
    else:
        check_categories = list(SENSITIVE_WORDS.keys())

    # 遍历各个类别的敏感词
    for category in check_categories:
        if category not in SENSITIVE_WORDS:
            continue

        words_in_category = SENSITIVE_WORDS[category]

        # 检测每个敏感词
        for word in words_in_category:
            # 查找所有出现位置
            start_pos = 0
            while True:
                pos = text.find(word, start_pos)
                if pos == -1:
                    break

                if return_details:
                    matches.append({
                        "word": word,
                        "category": category,
                        "position": pos
                    })
                else:
                    # 如果不需要详情，找到一个就可以返回
                    matches.append({})

                start_pos = pos + 1

    is_valid = len(matches) == 0

    return {
        "is_valid": is_valid,
        "matched_count": len(matches),
        "matches": matches if return_details else None,
        "message": "文本校验通过" if is_valid else f"检测到 {len(matches)} 个敏感词"
    }


# ==================== API Endpoints ====================

@router.post(
    "/sensitive-word-check",
    summary="敏感词检测",
    response_model=SensitiveWordCheckResponse
)
async def check_sensitive_word(request: SensitiveWordCheckRequest):
    """
    检测文本中是否包含敏感词

    Args:
        request: 敏感词检测请求

    Returns:
        检测结果，包含是否通过、匹配数量、详细匹配信息等
    """
    try:
        logger.info(f"[敏感词检测] 开始检测，文本长度: {len(request.text)}, 类别: {request.categories or '全部'}")

        # 执行敏感词检测
        result = check_sensitive_words(
            text=request.text,
            categories=request.categories,
            return_details=request.return_details
        )

        # 构造响应
        response = SensitiveWordCheckResponse(
            success=True,
            is_valid=result["is_valid"],
            message=result["message"],
            matched_count=result["matched_count"],
            matches=[
                SensitiveWordMatch(**match)
                for match in result["matches"]
            ] if result["matches"] else None,
            checked_at=datetime.now()
        )

        logger.info(
            f"[敏感词检测] 完成 - "
            f"是否通过: {response.is_valid}, "
            f"匹配数: {response.matched_count}"
        )

        return response

    except Exception as e:
        logger.error(f"[敏感词检测] 检测失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"敏感词检测失败: {str(e)}")


@router.get("/sensitive-words", summary="获取敏感词库")
async def get_sensitive_words(category: Optional[str] = None):
    """
    获取敏感词库配置

    Args:
        category: 类别名称，不指定则返回所有类别

    Returns:
        敏感词库配置
    """
    try:
        if category:
            if category not in SENSITIVE_WORDS:
                raise HTTPException(
                    status_code=404,
                    detail=f"类别不存在: {category}"
                )
            return {
                "success": True,
                "category": category,
                "words": SENSITIVE_WORDS[category]
            }
        else:
            return {
                "success": True,
                "categories": list(SENSITIVE_WORDS.keys()),
                "words": SENSITIVE_WORDS,
                "total_categories": len(SENSITIVE_WORDS),
                "total_words": sum(len(words) for words in SENSITIVE_WORDS.values())
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[敏感词库] 获取失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class AddSensitiveWordRequest(BaseModel):
    """添加敏感词请求"""
    category: str = Field(..., description="类别名称")
    word: str = Field(..., description="敏感词")


@router.post("/add-sensitive-word", summary="添加敏感词")
async def add_sensitive_word(request: AddSensitiveWordRequest):
    """
    添加新的敏感词到词库

    Args:
        request: 添加敏感词请求

    Returns:
        添加结果
    """
    category = request.category
    word = request.word
    try:
        # 如果类别不存在，创建新类别
        if category not in SENSITIVE_WORDS:
            SENSITIVE_WORDS[category] = []

        # 检查是否已存在
        if word in SENSITIVE_WORDS[category]:
            return {
                "success": False,
                "message": f"敏感词已存在: {word}"
            }

        # 添加敏感词
        SENSITIVE_WORDS[category].append(word)

        logger.info(f"[敏感词库] 添加成功 - 类别: {category}, 词: {word}")

        return {
            "success": True,
            "message": f"敏感词已添加: {word}",
            "category": category,
            "word": word
        }

    except Exception as e:
        logger.error(f"[敏感词库] 添加失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
