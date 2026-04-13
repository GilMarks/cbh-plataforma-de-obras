from datetime import datetime

from pydantic import BaseModel


class SolicitacaoCreate(BaseModel):
    obra_id: int
    paineis: int = 0
    painel_comp: float = 5.0
    painel_alt: float = 3.0
    tipo_painel: str = "Liso"
    ra_painel: str = ""
    pilares: int = 0
    pilar_alt: float = 3.0
    bainha_pilar: int = 0
    sapatas: int = 0
    tamanho_sapata: str = "Grande"
    tipo_sapata: str = "Normal"
    observacoes: str = ""
    data: str = ""


class SolicitacaoResponse(BaseModel):
    id: int
    obra_id: int
    obra_nome: str
    cliente_nome: str
    paineis: int
    painel_comp: float
    painel_alt: float
    tipo_painel: str
    ra_painel: str
    status_painel: str
    fabricado_painel: int
    saldo_painel: int
    historico_painel: list
    pilares: int
    pilar_alt: float
    bainha_pilar: int
    status_pilar: str
    fabricado_pilar: int
    saldo_pilar: int
    historico_pilar: list
    sapatas: int
    tamanho_sapata: str
    tipo_sapata: str
    status_sapata: str
    fabricado_sapata: int
    saldo_sapata: int
    historico_sapata: list
    data: str
    observacoes: str
    solicitante: str
    cargo_solicitante: str
    data_solicitacao_registro: str
    status_autorizacao: str
    autorizado_por: str
    data_autorizacao: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LancarProducaoRequest(BaseModel):
    tipo: str
    quantidade: int
