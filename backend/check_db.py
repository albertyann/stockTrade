
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from database import Base
from models import User, Stock, UserStock, InvestmentNote, UploadedFile, AnalysisRule, AnalysisResult

# 创建引擎和会话
engine = create_engine('sqlite:///./stock_analysis.db')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # 检查是否有用户表
    print('检查表是否存在:')
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    print(f'用户表 (users): {"users" in metadata.tables}')
    print(f'股票表 (stocks): {"stocks" in metadata.tables}')
    print(f'用户股票表 (user_stocks): {"user_stocks" in metadata.tables}')
    print(f'投资笔记表 (investment_notes): {"investment_notes" in metadata.tables}')
    print(f'上传文件表 (uploaded_files): {"uploaded_files" in metadata.tables}')
    print(f'分析规则表 (analysis_rules): {"analysis_rules" in metadata.tables}')
    print(f'分析结果表 (analysis_results): {"analysis_results" in metadata.tables}')
    
    # 检查是否有数据
    if 'users' in metadata.tables:
        user_count = db.query(User).count()
    else:
        user_count = 0
        
    if 'stocks' in metadata.tables:
        stock_count = db.query(Stock).count()
    else:
        stock_count = 0
        
    print(f'\n数据统计:')
    print(f'用户数量: {user_count}')
    print(f'股票数量: {stock_count}')
    
    print('\n数据库连接成功！')
    
except Exception as e:
    print(f'数据库操作失败: {e}')
    import traceback
    print(traceback.format_exc())
finally:
    db.close()
