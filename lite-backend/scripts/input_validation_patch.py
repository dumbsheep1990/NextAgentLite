
# 输入验证补丁 - 添加到agent_service.py中

def _validate_and_clean_input(self, content):
    """验证和清理输入内容"""
    if content is None:
        return "空输入"
    
    if not isinstance(content, str):
        try:
            content = str(content)
        except:
            return "无效输入"
    
    # 移除控制字符
    content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
    
    # 规范化换行符
    content = re.sub(r'\r\n|\r', '\n', content)
    
    # 限制长度
    if len(content) > 8000:
        content = content[:8000] + "..."
    
    # 确保不为空
    if not content.strip():
        content = "空内容"
    
    return content.strip()

def _safe_model_call(self, agent, query, **kwargs):
    """安全的模型调用包装器"""
    try:
        # 验证和清理查询
        cleaned_query = self._validate_and_clean_input(query)
        
        # 设置安全的默认参数
        safe_params = {
            "max_tokens": 2048,
            "temperature": 0.1,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
        
        # 合并用户参数
        safe_params.update(kwargs)
        
        # 调用模型
        return agent.run(cleaned_query, **safe_params)
        
    except Exception as e:
        error_str = str(e)
        if "Input should be a valid string" in error_str:
            logger.warning(f"输入格式错误，尝试清理后重试: {error_str}")
            # 进一步清理
            ultra_cleaned_query = re.sub(r'[^\w\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef.,!?;:()\[\]{}"'-]', '', query)
            ultra_cleaned_query = ultra_cleaned_query[:1000]  # 限制长度
            return agent.run(ultra_cleaned_query, **safe_params)
        else:
            raise e
