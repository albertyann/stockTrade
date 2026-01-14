from sqlalchemy.orm import Session
from ..models.analysis_rule import AnalysisRule
from ..schemas.analysis_rule import AnalysisRuleCreate, AnalysisRuleUpdate
from typing import Optional


def get_analysis_rule(db: Session, rule_id: int) -> Optional[AnalysisRule]:
    return db.query(AnalysisRule).filter(AnalysisRule.id == rule_id).first()


def get_analysis_rules_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisRule).filter(AnalysisRule.user_id == user_id).offset(skip).limit(limit).all()


def get_enabled_analysis_rules_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisRule).filter(
        AnalysisRule.user_id == user_id,
        AnalysisRule.enabled == True
    ).offset(skip).limit(limit).all()


def create_analysis_rule(db: Session, rule: AnalysisRuleCreate, user_id: int) -> AnalysisRule:
    db_rule = AnalysisRule(**rule.model_dump(), user_id=user_id)
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def update_analysis_rule(db: Session, rule_id: int, rule: AnalysisRuleUpdate) -> Optional[AnalysisRule]:
    db_rule = get_analysis_rule(db, rule_id)
    if db_rule:
        update_data = rule.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_rule, key, value)
        db.commit()
        db.refresh(db_rule)
    return db_rule


def delete_analysis_rule(db: Session, rule_id: int) -> bool:
    db_rule = get_analysis_rule(db, rule_id)
    if db_rule:
        db.delete(db_rule)
        db.commit()
        return True
    return False
