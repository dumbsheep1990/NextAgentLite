import os
import re

try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
    encoder = None  # 延迟初始化
except ImportError:
    TIKTOKEN_AVAILABLE = False
    encoder = None


def get_encoder():
    """获取tiktoken编码器，使用延迟初始化"""
    global encoder
    if not TIKTOKEN_AVAILABLE:
        return None
    if encoder is None:
        try:
            encoder = tiktoken.get_encoding("cl100k_base")
        except Exception:
            return None
    return encoder


def singleton(cls, *args, **kw):
    instances = {}

    def _singleton():
        key = str(cls) + str(os.getpid())
        if key not in instances:
            instances[key] = cls(*args, **kw)
        return instances[key]

    return _singleton


def split_text_by_delimiter(text, max_token_num, delimiter="。；！？"):
    """
       根据分隔符分割文本，确保每个 chunk 的 token 数不超过 max_token_num。

       Args:
           text (str): 待分割的文本。
       Returns:
           list: 分割后的文本块列表。
    """
    chunks = []
    current_chunk = ""
    current_token_count = 0

    # 使用正则表达式按多个分隔符分割文本，同时保留分隔符
    pattern = f"([{re.escape(delimiter)}])"
    parts = re.split(pattern, text)
    for part in parts:
        if not part:  # 跳过空字符串
            continue
        part_token_count = num_tokens_from_string(part)
        # 如果当前 part 是分隔符，直接附加到当前 chunk
        if part in delimiter:
            if current_chunk:
                current_chunk += part
            continue

        if current_token_count < max_token_num:
            if current_chunk:
                current_chunk += part
            else:
                current_chunk = part
            current_token_count += part_token_count
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = part
            current_token_count = part_token_count

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def num_tokens_from_string(string: str) -> int:
    """返回文本字符串中记号的数目。"""
    enc = get_encoder()
    if enc is None:
        # 使用字符数的粗略估算：平均每个token约2.5个字符
        return len(string) // 3
    try:
        return len(enc.encode(string))
    except Exception:
        return len(string) // 3


def truncate(string: str, max_len: int) -> str:
    """如果文本长度超过max_len，则返回截断的文本。"""
    enc = get_encoder()
    if enc is None:
        # 使用字符截断的粗略方法
        char_limit = max_len * 3  # 估算token到字符的转换
        return string[:char_limit] if len(string) > char_limit else string
    try:
        return enc.decode(enc.encode(string)[:max_len])
    except Exception:
        char_limit = max_len * 3
        return string[:char_limit] if len(string) > char_limit else string

