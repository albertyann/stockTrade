
from main import app
import sys

def test_routes():
    """测试路由是否正确注册"""
    print("FastAPI应用程序路由:")
    for route in app.routes:
        try:
            print(f"- {route.methods if hasattr(route, 'methods') else 'GET'} {route.path}")
        except Exception as e:
            print(f"- 错误: {e}")
    
    print(f"\n路由总数: {len(app.routes)}")

if __name__ == "__main__":
    test_routes()
