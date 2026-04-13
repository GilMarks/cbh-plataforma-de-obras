from datetime import datetime

from pydantic import BaseModel


class InsumoCreate(BaseModel):
    nome: str
    unidade: str = "un"
    estoque_minimo: float = 0


class InsumoUpdate(BaseModel):
    nome: str | None = None
    unidade: str | None = None
    estoque_minimo: float | None = None


class MovimentarRequest(BaseModel):
    tipo: str
    quantidade: float
    obra_destino: str = ""
    observacoes: str = ""


class InsumoResponse(BaseModel):
    id: int
    nome: str
    unidade: str
    coeficiente: float
    estoque_atual: float
    estoque_minimo: float
    created_at: datetime

    model_config = {"from_attributes": True}
