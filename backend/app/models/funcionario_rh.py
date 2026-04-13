from datetime import datetime

from sqlalchemy import SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FuncionarioRH(Base):
    __tablename__ = "funcionarios_rh"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo_interno: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    sobrenome: Mapped[str] = mapped_column(String(200), default="")
    apelido: Mapped[str] = mapped_column(String(100), default="")
    admissao: Mapped[str] = mapped_column(String(10), default="")
    nacionalidade: Mapped[str] = mapped_column(String(100), default="Brasileira")
    nascimento: Mapped[str] = mapped_column(String(10), default="")
    sexo: Mapped[str] = mapped_column(String(20), default="")
    cpf: Mapped[str] = mapped_column(String(14), default="")
    rg: Mapped[str] = mapped_column(String(20), default="")
    pis: Mapped[str] = mapped_column(String(20), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    telefone: Mapped[str] = mapped_column(String(20), default="")
    notificacao: Mapped[int] = mapped_column(SmallInteger, default=0)
    whatsapp: Mapped[int] = mapped_column(SmallInteger, default=0)
    cep: Mapped[str] = mapped_column(String(10), default="")
    rua: Mapped[str] = mapped_column(String(300), default="")
    bairro: Mapped[str] = mapped_column(String(200), default="")
    numero: Mapped[str] = mapped_column(String(20), default="")
    complemento: Mapped[str] = mapped_column(String(200), default="")
    estado: Mapped[str] = mapped_column(String(2), default="")
    cidade: Mapped[str] = mapped_column(String(200), default="")
    escolaridade: Mapped[str] = mapped_column(String(50), default="")
    cei: Mapped[str] = mapped_column(String(50), default="")
    fornecedor: Mapped[str] = mapped_column(String(200), default="")
    ocupacao: Mapped[str] = mapped_column(String(200), default="")
    tipos_documentos: Mapped[str] = mapped_column(String(200), default="")
    certificacoes: Mapped[str] = mapped_column(Text, default="")
    foto: Mapped[str] = mapped_column(Text, default="")
    documentos: Mapped[dict] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
