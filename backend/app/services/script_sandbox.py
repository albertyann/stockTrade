import asyncio
import json
import sys
import time
from typing import Dict, Any, List, Tuple, Optional
from io import StringIO
import traceback
import os


class ScriptSandbox:
    """Python 脚本沙箱执行器"""

    def __init__(self, timeout: int = 300, max_memory: int = 256 * 1024 * 1024):
        self.timeout = timeout
        self.max_memory = max_memory
        self.dangerous_modules = {
            'os', 'subprocess', 'sys', 'shutil', 'glob', 'tempfile',
            'socket', 'http', 'urllib', 'requests', 'ftplib',
            'pickle', 'shelve', 'marshal', 'dbm', 'sqlite3',
            'multiprocessing', 'threading', 'concurrent',
            'signal', 'ctypes', 'ctypes.util', 'ctypes.wintypes',
            'platform', 'pwd', 'grp', 'getpass', 'crypt',
            'commands', 'popen2', 'posix', 'nt'
        }
        self.dangerous_functions = {
            '__import__', 'eval', 'exec', 'compile',
            'open', 'input', 'raw_input',
            'reload', 'help', 'dir', 'vars', 'locals', 'globals',
            'exit', 'quit',
        }

    def _is_safe_script(self, script: str) -> Tuple[bool, Optional[str]]:
        """检查脚本是否安全"""
        # 检查危险模块导入
        for module in self.dangerous_modules:
            if f'import {module}' in script or f'from {module}' in script:
                return False, f"不允许导入模块: {module}"

        # 检查危险函数调用
        for func in self.dangerous_functions:
            if f'{func}(' in script:
                return False, f"不允许调用函数: {func}"

        # 检查其他危险操作
        dangerous_patterns = [
            '__code__', '__dict__', '__bases__', '__subclasses__',
            'file://', 'http://', 'https://', 'ftp://',
            'exec(', 'eval(',
            'os.', 'subprocess.', 'sys.',
        ]

        for pattern in dangerous_patterns:
            if pattern in script:
                return False, f"检测到危险操作: {pattern}"

        return True, None

    def _prepare_execution_env(self) -> Dict[str, Any]:
        """准备安全的执行环境"""
        # 只允许安全的模块和函数
        safe_modules = {
            'json': json,
            'datetime': __import__('datetime'),
            'math': __import__('math'),
            'statistics': __import__('statistics'),
        }

        # 创建安全的全局命名空间
        safe_globals = {
            '__builtins__': {
                'len': len,
                'range': range,
                'list': list,
                'dict': dict,
                'str': str,
                'int': int,
                'float': float,
                'bool': bool,
                'abs': abs,
                'min': min,
                'max': max,
                'sum': sum,
                'any': any,
                'all': all,
                'print': print,  # 允许 print
            },
            **safe_modules,
        }

        return safe_globals

    async def execute_script(
        self,
        script: str,
        stocks: List[Dict[str, Any]]
    ) -> Tuple[bool, List[int], Dict[str, Any]]:
        """执行 Python 脚本"""

        execution_log = {
            "start_time": time.time(),
            "script_length": len(script),
            "input_stocks_count": len(stocks),
            "steps": []
        }

        # 安全检查
        is_safe, error = self._is_safe_script(script)
        if not is_safe:
            execution_log["error"] = error
            execution_log["end_time"] = time.time()
            execution_log["duration"] = execution_log["end_time"] - execution_log["start_time"]
            return False, [], execution_log

        execution_log["steps"].append({"step": "security_check", "status": "passed"})

        # 准备执行环境
        safe_globals = self._prepare_execution_env()
        execution_log["steps"].append({"step": "prepare_environment", "status": "completed"})

        # 重定向 stdout 以捕获 print 输出
        old_stdout = sys.stdout
        sys.stdout = StringIO()

        try:
            # 使用 asyncio 的超时机制
            loop = asyncio.get_event_loop()
            
            # 定义执行函数
            def exec_script():
                try:
                    exec_globals = safe_globals.copy()
                    exec_globals['stocks'] = stocks
                    exec(script, exec_globals)
                    
                    # 检查是否有分析函数
                    if 'analyze_stocks' in exec_globals and callable(exec_globals['analyze_stocks']):
                        results = exec_globals['analyze_stocks'](stocks)
                        return results
                    else:
                        # 如果没有返回结果，尝试从全局变量获取
                        if 'matched_stocks' in exec_globals:
                            return exec_globals['matched_stocks']
                        return []
                except Exception as e:
                    raise e

            # 执行脚本（带超时）
            results = await asyncio.wait_for(
                loop.run_in_executor(None, exec_script),
                timeout=self.timeout
            )

            # 获取打印输出
            captured_output = sys.stdout.getvalue()
            execution_log["output"] = captured_output

            # 提取匹配的股票 ID
            matched_stock_ids = []
            if isinstance(results, list):
                for item in results:
                    if isinstance(item, dict):
                        stock_id = item.get('id') or item.get('stock_id')
                        if stock_id:
                            matched_stock_ids.append(int(stock_id))
                    elif isinstance(item, int):
                        matched_stock_ids.append(item)

            execution_log["matched_stocks"] = matched_stock_ids
            execution_log["steps"].append({"step": "execute_script", "status": "completed"})
            execution_log["success"] = True

            return True, matched_stock_ids, execution_log

        except asyncio.TimeoutError:
            execution_log["error"] = f"脚本执行超时（{self.timeout}秒）"
            execution_log["steps"].append({"step": "execute_script", "status": "timeout"})
            execution_log["success"] = False
            return False, [], execution_log

        except Exception as e:
            execution_log["error"] = str(e)
            execution_log["traceback"] = traceback.format_exc()
            execution_log["steps"].append({"step": "execute_script", "status": "failed"})
            execution_log["success"] = False
            return False, [], execution_log

        finally:
            sys.stdout = old_stdout
            execution_log["end_time"] = time.time()
            execution_log["duration"] = execution_log["end_time"] - execution_log["start_time"]


class ScriptValidator:
    """脚本验证器"""

    @staticmethod
    def validate_script_structure(script: str) -> Tuple[bool, Optional[str]]:
        """验证脚本结构"""
        if not script or not script.strip():
            return False, "脚本为空"

        # 检查是否有定义函数
        if 'def ' not in script:
            return False, "脚本未定义任何函数"

        return True, None

    @staticmethod
    def extract_analysis_function(script: str) -> Optional[str]:
        """提取分析函数"""
        # 查找 analyze_stocks 函数定义
        lines = script.split('\n')
        function_lines = []
        in_function = False
        indent_level = None

        for line in lines:
            if 'def analyze_stocks' in line:
                in_function = True
                indent_level = len(line) - len(line.lstrip())
                function_lines.append(line)
            elif in_function:
                current_indent = len(line) - len(line.lstrip())
                if current_indent <= indent_level and line.strip():
                    break
                function_lines.append(line)

        if function_lines:
            return '\n'.join(function_lines)
        return None

    @staticmethod
    def generate_test_script(stock_data: List[Dict[str, Any]]) -> str:
        """生成测试脚本"""
        return f"""
def analyze_stocks(stocks):
    '''示例分析函数 - 过滤价格大于 50 的股票'''
    results = []
    for stock in stocks:
        try:
            price = stock.get('price', 0) or 0
            if price > 50:
                results.append({{
                    'id': stock.get('id'),
                    'code': stock.get('code'),
                    'name': stock.get('name'),
                    'price': price,
                    'match_reason': f'价格 {{price}} 大于 50'
                }})
        except Exception as e:
            print(f"Error processing stock {{stock.get('code')}}: {{e}}")
    return results

# 测试数据
test_stocks = {json.dumps(stock_data[:3], ensure_ascii=False)}

# 执行分析
if __name__ == '__main__':
    matched = analyze_stocks(test_stocks)
    print(f"匹配到 {{len(matched)}} 只股票:")
    for stock in matched:
        print(f"  - {{stock.get('code')}}: {{stock.get('name')}} ({{stock.get('match_reason')}})")
"""


# 全局沙箱实例
sandbox = ScriptSandbox()
