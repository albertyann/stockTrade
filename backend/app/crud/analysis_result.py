from sqlalchemy.orm import Session
from ..models.analysis_result import AnalysisResult
from ..schemas.analysis_result import AnalysisResult
from typing import Optional


def get_analysis_result(db: Session, result_id: int) -> Optional[AnalysisResult]:
    return db.query(AnalysisResult).filter(AnalysisResult.id == result_id).first()


def get_analysis_results_by_rule(db: Session, rule_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisResult).filter(AnalysisResult.rule_id == rule_id).offset(skip).limit(limit).all()


def get_analysis_results_by_stock(db: Session, stock_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisResult).filter(AnalysisResult.stock_id == stock_id).offset(skip).limit(limit).all()


def get_analysis_results_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisResult).join(AnalysisResult.rule).filter(
        AnalysisResult.user_id == user_id
    ).offset(skip).limit(limit).all()


def create_analysis_result(db: Session, result_data: dict) -> AnalysisResult:
    db_result = AnalysisResult(**result_data)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


def delete_analysis_result(db: Session, result_id: int) -> bool:
    db_result = get_analysis_result(db, result_id)
    if db_result:
        db.delete(db_result)
        db.commit()
        return True
    return False
