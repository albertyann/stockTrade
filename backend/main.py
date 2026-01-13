from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from dependencies import get_current_active_user, authenticate_user, create_access_token
from datetime import timedelta
from config import settings
import crud
import schemas
from fastapi.security import OAuth2PasswordRequestForm
import os
from services.data_sync_service import DataSyncService
from services.rule_engine_service import RuleEngine

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="股票深度分析系统API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 创建上传文件夹
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)


def init_default_user():
    db = next(get_db())
    try:
        existing_user = crud.get_user_by_username(db, username="admin")
        if not existing_user:
            default_user = schemas.UserCreate(
                username="admin",
                email="admin@example.com",
                password="123456"
            )
            admin_user = crud.create_user(db=db, user=default_user)
            print(f"默认管理员用户已创建: {admin_user.username} / 123456")
        else:
            print(f"默认管理员用户已存在: {existing_user.username}")
    except Exception as e:
        print(f"创建默认用户时出错: {str(e)}")
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    init_default_user()


# 认证路由
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# 用户相关路由
@app.post("/users/", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)


@app.get("/users/me/", response_model=schemas.UserResponse)
async def read_users_me(current_user: schemas.UserResponse = Depends(get_current_active_user)):
    return current_user


@app.put("/users/me/", response_model=schemas.UserResponse)
async def update_user_me(
    user: schemas.UserUpdate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.update_user(db=db, user_id=current_user.id, user=user)


@app.delete("/users/me/")
async def delete_user_me(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.delete_user(db=db, user_id=current_user.id)


# 股票相关路由
@app.post("/stocks/", response_model=schemas.StockResponse)
async def create_stock(
    stock: schemas.StockCreate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_stock = crud.get_stock_by_code(db, code=stock.code)
    if db_stock:
        raise HTTPException(status_code=400, detail="Stock code already registered")
    return crud.create_stock(db=db, stock=stock)


@app.get("/stocks/", response_model=list[schemas.StockResponse])
async def read_stocks(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    stocks = crud.get_stocks(db, skip=skip, limit=limit)
    return stocks


@app.get("/stocks/{stock_id}", response_model=schemas.StockResponse)
async def read_stock(
    stock_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_stock = crud.get_stock(db, stock_id=stock_id)
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock


@app.put("/stocks/{stock_id}", response_model=schemas.StockResponse)
async def update_stock(
    stock_id: int,
    stock: schemas.StockUpdate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_stock = crud.update_stock(db=db, stock_id=stock_id, stock=stock)
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock


@app.delete("/stocks/{stock_id}")
async def delete_stock(
    stock_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    success = crud.delete_stock(db=db, stock_id=stock_id)
    if not success:
        raise HTTPException(status_code=404, detail="Stock not found")
    return {"message": "Stock deleted successfully"}


# 用户自选股相关路由
@app.post("/user-stocks/", response_model=schemas.UserStockResponse)
async def create_user_stock(
    user_stock: schemas.UserStockCreate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_user_stock = crud.get_user_stock_by_user_and_stock(
        db, user_id=current_user.id, stock_id=user_stock.stock_id
    )
    if db_user_stock:
        raise HTTPException(status_code=400, detail="Stock already in user's portfolio")
    return crud.create_user_stock(db=db, user_stock=user_stock, user_id=current_user.id)


@app.get("/user-stocks/", response_model=list[schemas.UserStockResponse])
async def read_user_stocks(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_stocks = crud.get_user_stocks_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return user_stocks


@app.delete("/user-stocks/{user_stock_id}")
async def delete_user_stock(
    user_stock_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    success = crud.delete_user_stock(db=db, user_stock_id=user_stock_id)
    if not success:
        raise HTTPException(status_code=404, detail="User stock not found")
    return {"message": "User stock deleted successfully"}


# 投资笔记相关路由
@app.post("/investment-notes/", response_model=schemas.InvestmentNoteResponse)
async def create_investment_note(
    note: schemas.InvestmentNoteCreate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.create_investment_note(db=db, note=note, user_id=current_user.id)


@app.get("/investment-notes/", response_model=list[schemas.InvestmentNoteResponse])
async def read_investment_notes(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    notes = crud.get_investment_notes_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return notes


@app.get("/investment-notes/{note_id}", response_model=schemas.InvestmentNoteResponse)
async def read_investment_note(
    note_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    note = crud.get_investment_note(db, note_id=note_id)
    if note is None or note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment note not found")
    return note


@app.put("/investment-notes/{note_id}", response_model=schemas.InvestmentNoteResponse)
async def update_investment_note(
    note_id: int,
    note: schemas.InvestmentNoteUpdate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_note = crud.get_investment_note(db, note_id=note_id)
    if db_note is None or db_note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment note not found")
    return crud.update_investment_note(db=db, note_id=note_id, note=note)


@app.delete("/investment-notes/{note_id}")
async def delete_investment_note(
    note_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_note = crud.get_investment_note(db, note_id=note_id)
    if db_note is None or db_note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment note not found")
    success = crud.delete_investment_note(db=db, note_id=note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Investment note not found")
    return {"message": "Investment note deleted successfully"}


# 文件上传相关路由
@app.post("/upload-files/", response_model=schemas.UploadedFileResponse)
async def create_upload_file(
    stock_id: int,
    tags: str = None,
    file: UploadFile = File(...),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 检查文件大小
    file_size = await file.read()
    if len(file_size) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit")
    
    # 保存文件
    file_path = os.path.join(settings.UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as f:
        f.write(file_size)
    
    # 解析标签
    tag_list = tags.split(",") if tags else []
    
    # 创建文件记录
    file_data = schemas.UploadedFileCreate(
        stock_id=stock_id,
        file_name=file.filename,
        file_type=file.content_type,
        tags=tag_list
    )
    
    return crud.create_uploaded_file(
        db=db,
        file=file_data,
        user_id=current_user.id,
        file_path=file_path,
        file_size=len(file_size)
    )


@app.get("/upload-files/", response_model=list[schemas.UploadedFileResponse])
async def read_upload_files(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    files = crud.get_uploaded_files_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return files


@app.get("/upload-files/{file_id}", response_model=schemas.UploadedFileResponse)
async def read_upload_file(
    file_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_file = crud.get_uploaded_file(db, file_id=file_id)
    if db_file is None or db_file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return db_file


@app.put("/upload-files/{file_id}", response_model=schemas.UploadedFileResponse)
async def update_upload_file(
    file_id: int,
    file: schemas.UploadedFileUpdate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_file = crud.get_uploaded_file(db, file_id=file_id)
    if db_file is None or db_file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return crud.update_uploaded_file(db=db, file_id=file_id, file=file)


@app.delete("/upload-files/{file_id}")
async def delete_upload_file(
    file_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_file = crud.get_uploaded_file(db, file_id=file_id)
    if db_file is None or db_file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    
    # 删除文件
    if os.path.exists(db_file.file_path):
        os.remove(db_file.file_path)
    
    success = crud.delete_uploaded_file(db=db, file_id=file_id)
    if not success:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return {"message": "Uploaded file deleted successfully"}


# 分析规则相关路由
@app.post("/analysis-rules/", response_model=schemas.AnalysisRuleResponse)
async def create_analysis_rule(
    rule: schemas.AnalysisRuleCreate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.create_analysis_rule(db=db, rule=rule, user_id=current_user.id)


@app.get("/analysis-rules/", response_model=list[schemas.AnalysisRuleResponse])
async def read_analysis_rules(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rules = crud.get_analysis_rules_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return rules


@app.get("/analysis-rules/{rule_id}", response_model=schemas.AnalysisRuleResponse)
async def read_analysis_rule(
    rule_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rule = crud.get_analysis_rule(db, rule_id=rule_id)
    if rule is None or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    return rule


@app.put("/analysis-rules/{rule_id}", response_model=schemas.AnalysisRuleResponse)
async def update_analysis_rule(
    rule_id: int,
    rule: schemas.AnalysisRuleUpdate,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_rule = crud.get_analysis_rule(db, rule_id=rule_id)
    if db_rule is None or db_rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    return crud.update_analysis_rule(db=db, rule_id=rule_id, rule=rule)


@app.delete("/analysis-rules/{rule_id}")
async def delete_analysis_rule(
    rule_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_rule = crud.get_analysis_rule(db, rule_id=rule_id)
    if db_rule is None or db_rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    success = crud.delete_analysis_rule(db=db, rule_id=rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis rule not found")
    return {"message": "Analysis rule deleted successfully"}


# 分析结果相关路由
@app.get("/analysis-results/", response_model=list[schemas.AnalysisResultResponse])
async def read_analysis_results(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    results = crud.get_analysis_results_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return results


@app.get("/analysis-results/{result_id}", response_model=schemas.AnalysisResultResponse)
async def read_analysis_result(
    result_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = crud.get_analysis_result(db, result_id=result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    # 检查结果所属的规则是否属于当前用户
    rule = crud.get_analysis_rule(db, rule_id=result.rule_id)
    if rule is None or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    return result


@app.delete("/analysis-results/{result_id}")
async def delete_analysis_result(
    result_id: int,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = crud.get_analysis_result(db, result_id=result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    # 检查结果所属的规则是否属于当前用户
    rule = crud.get_analysis_rule(db, rule_id=result.rule_id)
    if rule is None or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    success = crud.delete_analysis_result(db=db, result_id=result_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    return {"message": "Analysis result deleted successfully"}


# 数据同步相关路由
@app.post("/sync/stocks", response_model=schemas.SyncResult)
async def sync_stock_data(
    sync_request: schemas.SyncRequest,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    同步股票数据
    """
    sync_service = DataSyncService(db)
    result = sync_service.sync_stock_data(sync_request.dict())
    return result


@app.post("/sync/financials", response_model=schemas.SyncResult)
async def sync_financial_data(
    sync_request: schemas.SyncRequest,
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    同步财务数据
    """
    sync_service = DataSyncService(db)
    result = sync_service.sync_stock_data({"stock_codes": sync_request.stock_codes, "sync_type": "financial"})
    return result


@app.get("/sync/status", response_model=schemas.SyncStatus)
async def get_sync_status(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取数据同步状态
    """
    sync_service = DataSyncService(db)
    status = sync_service.get_sync_status()
    return status


# 规则引擎相关路由
@app.post("/rules/evaluate")
async def evaluate_rules(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    执行规则评估
    """
    rule_engine = RuleEngine(db)
    enabled_rules = rule_engine.get_enabled_rules()
    stocks_to_analyze = rule_engine.get_stocks_to_analyze()
    
    analysis_results = []
    for rule in enabled_rules:
        for stock in stocks_to_analyze:
            try:
                stock_data = rule_engine.get_stock_analysis_data(stock["id"])
                if rule_engine.evaluate_rule(rule, stock["code"], stock_data):
                    analysis_results.append({
                        "rule_id": rule.id,
                        "stock_id": stock["id"],
                        "timestamp": str(rule_engine.get_sync_status()["last_sync_time"]),
                        "data": stock_data
                    })
            except Exception as e:
                print(f"Error evaluating rule {rule.id} for stock {stock['code']}: {str(e)}")
    
    rule_engine.save_analysis_results(analysis_results)
    rule_engine.send_analysis_notifications(analysis_results)
    
    return {
        "success": True,
        "message": f"规则评估完成，共匹配 {len(analysis_results)} 个结果",
        "results": analysis_results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
