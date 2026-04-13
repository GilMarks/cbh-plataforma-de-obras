from datetime import datetime

from pydantic import BaseModel


class UsuarioBase(BaseModel):
    login: str
    cargo: str
    foto: str = ""


class UsuarioCreate(UsuarioBase):
    senha: str


class UsuarioUpdate(BaseModel):
    login: str | None = None
    senha: str | None = None
    cargo: str | None = None
    foto: str | None = None


class UsuarioResponse(UsuarioBase):
    id: int
    tipo: str
    ativo: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
