from pydantic import BaseModel


class LoginRequest(BaseModel):
    login: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: dict | None = None


class RefreshRequest(BaseModel):
    refresh_token: str
