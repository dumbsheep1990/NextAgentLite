import json
from enum import Enum
from typing import Union, List, Optional, Set

from pydantic import BaseModel


class ContentType(Enum):
    TEXT = "text"
    TABLE = "table"
    IMAGE = "image"


class DocumentBlock(BaseModel):
    type: ContentType = None
    content: str = None  # 文本内容、表格数据或图片base64
    headings: List[str] = None  # 层级标题，从一级到N级
    style: Optional[dict] = None  # 简化的样式信息
    page_number: Optional[Set[int]] = None  # 所在页码
    extra: Optional[dict] = None  # 额外信息

    class Config:
        # 自动将枚举转换为其值（例如 "text"）
        use_enum_values = True

    def to_dict(self):
        return {"type": self.type.value,
                "content": str(self.content),
                "headings": self.headings}
