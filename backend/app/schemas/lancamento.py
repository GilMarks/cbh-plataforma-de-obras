from datetime import datetime

from pydantic import BaseModel


class LancamentoCreate(BaseModel):
    tipo: str
    centro: str = ""
    descricao: str = ""
    fornecedor: str = ""
    valor: float
    forma_pagamento: str = ""
    vencimento: str = ""


class PagarRequest(BaseModel):
    banco_id: int
    data_pagamento: str | None = None
    valor_pago: float | None = None


class LancamentoResponse(BaseModel):
    id: int
    tipo: str
    centro: str
    descricao: str
    fornecedor: str
    valor: float
    forma_pagamento: str
    status: str
    proc_id: int
    data: str
    emissao: str
    vencimento: str
    data_pagamento: str
    valor_pago: float
    conta_origem: str
    created_at: datetime

    model_config = {"from_attributes": True}
