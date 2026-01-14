from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.analysis_result import AnalysisResultResponse
from ...crud import analysis_result as result_crud, analysis_rule as rule_crud
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()


@router.get("/", response_model=List[AnalysisResultResponse])
async def read_analysis_results(
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    results = result_crud.get_analysis_results_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return results


@router.get("/{result_id}", response_model=AnalysisResultResponse)
async def read_analysis_result(
    result_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = result_crud.get_analysis_result(db, result_id=result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    rule = rule_crud.get_analysis_rule(db, rule_id=result.rule_id)
    if rule is None or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    return result


@router.delete("/{result_id}")
async def delete_analysis_result(
    result_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = result_crud.get_analysis_result(db, result_id=result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    rule = rule_crud.get_analysis_rule(db, rule_id=result.rule_id)
    if rule is None or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    success = result_crud.delete_analysis_result(db=db, result_id=result_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    return {"message": "Analysis result deleted successfully"}
