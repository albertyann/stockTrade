from sqlalchemy.orm import Session
from ..models.uploaded_file import UploadedFile
from ..schemas.uploaded_file import UploadedFileCreate, UploadedFileUpdate
from typing import Optional


def get_uploaded_file(db: Session, file_id: int) -> Optional[UploadedFile]:
    return db.query(UploadedFile).filter(UploadedFile.id == file_id).first()


def get_uploaded_files_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(UploadedFile).filter(UploadedFile.user_id == user_id).offset(skip).limit(limit).all()


def get_uploaded_files_by_stock(db: Session, user_id: int, stock_id: int, skip: int = 0, limit: int = 100):
    return db.query(UploadedFile).filter(
        UploadedFile.user_id == user_id,
        UploadedFile.stock_id == stock_id
    ).offset(skip).limit(limit).all()


def create_uploaded_file(db: Session, file: UploadedFileCreate, user_id: int, file_path: str, file_size: int) -> UploadedFile:
    db_file = UploadedFile(
        **file.model_dump(),
        user_id=user_id,
        file_path=file_path,
        file_size=file_size
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def update_uploaded_file(db: Session, file_id: int, file: UploadedFileUpdate) -> Optional[UploadedFile]:
    db_file = get_uploaded_file(db, file_id)
    if db_file:
        update_data = file.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_file, key, value)
        db.commit()
        db.refresh(db_file)
    return db_file


def delete_uploaded_file(db: Session, file_id: int) -> bool:
    db_file = get_uploaded_file(db, file_id)
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False
