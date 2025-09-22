from typing import Dict, Any
from core.logger import logger


class LLMUnifiedConfigService:
    def __init__(self) -> None:
        self._snapshot: Dict[str, Any] = {"providers": [], "models": [], "aliases": []}

    def set_snapshot(self, snap: Dict[str, Any]) -> None:
        self._snapshot = snap or {"providers": [], "models": [], "aliases": []}
        logger.info(f"[LLM_CONFIG] snapshot updated: providers={len(self._snapshot.get('providers', []))}, models={len(self._snapshot.get('models', []))}, aliases={len(self._snapshot.get('aliases', []))}")

    def get_snapshot(self) -> Dict[str, Any]:
        return self._snapshot


llm_unified_config_service = LLMUnifiedConfigService()

