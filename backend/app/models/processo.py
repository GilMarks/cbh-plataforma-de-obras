from datetime import datetime

from sqlalchemy import ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Processo(Base):
    __tablename__ = "processos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    numero: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    obra: Mapped[str] = mapped_column(String(200), default="")
    item: Mapped[str] = mapped_column(String(300), default="")
    qtd: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    valor: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    forma_pagamento: Mapped[str] = mapped_column(String(50), default="")
    status: Mapped[str] = mapped_column(String(30), default="AGUARDANDO_AUTORIZACAO", index=True)
    timeline: Mapped[dict] = mapped_column(JSONB, default=list)
    solicitacao_compra_id: Mapped[int | None] = mapped_column(
        ForeignKey("solicitacoes_compra.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
