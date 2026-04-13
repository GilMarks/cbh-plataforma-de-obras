from datetime import datetime

from sqlalchemy import Index, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LancamentoFinanceiro(Base):
    __tablename__ = "lancamentos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)
    centro: Mapped[str] = mapped_column(String(200), default="")
    descricao: Mapped[str] = mapped_column(String(500), default="")
    fornecedor: Mapped[str] = mapped_column(String(200), default="")
    valor: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    forma_pagamento: Mapped[str] = mapped_column(String(50), default="")
    status: Mapped[str] = mapped_column(String(20), default="Pendente", index=True)
    proc_id: Mapped[int] = mapped_column(Integer, default=0)
    data: Mapped[str] = mapped_column(String(10), default="")
    emissao: Mapped[str] = mapped_column(String(10), default="")
    vencimento: Mapped[str] = mapped_column(String(10), default="")
    data_pagamento: Mapped[str] = mapped_column(String(10), default="")
    valor_pago: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    conta_origem: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        Index("ix_lancamentos_tipo_status", "tipo", "status"),
    )
