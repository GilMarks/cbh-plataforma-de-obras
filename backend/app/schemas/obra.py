from datetime import datetime

from pydantic import BaseModel


class ObraCreate(BaseModel):
    nome: str
    cliente: str = ""
    local: str = ""
    observacoes: str = ""
    paineis_min: int = 0
    pilares_min: int = 0
    sapatas_min: int = 0


class ObraUpdate(ObraCreate):
    nome: str | None = None


class ObraResponse(BaseModel):
    id: int
    nome: str
    cliente: str
    local: str
    observacoes: str
    paineis_min: int
    pilares_min: int
    sapatas_min: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ObraProgresso(BaseModel):
    paineis: dict
    pilares: dict
    sapatas: dict
