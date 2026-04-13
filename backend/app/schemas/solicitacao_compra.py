from datetime import datetime

from pydantic import BaseModel


class SolicitacaoCompraCreate(BaseModel):
    obra_id: int
    item: str
    quantidade: float = 0
    unidade: str = "un"
    prioridade: str = "Media"
    observacoes: str = ""
    setor: str = ""


class CotacaoUpdate(BaseModel):
    fornecedor: str
    valor: float | None = None
    pagamento: str | None = None
    imagem_orcamento: str | None = None


class SolicitacaoCompraResponse(BaseModel):
    id: int
    obra_id: int
    obra_nome: str
    setor: str
    item: str
    quantidade: float
    unidade: str
    prioridade: str
    observacoes: str
    solicitante: str
    data: str
    status: str
    fornecedor: str
    valor: float
    pagamento: str
    imagem_orcamento: str
    status_fluxo: str
    created_at: datetime

    model_config = {"from_attributes": True}
