from datetime import datetime

from pydantic import BaseModel


class MovimentacaoResponse(BaseModel):
    id: int
    insumo_id: int
    insumo_nome: str
    tipo: str
    quantidade: float
    obra_destino: str
    data: str
    responsavel: str
    observacoes: str
    created_at: datetime

    model_config = {"from_attributes": True}
