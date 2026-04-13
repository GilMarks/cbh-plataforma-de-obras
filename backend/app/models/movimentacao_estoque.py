from datetime import datetime

from sqlalchemy import ForeignKey, Index, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id"), nullable=False, index=True)
    insumo_nome: Mapped[str] = mapped_column(String(200), default="")
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)
    quantidade: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    obra_destino: Mapped[str] = mapped_column(String(200), default="")
    data: Mapped[str] = mapped_column(String(10), default="")
    responsavel: Mapped[str] = mapped_column(String(100), default="")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        Index("ix_movimentacoes_insumo_data", "insumo_id", "data"),
    )
