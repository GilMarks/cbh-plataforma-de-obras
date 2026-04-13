from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.obra import Obra


class Solicitacao(Base):
    __tablename__ = "solicitacoes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), nullable=False, index=True)
    obra_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cliente_nome: Mapped[str] = mapped_column(String(200), default="")

    # Paineis
    paineis: Mapped[int] = mapped_column(Integer, default=0)
    painel_comp: Mapped[float] = mapped_column(Numeric(5, 2), default=5)
    painel_alt: Mapped[float] = mapped_column(Numeric(5, 2), default=3)
    tipo_painel: Mapped[str] = mapped_column(String(50), default="Liso")
    ra_painel: Mapped[str] = mapped_column(String(50), default="")
    status_painel: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_painel: Mapped[int] = mapped_column(Integer, default=0)
    saldo_painel: Mapped[int] = mapped_column(Integer, default=0)
    historico_painel: Mapped[dict] = mapped_column(JSONB, default=list)

    # Pilares
    pilares: Mapped[int] = mapped_column(Integer, default=0)
    pilar_alt: Mapped[float] = mapped_column(Numeric(5, 2), default=3)
    bainha_pilar: Mapped[int] = mapped_column(Integer, default=0)
    status_pilar: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_pilar: Mapped[int] = mapped_column(Integer, default=0)
    saldo_pilar: Mapped[int] = mapped_column(Integer, default=0)
    historico_pilar: Mapped[dict] = mapped_column(JSONB, default=list)

    # Sapatas
    sapatas: Mapped[int] = mapped_column(Integer, default=0)
    tamanho_sapata: Mapped[str] = mapped_column(String(50), default="Grande")
    tipo_sapata: Mapped[str] = mapped_column(String(50), default="Normal")
    status_sapata: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_sapata: Mapped[int] = mapped_column(Integer, default=0)
    saldo_sapata: Mapped[int] = mapped_column(Integer, default=0)
    historico_sapata: Mapped[dict] = mapped_column(JSONB, default=list)

    # Gerais
    data: Mapped[str] = mapped_column(String(10), default="")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    solicitante: Mapped[str] = mapped_column(String(100), default="")
    cargo_solicitante: Mapped[str] = mapped_column(String(50), default="")
    data_solicitacao_registro: Mapped[str] = mapped_column(String(10), default="")
    status_autorizacao: Mapped[str] = mapped_column(String(20), default="Aguardando", index=True)
    autorizado_por: Mapped[str] = mapped_column(String(100), default="")
    data_autorizacao: Mapped[str] = mapped_column(String(10), default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    obra: Mapped["Obra"] = relationship(back_populates="solicitacoes")
