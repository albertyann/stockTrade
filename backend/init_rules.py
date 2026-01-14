from app.database import SessionLocal
from app.crud.user import get_user_by_username
from app.crud.analysis_rule import create_analysis_rule, get_analysis_rules_by_user
from app.schemas.analysis_rule import AnalysisRuleCreate


def init_analysis_rules():
    db = SessionLocal()
    
    try:
        username = "admin"
        user = get_user_by_username(db, username=username)
        
        if not user:
            print(f"Admin user '{username}' not found. Please run create_admin.py first.")
            return
        
        existing_rules = get_analysis_rules_by_user(db, user_id=user.id)
        if existing_rules:
            print(f"User '{username}' already has {len(existing_rules)} analysis rules.")
            print("If you want to reset the rules, please delete them first.")
            return
        
        rules_data = [
            {
                "name": "价值投资选股策略",
                "description": "寻找价格低于100元的优质股票，适合价值投资",
                "conditions": {
                    "conditions": [
                        {"indicator": "price", "operator": "lt", "value": 100}
                    ],
                    "logic": "AND"
                },
                "priority": 1,
                "enabled": True
            },
            {
                "name": "成长股筛选策略",
                "description": "筛选今日涨幅超过3%的股票，捕捉短期上涨机会",
                "conditions": {
                    "conditions": [
                        {"indicator": "change", "operator": "gt", "value": 3}
                    ],
                    "logic": "AND"
                },
                "priority": 2,
                "enabled": True
            },
            {
                "name": "蓝筹股优选策略",
                "description": "筛选价格高于50元的优质股票，关注蓝筹股机会",
                "conditions": {
                    "conditions": [
                        {"indicator": "price", "operator": "gt", "value": 50}
                    ],
                    "logic": "AND"
                },
                "priority": 3,
                "enabled": True
            }
        ]
        
        for rule_data in rules_data:
            rule_create = AnalysisRuleCreate(**rule_data)
            rule = create_analysis_rule(db, rule_create, user_id=user.id)
            print(f"Created rule: {rule.name} (ID: {rule.id})")
        
        print(f"\nSuccessfully initialized {len(rules_data)} analysis rules for user '{username}'!")
        
    except Exception as e:
        print(f"Error initializing analysis rules: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_analysis_rules()
