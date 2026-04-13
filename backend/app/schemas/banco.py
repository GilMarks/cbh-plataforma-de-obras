from datetime import datetime

from pydantic import BaseModel


class BancoCreate(BaseModel):
    nome: str
    agencia: str = ""
    conta: str = ""
    instituicao: str = ""
    tipo_conta: str = "Conta Corrente PJ"
    chave_pix: str = ""
    saldo_inicial: float = 0


class BancoUpdate(BancoCreate):
    nome: str | None = None


class BancoResponse(BaseModel):
    id: int
    nome: str
    agencia: str
    conta: str
    instituicao: str
    tipo_conta: str
    chave_pix: str
    saldo_inicial: float
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
