from sqlalchemy.orm import Session
from ..models.investment_note import InvestmentNote
from ..schemas.investment_note import InvestmentNoteCreate, InvestmentNoteUpdate
from typing import Optional


def get_investment_note(db: Session, note_id: int) -> Optional[InvestmentNote]:
    return db.query(InvestmentNote).filter(InvestmentNote.id == note_id).first()


def get_investment_notes_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(InvestmentNote).filter(InvestmentNote.user_id == user_id).offset(skip).limit(limit).all()


def get_investment_notes_by_stock(db: Session, user_id: int, stock_id: int, skip: int = 0, limit: int = 100):
    return db.query(InvestmentNote).filter(
        InvestmentNote.user_id == user_id,
        InvestmentNote.stock_id == stock_id
    ).offset(skip).limit(limit).all()


def create_investment_note(db: Session, note: InvestmentNoteCreate, user_id: int) -> InvestmentNote:
    db_note = InvestmentNote(**note.model_dump(), user_id=user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def update_investment_note(db: Session, note_id: int, note: InvestmentNoteUpdate) -> Optional[InvestmentNote]:
    db_note = get_investment_note(db, note_id)
    if db_note:
        update_data = note.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_note, key, value)
        db.commit()
        db.refresh(db_note)
    return db_note


def delete_investment_note(db: Session, note_id: int) -> bool:
    db_note = get_investment_note(db, note_id)
    if db_note:
        db.delete(db_note)
        db.commit()
        return True
    return False
