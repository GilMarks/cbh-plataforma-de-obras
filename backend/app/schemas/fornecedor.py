from datetime import datetime

from pydantic import BaseModel


class FornecedorCreate(BaseModel):
    nome: str
    fone: str = ""


class FornecedorUpdate(BaseModel):
    nome: str | None = None
    fone: str | None = None


class FornecedorResponse(BaseModel):
    id: int
    nome: str
    fone: str
    created_at: datetime

    model_config = {"from_attributes": True}
