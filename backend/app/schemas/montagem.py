from datetime import datetime

from pydantic import BaseModel


class MontagemCreate(BaseModel):
    carregamento_id: int
    equipe_responsavel: str
    observacoes: str = ""


class MontagemResponse(BaseModel):
    id: int
    obra_id: int
    obra_nome: str
    carregamento_id: int
    painel_id: str
    tipo: str
    dimensao: str
    equipe_responsavel: str
    data_montagem: str
    observacoes: str
    created_at: datetime

    model_config = {"from_attributes": True}
