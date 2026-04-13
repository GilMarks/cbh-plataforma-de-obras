from datetime import datetime

from pydantic import BaseModel


class FerramentaCreate(BaseModel):
    nome: str
    codigo: str = ""


class FerramentaUpdate(BaseModel):
    nome: str | None = None
    codigo: str | None = None


class EmprestarRequest(BaseModel):
    responsavel: str


class FerramentaResponse(BaseModel):
    id: int
    nome: str
    codigo: str
    status: str
    responsavel_atual: str
    data_emprestimo: str
    data_devolvida: str
    historico_uso: list
    created_at: datetime

    model_config = {"from_attributes": True}
