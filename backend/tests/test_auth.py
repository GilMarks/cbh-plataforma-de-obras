import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import hash_password
from app.models.usuario import Usuario


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session: AsyncSession):
    user = Usuario(
        login="testuser",
        senha_hash=hash_password("senha123"),
        tipo="Usuario",
        cargo="Mestre",
        ativo=1,
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post("/api/auth/login", json={"login": "testuser", "senha": "senha123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["login"] == "testuser"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/api/auth/login", json={"login": "naoexiste", "senha": "errada"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
