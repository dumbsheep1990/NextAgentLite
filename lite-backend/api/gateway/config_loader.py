"""
API网关配置加载器
从YAML文件加载服务配置，支持环境变量替换
"""
import os
import yaml
import re
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ServiceConfig:
    """服务配置数据类"""
    name: str
    base_url: str
    prefix: str
    description: str
    enabled: bool
    timeout: int
    health_check: Optional[str]


@dataclass
class HTTPClientConfig:
    """HTTP客户端配置数据类"""
    connect_timeout: int
    read_timeout: int
    write_timeout: int
    max_keepalive_connections: int
    max_connections: int
    follow_redirects: bool
    max_retries: int
    retry_on_timeout: bool
    retry_status_codes: list


@dataclass
class GatewayConfig:
    """网关全局配置数据类"""
    enable_health_check: bool
    health_check_interval: int
    enable_request_logging: bool
    enable_cors: bool
    cors_origins: list
    cors_methods: list
    cors_headers: list


class GatewayConfigLoader:
    """API网关配置加载器"""

    def __init__(self, config_path: Optional[str] = None):
        """
        初始化配置加载器

        Args:
            config_path: 配置文件路径，默认为 lite-backend/config/gateway_services.yaml
        """
        if config_path is None:
            # 默认配置文件路径
            base_dir = Path(__file__).parent.parent.parent
            config_path = base_dir / "config" / "gateway_services.yaml"

        self.config_path = Path(config_path)
        self._raw_config: Optional[Dict[str, Any]] = None
        self._services: Dict[str, ServiceConfig] = {}
        self._http_config: Optional[HTTPClientConfig] = None
        self._gateway_config: Optional[GatewayConfig] = None

    def load(self) -> None:
        """加载配置文件"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"配置文件不存在: {self.config_path}")

        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 替换环境变量
            content = self._substitute_env_vars(content)

            # 解析YAML
            self._raw_config = yaml.safe_load(content)

            # 加载各部分配置
            self._load_services()
            self._load_http_config()
            self._load_gateway_config()

            logger.info(f"[网关配置] 成功加载配置文件: {self.config_path}")
            logger.info(f"[网关配置] 已启用服务: {', '.join([s for s, cfg in self._services.items() if cfg.enabled])}")

        except Exception as e:
            logger.error(f"[网关配置] 加载配置失败: {e}")
            raise

    def _substitute_env_vars(self, content: str) -> str:
        """
        替换环境变量
        支持格式: ${VAR_NAME:default_value}
        """
        pattern = r'\$\{([^}:]+)(?::([^}]*))?\}'

        def replacer(match):
            var_name = match.group(1)
            default_value = match.group(2) if match.group(2) is not None else ''
            return os.getenv(var_name, default_value)

        return re.sub(pattern, replacer, content)

    def _load_services(self) -> None:
        """加载服务配置"""
        services_config = self._raw_config.get('services', {})

        for service_key, service_data in services_config.items():
            self._services[service_key] = ServiceConfig(
                name=service_data.get('name', service_key),
                base_url=service_data.get('base_url', 'http://localhost:8000'),
                prefix=service_data.get('prefix', f'/{service_key}'),
                description=service_data.get('description', ''),
                enabled=service_data.get('enabled', True),
                timeout=service_data.get('timeout', 60),
                health_check=service_data.get('health_check')
            )

    def _load_http_config(self) -> None:
        """加载HTTP客户端配置"""
        http_config = self._raw_config.get('http_client', {})
        pool_config = http_config.get('pool', {})
        retry_config = http_config.get('retry', {})

        self._http_config = HTTPClientConfig(
            connect_timeout=http_config.get('connect_timeout', 30),
            read_timeout=http_config.get('read_timeout', 300),
            write_timeout=http_config.get('write_timeout', 300),
            max_keepalive_connections=pool_config.get('max_keepalive_connections', 50),
            max_connections=pool_config.get('max_connections', 100),
            follow_redirects=http_config.get('follow_redirects', True),
            max_retries=retry_config.get('max_retries', 3),
            retry_on_timeout=retry_config.get('retry_on_timeout', True),
            retry_status_codes=retry_config.get('retry_status_codes', [502, 503, 504])
        )

    def _load_gateway_config(self) -> None:
        """加载网关全局配置"""
        gateway_config = self._raw_config.get('gateway', {})

        self._gateway_config = GatewayConfig(
            enable_health_check=gateway_config.get('enable_health_check', True),
            health_check_interval=gateway_config.get('health_check_interval', 60),
            enable_request_logging=gateway_config.get('enable_request_logging', True),
            enable_cors=gateway_config.get('enable_cors', True),
            cors_origins=gateway_config.get('cors_origins', ['*']),
            cors_methods=gateway_config.get('cors_methods', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
            cors_headers=gateway_config.get('cors_headers', ['*'])
        )

    def get_service(self, service_key: str) -> Optional[ServiceConfig]:
        """获取服务配置"""
        return self._services.get(service_key)

    def get_enabled_services(self) -> Dict[str, ServiceConfig]:
        """获取所有已启用的服务"""
        return {k: v for k, v in self._services.items() if v.enabled}

    def get_http_config(self) -> HTTPClientConfig:
        """获取HTTP客户端配置"""
        return self._http_config

    def get_gateway_config(self) -> GatewayConfig:
        """获取网关全局配置"""
        return self._gateway_config

    def reload(self) -> None:
        """重新加载配置"""
        logger.info("[网关配置] 重新加载配置文件")
        self.load()


# 全局配置加载器实例
_config_loader: Optional[GatewayConfigLoader] = None


def get_config_loader() -> GatewayConfigLoader:
    """获取全局配置加载器实例"""
    global _config_loader
    if _config_loader is None:
        _config_loader = GatewayConfigLoader()
        _config_loader.load()
    return _config_loader


def reload_config() -> None:
    """重新加载配置"""
    global _config_loader
    if _config_loader is not None:
        _config_loader.reload()
    else:
        _config_loader = GatewayConfigLoader()
        _config_loader.load()
