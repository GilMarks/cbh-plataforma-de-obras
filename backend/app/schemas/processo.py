from datetime import datetime

from pydantic import BaseModel


class ProcessoResponse(BaseModel):
    id: int
    numero: str
    obra: str
    item: str
    qtd: float
    valor: float
    forma_pagamento: str
    status: str
    timeline: list
    solicitacao_compra_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
