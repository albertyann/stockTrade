
import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    
    # 测试用户注册
    print("测试用户注册API:")
    url = f"{base_url}/users/"
    data = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # 测试用户登录
    print("测试用户登录API:")
    url = f"{base_url}/token"
    data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"获取到的Token: {token}")
            
            # 测试获取用户信息
            print("\n" + "="*50 + "\n")
            print("测试获取用户信息API:")
            url = f"{base_url}/users/me/"
            headers = {"Authorization": f"Bearer {token}"}
            
            response = requests.get(url, headers=headers)
            print(f"状态码: {response.status_code}")
            print(f"响应内容: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    test_api()
