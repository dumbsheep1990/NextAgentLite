import os
import time
from typing import Any, Dict, Optional

import jwt


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def _get_secret() -> str:
    secret = _env("SECRET_KEY", "")
    if not secret:
        # Fallback to a dev key if not configured
        secret = "dev-secret-change-me"
    return secret


def _get_exp_minutes() -> int:
    val = _env("JWT_EXPIRE_MINUTES", "30")
    try:
        return int(val)
    except Exception:
        return 30


def create_access_token(claims: Dict[str, Any], expire_minutes: Optional[int] = None) -> str:
    """Create a JWT access token using HS256.

    claims will be augmented with standard `exp` field.
    """
    secret = _get_secret()
    exp_minutes = expire_minutes if expire_minutes is not None else _get_exp_minutes()
    payload = {**claims}
    payload["exp"] = int(time.time()) + exp_minutes * 60
    token = jwt.encode(payload, secret, algorithm="HS256")
    # PyJWT>=2 returns str
    return token


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT. Returns claims if valid, else None."""
    try:
        secret = _get_secret()
        data = jwt.decode(token, secret, algorithms=["HS256"])  # type: ignore
        return data  # type: ignore
    except Exception:
        return None

