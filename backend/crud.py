from sqlalchemy.orm import Session
from models import User, Stock, UserStock, InvestmentNote, UploadedFile, AnalysisRule, AnalysisResult
from schemas import (
    UserCreate, UserUpdate,
    StockCreate, StockUpdate,
    UserStockCreate,
    InvestmentNoteCreate, InvestmentNoteUpdate,
    UploadedFileCreate, UploadedFileUpdate,
    AnalysisRuleCreate, AnalysisRuleUpdate
)
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# 用户相关CRUD操作
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate):
    # 截断密码到72字节，避免bcrypt算法的长度限制
    truncated_password = user.password.encode('utf-8')[:72].decode('utf-8', 'ignore')
    hashed_password = pwd_context.hash(truncated_password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: UserUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user.dict(exclude_unset=True)
        if "password" in update_data:
            # 截断密码到72字节，避免bcrypt算法的长度限制
            truncated_password = update_data["password"].encode('utf-8')[:72].decode('utf-8', 'ignore')
            update_data["password_hash"] = pwd_context.hash(truncated_password)
            del update_data["password"]
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# 股票相关CRUD操作
def get_stock(db: Session, stock_id: int):
    return db.query(Stock).filter(Stock.id == stock_id).first()


def get_stock_by_code(db: Session, code: str):
    return db.query(Stock).filter(Stock.code == code).first()


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Stock).offset(skip).limit(limit).all()


def create_stock(db: Session, stock: StockCreate):
    db_stock = Stock(**stock.dict())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


def update_stock(db: Session, stock_id: int, stock: StockUpdate):
    db_stock = get_stock(db, stock_id)
    if db_stock:
        update_data = stock.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_stock, key, value)
        db.commit()
        db.refresh(db_stock)
    return db_stock


def delete_stock(db: Session, stock_id: int):
    db_stock = get_stock(db, stock_id)
    if db_stock:
        db.delete(db_stock)
        db.commit()
        return True
    return False


# 用户自选股相关CRUD操作
def get_user_stock(db: Session, user_stock_id: int):
    return db.query(UserStock).filter(UserStock.id == user_stock_id).first()


def get_user_stocks_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(UserStock).filter(UserStock.user_id == user_id).offset(skip).limit(limit).all()


def get_user_stock_by_user_and_stock(db: Session, user_id: int, stock_id: int):
    return db.query(UserStock).filter(
        UserStock.user_id == user_id,
        UserStock.stock_id == stock_id
    ).first()


def create_user_stock(db: Session, user_stock: UserStockCreate, user_id: int):
    db_user_stock = UserStock(**user_stock.dict(), user_id=user_id)
    db.add(db_user_stock)
    db.commit()
    db.refresh(db_user_stock)
    return db_user_stock


def delete_user_stock(db: Session, user_stock_id: int):
    db_user_stock = get_user_stock(db, user_stock_id)
    if db_user_stock:
        db.delete(db_user_stock)
        db.commit()
        return True
    return False


# 投资笔记相关CRUD操作
def get_investment_note(db: Session, note_id: int):
    return db.query(InvestmentNote).filter(InvestmentNote.id == note_id).first()


def get_investment_notes_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(InvestmentNote).filter(InvestmentNote.user_id == user_id).offset(skip).limit(limit).all()


def get_investment_notes_by_stock(db: Session, user_id: int, stock_id: int, skip: int = 0, limit: int = 100):
    return db.query(InvestmentNote).filter(
        InvestmentNote.user_id == user_id,
        InvestmentNote.stock_id == stock_id
    ).offset(skip).limit(limit).all()


def create_investment_note(db: Session, note: InvestmentNoteCreate, user_id: int):
    db_note = InvestmentNote(**note.dict(), user_id=user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def update_investment_note(db: Session, note_id: int, note: InvestmentNoteUpdate):
    db_note = get_investment_note(db, note_id)
    if db_note:
        update_data = note.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_note, key, value)
        db.commit()
        db.refresh(db_note)
    return db_note


def delete_investment_note(db: Session, note_id: int):
    db_note = get_investment_note(db, note_id)
    if db_note:
        db.delete(db_note)
        db.commit()
        return True
    return False


# 文件上传相关CRUD操作
def get_uploaded_file(db: Session, file_id: int):
    return db.query(UploadedFile).filter(UploadedFile.id == file_id).first()


def get_uploaded_files_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(UploadedFile).filter(UploadedFile.user_id == user_id).offset(skip).limit(limit).all()


def get_uploaded_files_by_stock(db: Session, user_id: int, stock_id: int, skip: int = 0, limit: int = 100):
    return db.query(UploadedFile).filter(
        UploadedFile.user_id == user_id,
        UploadedFile.stock_id == stock_id
    ).offset(skip).limit(limit).all()


def create_uploaded_file(db: Session, file: UploadedFileCreate, user_id: int, file_path: str, file_size: int):
    db_file = UploadedFile(
        **file.dict(),
        user_id=user_id,
        file_path=file_path,
        file_size=file_size
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def update_uploaded_file(db: Session, file_id: int, file: UploadedFileUpdate):
    db_file = get_uploaded_file(db, file_id)
    if db_file:
        update_data = file.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_file, key, value)
        db.commit()
        db.refresh(db_file)
    return db_file


def delete_uploaded_file(db: Session, file_id: int):
    db_file = get_uploaded_file(db, file_id)
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False


# 分析规则相关CRUD操作
def get_analysis_rule(db: Session, rule_id: int):
    return db.query(AnalysisRule).filter(AnalysisRule.id == rule_id).first()


def get_analysis_rules_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisRule).filter(AnalysisRule.user_id == user_id).offset(skip).limit(limit).all()


def get_enabled_analysis_rules_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisRule).filter(
        AnalysisRule.user_id == user_id,
        AnalysisRule.enabled == True
    ).offset(skip).limit(limit).all()


def create_analysis_rule(db: Session, rule: AnalysisRuleCreate, user_id: int):
    db_rule = AnalysisRule(**rule.dict(), user_id=user_id)
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def update_analysis_rule(db: Session, rule_id: int, rule: AnalysisRuleUpdate):
    db_rule = get_analysis_rule(db, rule_id)
    if db_rule:
        update_data = rule.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_rule, key, value)
        db.commit()
        db.refresh(db_rule)
    return db_rule


def delete_analysis_rule(db: Session, rule_id: int):
    db_rule = get_analysis_rule(db, rule_id)
    if db_rule:
        db.delete(db_rule)
        db.commit()
        return True
    return False


# 分析结果相关CRUD操作
def get_analysis_result(db: Session, result_id: int):
    return db.query(AnalysisResult).filter(AnalysisResult.id == result_id).first()


def get_analysis_results_by_rule(db: Session, rule_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisResult).filter(AnalysisResult.rule_id == rule_id).offset(skip).limit(limit).all()


def get_analysis_results_by_stock(db: Session, stock_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisResult).filter(AnalysisResult.stock_id == stock_id).offset(skip).limit(limit).all()


def get_analysis_results_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(AnalysisResult).join(AnalysisRule).filter(AnalysisRule.user_id == user_id).offset(skip).limit(limit).all()


def create_analysis_result(db: Session, result_data: dict):
    db_result = AnalysisResult(**result_data)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


def delete_analysis_result(db: Session, result_id: int):
    db_result = get_analysis_result(db, result_id)
    if db_result:
        db.delete(db_result)
        db.commit()
        return True
    return False
