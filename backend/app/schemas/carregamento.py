from datetime import datetime

from pydantic import BaseModel


class CarregamentoCreate(BaseModel):
    obra_id: int
    veiculo: str
    paineis: list = []


class CarregamentoResponse(BaseModel):
    id: int
    obra_id: int
    obra_nome: str
    veiculo: str
    paineis: list
    sequencia_montagem: list
    status_autorizacao: str
    autorizado_por: str
    data_autorizacao: str
    data_solicitacao: str
    solicitante: str
    executado_por: str
    data_execucao: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
