from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.investment_note import InvestmentNoteResponse, InvestmentNoteCreate, InvestmentNoteUpdate, PaginatedInvestmentNotes
from ...crud import investment_note as note_crud
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()


@router.post("/", response_model=InvestmentNoteResponse)
async def create_investment_note(
    note: InvestmentNoteCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return note_crud.create_investment_note(db=db, note=note, user_id=current_user.id)


@router.get("/", response_model=PaginatedInvestmentNotes)
async def read_investment_notes(
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    notes = note_crud.get_investment_notes_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return notes


@router.get("/{note_id}", response_model=InvestmentNoteResponse)
async def read_investment_note(
    note_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    note = note_crud.get_investment_note(db, note_id=note_id)
    if note is None or note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment note not found")
    return note


@router.put("/{note_id}", response_model=InvestmentNoteResponse)
async def update_investment_note(
    note_id: int,
    note: InvestmentNoteUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_note = note_crud.get_investment_note(db, note_id=note_id)
    if db_note is None or db_note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment note not found")
    return note_crud.update_investment_note(db=db, note_id=note_id, note=note)


@router.delete("/{note_id}")
async def delete_investment_note(
    note_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_note = note_crud.get_investment_note(db, note_id=note_id)
    if db_note is None or db_note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment note not found")
    success = note_crud.delete_investment_note(db=db, note_id=note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Investment note not found")
    return {"message": "Investment note deleted successfully"}
