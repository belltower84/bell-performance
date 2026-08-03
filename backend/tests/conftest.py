import os
os.environ['BELL_DATABASE_URL']='sqlite:///./test_bell_core.db'
os.environ['BELL_JWT_SECRET']='test-secret-long-enough-for-jwt-and-sha256'
os.environ['BELL_AUTO_CREATE_SCHEMA']='true'
import pytest
from fastapi.testclient import TestClient
from app.database import Base,engine
from app.main import app
@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(engine); Base.metadata.create_all(engine); yield
@pytest.fixture
def client(): return TestClient(app,raise_server_exceptions=True)
@pytest.fixture
def auth(client):
    def make(email='athlete@example.com',role='athlete'):
        r=client.post('/api/v1/auth/register',json={'email':email,'password':'StrongPass123!','role':role}); assert r.status_code==201
        return {'Authorization':f"Bearer {r.json()['access_token']}"},r.json()
    return make
