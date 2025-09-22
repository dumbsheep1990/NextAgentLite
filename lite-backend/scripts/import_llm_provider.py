#!/usr/bin/env python3
import os
import sys
import json
import httpx

BASE = os.environ.get("LLM_CONFIG_GATEWAY_URL", "http://127.0.0.1:9050").rstrip('/')

def main():
    if len(sys.argv) < 5:
        print("Usage: import_llm_provider.py <name> <type> <base_url> <api_key>")
        sys.exit(1)
    name, typ, base_url, api_key = sys.argv[1:5]
    payload = {
        "name": name,
        "type": typ,
        "base_url": base_url,
        "api_key_enc": api_key,
        "status": "active"
    }
    with httpx.Client(timeout=10.0) as client:
        r = client.post(f"{BASE}/v1/providers", json=payload)
        r.raise_for_status()
        print("Provider created:", r.json())

if __name__ == '__main__':
    main()

