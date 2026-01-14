from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
import httpx
import json


class AIServiceBase(ABC):
    """AI 服务基类"""

    @abstractmethod
    def generate_analysis(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """生成分析方案"""
        pass

    @abstractmethod
    def generate_script(self, rules: list, stock_data: list) -> tuple[str, str]:
        """生成 Python 分析脚本和推理理由"""
        pass


class OpenAIService(AIServiceBase):
    """OpenAI AI 服务"""

    def __init__(self, api_key: str, model: str = "gpt-4", temperature: float = 0.7, 
                 max_tokens: int = 2000, timeout: int = 60):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.base_url = "https://api.openai.com/v1"

    async def generate_analysis(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """生成分析方案"""
        try:
            messages = [
                {"role": "system", "content": "你是一个专业的股票分析专家，擅长基于规则生成Python分析脚本。"},
                {"role": "user", "content": prompt}
            ]

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result["choices"][0]["message"]["content"]
                return {"success": True, "content": content}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def generate_script(self, rules: list, stock_data: list) -> tuple[str, str]:
        """生成 Python 分析脚本和推理理由"""
        
        rules_text = "\n".join([
            f"- {rule['name']}: {rule['description']}\n  Conditions: {json.dumps(rule['conditions'], ensure_ascii=False)}"
            for rule in rules
        ])
        
        stock_data_sample = json.dumps(stock_data[:5], ensure_ascii=False) if stock_data else "[]"
        
        prompt = f"""我有一组股票分析规则，请根据这些规则生成一个Python分析脚本。

规则列表：
{rules_text}

股票数据样本：
{stock_data_sample}

请生成一个完整的Python脚本，要求：
1. 定义一个分析函数 analyze_stocks(stocks)，接收股票数据列表
2. 函数返回匹配的股票列表，每个股票包含 id 和 match_reason
3. 脚本应该安全，不包含任何危险操作
4. 使用纯Python标准库，不要导入外部依赖（除非是数据分析库）
5. 在脚本开头添加详细的注释说明分析逻辑
6. 匹配逻辑要覆盖所有规则

脚本输出格式（JSON）：
```json
{{
  "script": "完整的Python脚本代码",
  "reasoning": "详细的推理过程和理由说明"
}}
```

请严格按照以上要求输出JSON格式。"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "你是一个专业的股票分析专家，擅长生成Python分析脚本。总是返回有效的JSON格式。"},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result["choices"][0]["message"]["content"]
                
                # 尝试解析 JSON
                try:
                    # 提取 JSON 部分
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()
                    
                    data = json.loads(content)
                    script = data.get("script", "")
                    reasoning = data.get("reasoning", content)
                    return script, reasoning
                except json.JSONDecodeError:
                    # 如果无法解析，返回原始内容作为推理
                    return "", content
                
        except Exception as e:
            return "", f"AI 生成失败: {str(e)}"


class AnthropicService(AIServiceBase):
    """Anthropic AI 服务"""

    def __init__(self, api_key: str, model: str = "claude-3-opus-20240229", temperature: float = 0.7,
                 max_tokens: int = 2000, timeout: int = 60):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.base_url = "https://api.anthropic.com/v1"

    async def generate_analysis(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """生成分析方案"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": self.max_tokens,
                        "temperature": self.temperature,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result["content"][0]["text"]
                return {"success": True, "content": content}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def generate_script(self, rules: list, stock_data: list) -> tuple[str, str]:
        """生成 Python 分析脚本和推理理由"""
        rules_text = "\n".join([
            f"- {rule['name']}: {rule['description']}\n  Conditions: {json.dumps(rule['conditions'], ensure_ascii=False)}"
            for rule in rules
        ])
        
        stock_data_sample = json.dumps(stock_data[:5], ensure_ascii=False) if stock_data else "[]"
        
        prompt = f"""我有一组股票分析规则，请根据这些规则生成一个Python分析脚本。

规则列表：
{rules_text}

股票数据样本：
{stock_data_sample}

请生成一个完整的Python脚本，要求：
1. 定义一个分析函数 analyze_stocks(stocks)，接收股票数据列表
2. 函数返回匹配的股票列表，每个股票包含 id 和 match_reason
3. 脚本应该安全，不包含任何危险操作
4. 使用纯Python标准库，不要导入外部依赖（除非是数据分析库）
5. 在脚本开头添加详细的注释说明分析逻辑
6. 匹配逻辑要覆盖所有规则

脚本输出格式（JSON）：
```json
{{
  "script": "完整的Python脚本代码",
  "reasoning": "详细的推理过程和理由说明"
}}
```

请严格按照以上要求输出JSON格式。"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": self.max_tokens,
                        "temperature": self.temperature,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result["content"][0]["text"]
                
                # 尝试解析 JSON
                try:
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()
                    
                    data = json.loads(content)
                    script = data.get("script", "")
                    reasoning = data.get("reasoning", content)
                    return script, reasoning
                except json.JSONDecodeError:
                    return "", content
                
        except Exception as e:
            return "", f"AI 生成失败: {str(e)}"


class LocalLLMService(AIServiceBase):
    """本地 LLM 服务（如 Ollama）"""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2", 
                 temperature: float = 0.7, timeout: int = 60):
        self.base_url = base_url
        self.model = model
        self.temperature = temperature
        self.timeout = timeout

    async def generate_analysis(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """生成分析方案"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": self.temperature
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result.get("response", "")
                return {"success": True, "content": content}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def generate_script(self, rules: list, stock_data: list) -> tuple[str, str]:
        """生成 Python 分析脚本和推理理由"""
        rules_text = "\n".join([
            f"- {rule['name']}: {rule['description']}\n  Conditions: {json.dumps(rule['conditions'], ensure_ascii=False)}"
            for rule in rules
        ])
        
        stock_data_sample = json.dumps(stock_data[:5], ensure_ascii=False) if stock_data else "[]"
        
        prompt = f"""我有一组股票分析规则，请根据这些规则生成一个Python分析脚本。

规则列表：
{rules_text}

股票数据样本：
{stock_data_sample}

请生成一个完整的Python脚本，要求：
1. 定义一个分析函数 analyze_stocks(stocks)，接收股票数据列表
2. 函数返回匹配的股票列表，每个股票包含 id 和 match_reason
3. 脚本应该安全，不包含任何危险操作
4. 使用纯Python标准库
5. 在脚本开头添加详细的注释说明分析逻辑

请直接输出脚本代码，不需要JSON格式。"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": self.temperature
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                script = result.get("response", "")
                return script, "使用本地 LLM 生成"
                
        except Exception as e:
            return "", f"AI 生成失败: {str(e)}"


def get_ai_service(config: Dict[str, Any]) -> AIServiceBase:
    """根据配置获取 AI 服务实例"""
    provider = config.get("provider", "openai")
    
    if provider == "openai":
        return OpenAIService(
            api_key=config.get("api_key", ""),
            model=config.get("model", "gpt-4"),
            temperature=config.get("temperature", 0.7),
            max_tokens=config.get("max_tokens", 2000),
            timeout=config.get("timeout", 60)
        )
    elif provider == "anthropic":
        return AnthropicService(
            api_key=config.get("api_key", ""),
            model=config.get("model", "claude-3-opus-20240229"),
            temperature=config.get("temperature", 0.7),
            max_tokens=config.get("max_tokens", 2000),
            timeout=config.get("timeout", 60)
        )
    elif provider == "local":
        return LocalLLMService(
            base_url=config.get("base_url", "http://localhost:11434"),
            model=config.get("model", "llama2"),
            temperature=config.get("temperature", 0.7),
            timeout=config.get("timeout", 60)
        )
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")
