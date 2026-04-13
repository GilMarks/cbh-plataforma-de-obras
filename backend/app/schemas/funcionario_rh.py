from datetime import datetime

from pydantic import BaseModel


class FuncionarioCreate(BaseModel):
    nome: str
    sobrenome: str = ""
    apelido: str = ""
    admissao: str = ""
    nacionalidade: str = "Brasileira"
    nascimento: str = ""
    sexo: str = ""
    cpf: str = ""
    rg: str = ""
    pis: str = ""
    email: str = ""
    telefone: str = ""
    notificacao: int = 0
    whatsapp: int = 0
    cep: str = ""
    rua: str = ""
    bairro: str = ""
    numero: str = ""
    complemento: str = ""
    estado: str = ""
    cidade: str = ""
    escolaridade: str = ""
    cei: str = ""
    fornecedor: str = ""
    ocupacao: str = ""
    tipos_documentos: str = ""
    certificacoes: str = ""
    foto: str = ""
    documentos: list = []


class FuncionarioResponse(FuncionarioCreate):
    id: int
    codigo_interno: str
    created_at: datetime

    model_config = {"from_attributes": True}
