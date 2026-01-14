from sqlalchemy.orm import Session
from ..models.analysis_rule import AnalysisRule
from typing import Dict, Any, List
from datetime import datetime


class RuleEngine:
    def __init__(self, db_session: Session):
        self.db = db_session
        
    def evaluate_rule(self, rule: AnalysisRule, stock_code: str, data: Dict[str, Any]) -> bool:
        """
        评估单条规则
        """
        conditions = rule.conditions.get("conditions", [])
        logic = rule.conditions.get("logic", "AND")
        
        results = []
        for condition in conditions:
            result = self._evaluate_condition(condition, stock_code, data)
            results.append(result)
            
        if logic == "AND":
            return all(results)
        elif logic == "OR":
            return any(results)
        else:
            raise ValueError(f"Unsupported logic operator: {logic}")
            
    def _evaluate_condition(self, condition: Dict[str, Any], stock_code: str, data: Dict[str, Any]) -> bool:
        """
        评估单个条件
        """
        indicator = condition.get("indicator")
        operator = condition.get("operator")
        value = condition.get("value")
        
        if indicator == "price":
            return self._compare(data.get("price", 0), operator, value)
        elif indicator == "volume":
            return self._compare(data.get("volume", 0), operator, value)
        elif indicator == "ma20":
            return self._compare(data.get("ma20", 0), operator, value)
        elif indicator == "pe":
            return self._compare(data.get("pe", 0), operator, value)
        elif indicator == "roe":
            return self._compare(data.get("roe", 0), operator, value)
        elif indicator == "eps":
            return self._compare(data.get("eps", 0), operator, value)
        elif indicator == "dividend_yield":
            return self._compare(data.get("dividend_yield", 0), operator, value)
        else:
            raise ValueError(f"Unsupported indicator: {indicator}")
            
    def _compare(self, a: float, operator: str, b: float) -> bool:
        """
        比较操作
        """
        if operator == "gt":
            return a > b
        elif operator == "lt":
            return a < b
        elif operator == "gte":
            return a >= b
        elif operator == "lte":
            return a <= b
        elif operator == "eq":
            return a == b
        elif operator == "neq":
            return a != b
        else:
            raise ValueError(f"Unsupported operator: {operator}")
            
    def get_enabled_rules(self) -> List[AnalysisRule]:
        """
        获取所有启用的规则
        """
        return self.db.query(AnalysisRule).filter(AnalysisRule.enabled == True).all()
        
    def get_stocks_to_analyze(self) -> List[Dict[str, Any]]:
        """
        获取需要分析的股票数据
        """
        # 这里可以根据需要获取需要分析的股票列表
        # 目前简单返回所有股票
        from models import Stock
        stocks = self.db.query(Stock).all()
        return [{"id": stock.id, "code": stock.code} for stock in stocks]
        
    def get_stock_analysis_data(self, stock_id: int) -> Dict[str, Any]:
        """
        获取股票分析数据
        """
        # 这里应该从数据库或API获取股票数据
        # 目前返回模拟数据
        return {
            "price": 100.50,
            "volume": 1000000,
            "ma20": 98.20,
            "pe": 15.5,
            "roe": 12.3,
            "eps": 6.5,
            "dividend_yield": 2.5
        }
        
    def save_analysis_results(self, results: List[Dict[str, Any]]):
        """
        保存分析结果
        """
        # 这里应该保存分析结果到数据库
        from models import AnalysisResult
        for result in results:
            db_result = AnalysisResult(
                rule_id=result["rule_id"],
                stock_id=result["stock_id"],
                timestamp=result["timestamp"],
                data=result["data"],
                matched=result.get("matched", True)
            )
            self.db.add(db_result)
        self.db.commit()
        
    def send_analysis_notifications(self, results: List[Dict[str, Any]]):
        """
        发送分析通知
        """
        # 这里应该实现通知功能，如邮件、推送通知等
        print(f"发送分析通知，共有 {len(results)} 个匹配结果")
        for result in results:
            print(f"规则 {result['rule_id']} 匹配股票 {result['stock_id']}")
