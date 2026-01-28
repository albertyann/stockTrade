#!/usr/bin/env python3
"""
Initialize investment notes with sample data for demonstration.
This script creates sample users, stocks, and investment notes.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User, Stock, InvestmentNote
from app.crud.user import get_user_by_username, create_user
from app.crud.investment_note import create_investment_note
from app.schemas.user import UserCreate
from app.schemas.investment_note import InvestmentNoteCreate
from datetime import datetime, timedelta


def init_users(db: Session):
    """Initialize demo users."""
    users = [
        {
            "username": "demo_user",
            "email": "demo@example.com",
            "password": "demo123456"
        },
        {
            "username": "trader_x",
            "email": "trader@example.com",
            "password": "trader123456"
        }
    ]

    created_users = []

    for user_data in users:
        existing_user = get_user_by_username(db, username=user_data["username"])
        if existing_user:
            print(f"User '{user_data['username']}' already exists")
            created_users.append(existing_user)
            continue

        user_create = UserCreate(
            username=user_data["username"],
            email=user_data["email"],
            password=user_data["password"]
        )
        user = create_user(db, user_create)
        print(f"Created user: {user.username}")
        created_users.append(user)

    return created_users


def init_stocks(db: Session):
    """Initialize sample stocks."""
    stocks_data = [
        {
            "ts_code": "000001.SZ",
            "symbol": "000001",
            "name": "平安银行",
            "area": "深圳",
            "industry": "银行",
            "fullname": "平安银行股份有限公司",
            "market": "SZ",
            "exchange": "SZSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "000002.SZ",
            "symbol": "000002",
            "name": "万科A",
            "area": "深圳",
            "industry": "房地产",
            "fullname": "万科企业股份有限公司",
            "market": "SZ",
            "exchange": "SZSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "600000.SH",
            "symbol": "600000",
            "name": "浦发银行",
            "area": "上海",
            "industry": "银行",
            "fullname": "上海浦东发展银行股份有限公司",
            "market": "SH",
            "exchange": "SSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "600036.SH",
            "symbol": "600036",
            "name": "招商银行",
            "area": "深圳",
            "industry": "银行",
            "fullname": "招商银行股份有限公司",
            "market": "SH",
            "exchange": "SSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "600519.SH",
            "symbol": "600519",
            "name": "贵州茅台",
            "area": "贵州",
            "industry": "食品饮料",
            "fullname": "贵州茅台酒股份有限公司",
            "market": "SH",
            "exchange": "SSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "000858.SZ",
            "symbol": "000858",
            "name": "五粮液",
            "area": "四川",
            "industry": "食品饮料",
            "fullname": "宜宾五粮液股份有限公司",
            "market": "SZ",
            "exchange": "SZSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "000333.SZ",
            "symbol": "000333",
            "name": "美的集团",
            "area": "广东",
            "industry": "家用电器",
            "fullname": "美的集团股份有限公司",
            "market": "SZ",
            "exchange": "SZSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "002594.SZ",
            "symbol": "002594",
            "name": "比亚迪",
            "area": "广东",
            "industry": "汽车",
            "fullname": "比亚迪股份有限公司",
            "market": "SZ",
            "exchange": "SZSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "601318.SH",
            "symbol": "601318",
            "name": "中国平安",
            "area": "深圳",
            "industry": "保险",
            "fullname": "中国平安保险（集团）股份有限公司",
            "market": "SH",
            "exchange": "SSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        },
        {
            "ts_code": "601939.SH",
            "symbol": "601939",
            "name": "建设银行",
            "area": "北京",
            "industry": "银行",
            "fullname": "中国建设银行股份有限公司",
            "market": "SH",
            "exchange": "SSE",
            "curr_type": "CNY",
            "list_status": "L",
            "is_hs": "S"
        }
    ]

    created_stocks = []

    for stock_data in stocks_data:
        existing_stock = db.query(Stock).filter(
            Stock.ts_code == stock_data["ts_code"]
        ).first()

        if existing_stock:
            print(f"Stock '{stock_data['name']}' ({stock_data['ts_code']}) already exists")
            created_stocks.append(existing_stock)
            continue

        stock = Stock(**stock_data)
        db.add(stock)
        db.commit()
        db.refresh(stock)
        print(f"Created stock: {stock.name} ({stock.ts_code})")
        created_stocks.append(stock)

    return created_stocks


def init_investment_notes(db: Session, users, stocks):
    """Initialize sample investment notes."""

    notes_data = [
        {
            "user_idx": 0,
            "stock_idx": 4,  # 贵州茅台
            "title": "贵州茅台长期投资分析",
            "content": """贵州茅台作为中国白酒行业的龙头企业，具有强大的品牌护城河和定价权。

核心优势：
1. 品牌价值：茅台品牌价值超过3000亿，具有强大的品牌溢价能力
2. 市场地位：在高端白酒市场占据主导地位，市场份额超过50%
3. 盈利能力：毛利率常年保持在90%以上，ROE稳定在30%左右
4. 现金流：经营活动现金流充沛，分红稳定

投资逻辑：
- 消费升级趋势下，高端白酒需求持续增长
- 茅台产能逐步释放，业绩增长有保障
- 品牌护城河深厚，具备长期投资价值

风险提示：
- 消费降级可能影响高端白酒需求
- 监管政策变化风险
- 产能扩张不及预期""",
            "tags": ["价值投资", "消费升级", "白马股"]
        },
        {
            "user_idx": 0,
            "stock_idx": 7,  # 比亚迪
            "title": "比亚迪新能源汽车业务跟踪",
            "content": """比亚迪在新能源汽车领域表现突出，销量持续创新高。

近期表现：
- 2025年1-11月累计销量突破200万辆，同比增长80%
- 在海外市场拓展顺利，欧洲、东南亚市场表现亮眼
- 刀片电池技术领先，获得多国订单

技术优势：
1. 刀片电池：安全性高，能量密度大，成本优势明显
2. DM-i混动系统：油耗低，续航里程长，市场反响好
3. e平台3.0：集成度高，性能优异
4. 智能驾驶：DiPilot系统持续迭代

投资机会：
- 新能源汽车渗透率持续提升，市场空间广阔
- 公司技术领先，具备全产业链优势
- 海外市场拓展带来新的增长点

关注要点：
- 竞争加剧导致的价格战风险
- 原材料价格波动
- 汇率风险（海外业务）""",
            "tags": ["新能源", "成长股", "科技"]
        },
        {
            "user_idx": 0,
            "stock_idx": 0,  # 平安银行
            "title": "平安银行数字化转型观察",
            "content": """平安银行持续推进数字化转型，零售业务占比持续提升。

转型成效：
- 零售业务收入占比超过60%，成为主要增长引擎
- 数字化获客能力强，APP用户数突破1亿
- AI客服应用广泛，服务效率提升

业务亮点：
1. 零售金融：私行客户增长迅速，AUM规模持续扩大
2. 对公业务：供应链金融模式创新，风险控制能力提升
3. 财富管理：基金、保险代销收入增长快
4. 金融科技：区块链、大数据等技术应用领先

投资逻辑：
- 经济复苏利好银行业
- 零售业务转型效果显著
- 不良率持续下降，资产质量改善

风险提示：
- 宏观经济下行风险
- 利率下行压缩净息差
- 房地产风险敞口""",
            "tags": ["银行", "金融科技", "转型"]
        },
        {
            "user_idx": 1,
            "stock_idx": 5,  # 五粮液
            "title": "五粮液与茅台对比分析",
            "content": """作为白酒行业双雄，五粮液与茅台各有特色。

对比分析：

品牌定位：
- 茅台：高端奢侈定位，社交属性强
- 五粮液：次高端龙头，品质与价格平衡

产品结构：
- 茅台：主打53度飞天茅台，产品线相对简单
- 五粮液：产品线丰富，覆盖不同价格带

渠道策略：
- 茅台：控量保价，渠道管控严格
- 五粮液：渠道下沉，市场渗透率高

财务指标对比：
- 茅台毛利率：~92%，ROE：~30%
- 五粮液毛利率：~78%，ROE：~22%

投资建议：
五粮液定位次高端，受益于消费升级，性价比优于茅台，适合中等风险偏好投资者。
茅台品牌价值更高，长期稳定性更强，适合低风险偏好投资者。""",
            "tags": ["白酒", "对比分析", "竞争格局"]
        },
        {
            "user_idx": 1,
            "stock_idx": 2,  # 浦发银行
            "title": "浦发银行不良资产处置进展",
            "content": """浦发银行积极推进不良资产处置，资产质量持续改善。

处置进展：
- 2025年Q3不良率下降至1.75%，环比下降0.05个百分点
- 不良贷款余额减少15亿元，连续两个季度下降
- 拨备覆盖率提升至160%，风险抵御能力增强

处置方式：
1. 债转股：与资产管理公司合作
2. 不良资产证券化：发行NPL证券
3. 诉讼清收：加大清收力度
4. 核销处置：计提充足后核销

业务改善：
- 零售业务占比提升，结构优化
- 普惠金融业务增长快，政策红利明显
- 中间业务收入增加，多元化发展

未来展望：
- 随着经济复苏，资产质量有望进一步改善
- 数字化转型提升风控能力
- 政策支持银行化解不良资产

风险提示：
- 房地产风险仍需关注
- 经济复苏力度不确定
- 同业竞争加剧""",
            "tags": ["银行", "不良资产", "风控"]
        },
        {
            "user_idx": 1,
            "stock_idx": 6,  # 美的集团
            "title": "美的集团全球化布局分析",
            "content": """美的集团持续推进全球化战略，海外收入占比持续提升。

全球化布局：

生产基地：
- 海外生产基地：越南、泰国、巴西等12个国家
- 国内生产基地：覆盖全国主要区域
- 研发中心：全球30多个研发中心

市场布局：
- 海外收入占比：~45%，高于行业平均
- 主要市场：东南亚、欧洲、美洲
- 新兴市场：印度、非洲增长快速

品牌矩阵：
- 美的：主力品牌，覆盖全品类
- 小天鹅：高端洗衣机
- 东芝：日本市场高端品牌
- 科龙：中端市场

竞争优势：
1. 全产业链：从零部件到整机制造
2. 规模效应：成本优势明显
3. 研发投入：每年营收3%以上投入研发
4. 数字化：工业4.0示范企业

投资逻辑：
- 全球家电市场规模超5000亿美元，空间广阔
- 公司产品线齐全，抗风险能力强
- 智能家电趋势下，公司转型速度快

风险提示：
- 贸易摩擦影响
- 汇率波动
- 全球经济不确定性""",
            "tags": ["家电", "全球化", "制造业"]
        },
        {
            "user_idx": 0,
            "stock_idx": 8,  # 中国平安
            "title": "中国平安综合金融模式研究",
            "content": """中国平安是亚洲最大的综合金融服务集团之一。

综合金融生态：

保险业务（核心）：
- 寿险：代理人队伍优化，产能提升
- 财险：市场份额稳居前三
- 养老险：政策红利，增长潜力大

银行业务：
- 平安银行：数字化转型成效显著
- 零售业务：成为主要增长引擎

投资业务：
- 资产管理：AUM规模突破4万亿
- 证券投行：IPO承销能力强

金融科技：
- 金融一账通：服务中小金融机构
- 医保科技：覆盖5亿+用户
- 汽车之家：垂直领域领先

战略方向：
1. 科技赋能：AI、大数据等技术应用
2. 生态建设：从单一金融到生态服务
3. 对外输出：科技能力向行业输出
4. 国际化：东南亚市场布局

投资价值：
- 综合金融模式具有协同效应
- 科技投入构建长期护城河
- 分红稳定，股息率~4%

风险提示：
- 保险行业增长放缓
- 投资收益波动
- 监管政策变化""",
            "tags": ["综合金融", "保险", "金融科技"]
        },
        {
            "user_idx": 0,
            "stock_idx": 1,  # 万科A
            "title": "万科A房地产转型探索",
            "content": """房地产行业深度调整，万科积极探索转型之路。

转型方向：

1. 物业服务：万物云上市，业务多元化
2. 长租公寓：泊寓品牌，全国布局
3. 商业地产：印力集团，购物中心运营
4. 物流仓储：万纬物流，冷链仓储领先

财务健康：
- 净负债率：~55%，行业较低
- 现金流：经营性现金流为正
- 融资成本：3.5%，优势明显

土地储备：
- 一二线城市占比：~70%
- 土地总建面：~1.5亿平米
- 可售货值：~1.2万亿

投资逻辑：
- 行业出清，龙头集中度提升
- 公司财务稳健，抗风险能力强
- 业务多元化，转型成效显现

风险提示：
- 房地产销售持续低迷
- 政策不确定性
- 转型业务盈利能力有待提升"""
        },
        {
            "user_idx": 1,
            "stock_idx": 9,  # 建设银行
            "title": "建设银行基建金融优势分析",
            "content": """建设银行在基建金融领域具有传统优势。

核心优势：

1. 基建贷款：市场份额领先
2. 政策性业务：政策性银行改革受益
3. 网点布局：覆盖全国主要基建区域
4. 风险控制：基建项目风控经验丰富

业务亮点：

对公业务：
- 基建贷款占比：~25%
- 绿色金融：绿色债券发行规模领先
- 普惠金融：服务小微企业，政策支持

零售业务：
- 住房贷款：市场第一
- 财富管理：私人银行客户增长
- 信用卡：发卡量超1亿

数字化转型：
- 建行生活APP：月活超5000万
- 智慧网点：无人网点试点
- AI客服：替代率超过70%

投资逻辑：
- 新基建投资加码，银行受益
- 绿色金融成为新增长点
- 数字化转型降本增效

风险提示：
- 地方债务风险
- 利率下行
- 房地产风险"""
        }
    ]

    notes_count = 0

    for note_data in notes_data:
        user = users[note_data["user_idx"]]
        stock = stocks[note_data["stock_idx"]]

        existing_note = db.query(InvestmentNote).filter(
            InvestmentNote.user_id == user.id,
            InvestmentNote.stock_id == stock.id,
            InvestmentNote.title == note_data["title"]
        ).first()

        if existing_note:
            print(f"Note '{note_data['title']}' already exists")
            continue

        note_create = InvestmentNoteCreate(
            stock_id=stock.id,
            title=note_data["title"],
            content=note_data["content"],
            tags=note_data.get("tags", [])
        )

        note = create_investment_note(db, note_create, user.id)
        print(f"Created note: {note.title} by {user.username}")
        notes_count += 1

    return notes_count


def main():
    """Main initialization function."""
    db = SessionLocal()

    try:
        print("Initializing investment notes with sample data...")
        print("=" * 60)

        # Create all tables
        print("\nCreating database tables...")
        Base.metadata.create_all(bind=engine)

        # Initialize users
        print("\n1. Initializing users...")
        users = init_users(db)

        # Initialize stocks
        print("\n2. Initializing stocks...")
        stocks = init_stocks(db)

        # Initialize investment notes
        print("\n3. Initializing investment notes...")
        notes_count = init_investment_notes(db, users, stocks)

        print("\n" + "=" * 60)
        print(f"Initialization completed! Created {notes_count} investment notes.")

    except Exception as e:
        print(f"Error during initialization: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
