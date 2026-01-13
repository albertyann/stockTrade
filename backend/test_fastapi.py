
from fastapi.testclient import TestClient
from main import app

# 创建测试客户端
client = TestClient(app)

def test_users_route():
    """测试用户注册接口"""
    print("测试用户注册接口:")
    
    # 测试用户注册
    user_data = {
        "username": "testuser",
        "email": "testuser@example.com", 
        "password": "testpassword123"
    }
    
    response = client.post("/users/", json=user_data)
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
    
    print("\n" + "="*50 + "\n")

def test_token_route():
    """测试用户登录接口"""
    print("测试用户登录接口:")
    
    # 测试用户登录
    login_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    
    response = client.post("/token", data=login_data)
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
    
    if response.status_code == 200:
        try:
            token_data = response.json()
            print(f"获取到的Token: {token_data.get('access_token')}")
        except Exception as e:
            print(f"解析响应失败: {e}")
    
    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    print("使用FastAPI测试客户端进行测试:")
    print("="*50)
    
    test_users_route()
    test_token_route()
