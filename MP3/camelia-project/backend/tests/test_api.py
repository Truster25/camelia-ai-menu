from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_identifies_demo_data():
    assert client.get('/api/health').json() == {'status': 'ok', 'data_source': 'demo'}

def test_menu_has_sample_items():
    body = client.get('/api/menu').json()
    assert 'demonstration' in body['notice']
    assert len(body['items']) >= 1
    assert all(item['price'] > 0 for item in body['items'])
