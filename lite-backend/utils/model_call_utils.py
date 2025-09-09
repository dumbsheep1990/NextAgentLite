from typing import List, Dict

import requests
import json

api_key = "sk-wboEKdPyTgltngVIDCaVU6mHuEvmGik7keR03Fws1yE3HR9m"
url = "http://101.132.149.115:30504/v1"


def get_embeddings(input_text: str) -> str:
    """
    获取文本的嵌入表示。

    参数:
    - input_text: 要处理的文本

    返回:
    - 嵌入模型的响应内容
    """
    payload = json.dumps({
        "input": input_text,
        "model": "text-embedding-v1"
    })

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }

    response = requests.post(f"{url}/embeddings", headers=headers, data=payload)

    return response.json()["data"][0]["embedding"]


def get_chat_response(messages: List[Dict], model: str ="gpt-4o-mini") -> str:
    """
    获取聊天模型的回应。

    参数:
    - message: 用户发送的消息
    - model: 使用的模型名称
    - api_key: API 认证所需的 Bearer token

    返回:
    - 聊天模型的响应内容
    """
    payload = json.dumps({
        "model": model,
        "messages": messages
    })

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }

    response = requests.post(f"{url}/chat/completions", headers=headers, data=payload)

    return response.json()["choices"][0]["message"]['content']


# 使用示例
if __name__ == "__main__":
    # 例子1：获取文本嵌入
    embeddings_response = get_embeddings("测试文本" )
    print("Embeddings Response:", embeddings_response)

    # 例子2：获取聊天响应
    chat_response = get_chat_response([{"role":"user","content":"你好,你是谁？"}])
    print("Chat Response:", chat_response)
