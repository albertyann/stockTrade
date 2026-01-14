from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.analysis_rule import AnalysisRuleResponse, AnalysisRuleCreate, AnalysisRuleUpdate
from ...crud import analysis_rule as rule_crud
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()


@router.post("/", response_model=AnalysisRuleResponse)
async def create_analysis_rule(
    rule: AnalysisRuleCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return rule_crud.create_analysis_rule(db=db, rule=rule, user_id=current_user.id)


@router.get("/", response_model=List[AnalysisRuleResponse])
async def read_analysis_rules(
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rules = rule_crud.get_analysis_rules_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return rules


@router.get("/{rule_id}", response_model=AnalysisRuleResponse)
async def read_analysis_rule(
    rule_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rule = rule_crud.get_analysis_rule(db, rule_id=rule_id)
    if rule is None or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    return rule


@router.put("/{rule_id}", response_model=AnalysisRuleResponse)
async def update_analysis_rule(
    rule_id: int,
    rule: AnalysisRuleUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_rule = rule_crud.get_analysis_rule(db, rule_id=rule_id)
    if db_rule is None or db_rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    return rule_crud.update_analysis_rule(db=db, rule_id=rule_id, rule=rule)


@router.delete("/{rule_id}")
async def delete_analysis_rule(
    rule_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_rule = rule_crud.get_analysis_rule(db, rule_id=rule_id)
    if db_rule is None or db_rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    success = rule_crud.delete_analysis_rule(db=db, rule_id=rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    return {"message": "Analysis rule deleted successfully"}
