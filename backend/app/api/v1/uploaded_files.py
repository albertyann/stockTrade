from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from ...database import get_db
from ...schemas.uploaded_file import UploadedFileResponse, UploadedFileCreate, UploadedFileUpdate
from ...crud import uploaded_file as file_crud
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse
from ...core.config import settings

router = APIRouter()


@router.post("/", response_model=List[UploadedFileResponse])
async def create_upload_file(
    stock_id: Optional[int] = 0,
    tags: str = None,
    files: List[UploadFile] = File(...),
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    tag_list = tags.split(",") if tags else []
    uploaded_files = []

    for file in files:
        file_content = await file.read()
        if len(file_content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' exceeds maximum size limit"
            )

        file_path = os.path.join(settings.UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(file_content)

        file_data = UploadedFileCreate(
            stock_id=stock_id,
            file_name=file.filename,
            file_type=file.content_type,
            tags=tag_list
        )

        uploaded_file = file_crud.create_uploaded_file(
            db=db,
            file=file_data,
            user_id=current_user.id,
            file_path=file_path,
            file_size=len(file_content)
        )
        uploaded_files.append(uploaded_file)

    return uploaded_files


@router.get("/", response_model=List[UploadedFileResponse])
async def read_upload_files(
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    files = file_crud.get_uploaded_files_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return files


@router.get("/{file_id}", response_model=UploadedFileResponse)
async def read_upload_file(
    file_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_file = file_crud.get_uploaded_file(db, file_id=file_id)
    if db_file is None or db_file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return db_file


@router.put("/{file_id}", response_model=UploadedFileResponse)
async def update_upload_file(
    file_id: int,
    file: UploadedFileUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_file = file_crud.get_uploaded_file(db, file_id=file_id)
    if db_file is None or db_file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return file_crud.update_uploaded_file(db=db, file_id=file_id, file=file)


@router.delete("/{file_id}")
async def delete_upload_file(
    file_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_file = file_crud.get_uploaded_file(db, file_id=file_id)
    if db_file is None or db_file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    
    if os.path.exists(str(db_file.file_path)):
        os.remove(str(db_file.file_path))
    
    success = file_crud.delete_uploaded_file(db=db, file_id=file_id)
    if not success:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return {"message": "Uploaded file deleted successfully"}
