
# 模型配置修复建议

# 1. 在config/config.yaml中添加安全的模型配置
models:
  default:
    provider: "one_api"
    model: "qwen3-235b-a22b-instruct-2507"
    max_tokens: 2048
    temperature: 0.1
    top_p: 0.9
    frequency_penalty: 0.0
    presence_penalty: 0.0
  
  safe_mode:
    provider: "one_api"
    model: "qwen3-235b-a22b-instruct-2507"
    max_tokens: 1024
    temperature: 0.0
    top_p: 0.9
    frequency_penalty: 0.0
    presence_penalty: 0.0

# 2. 在agent_service.py中添加模型配置验证
def _validate_model_config(self, config):
    """验证模型配置"""
    required_fields = ['provider', 'model', 'max_tokens', 'temperature']
    for field in required_fields:
        if field not in config:
            logger.warning(f"模型配置缺少字段: {field}")
            return False
    return True

# 3. 添加安全的模型调用方法
def _safe_model_invoke(self, agent, query, config=None):
    """安全的模型调用"""
    try:
        # 使用默认配置
        if config is None:
            config = {
                "max_tokens": 2048,
                "temperature": 0.1,
                "top_p": 0.9
            }
        
        # 验证配置
        if not self._validate_model_config(config):
            config = {
                "max_tokens": 1024,
                "temperature": 0.0,
                "top_p": 0.9
            }
        
        # 清理查询
        cleaned_query = self._validate_and_clean_input(query)
        
        # 调用模型
        return agent.run(cleaned_query, **config)
        
    except Exception as e:
        logger.error(f"模型调用失败: {e}")
        raise e
