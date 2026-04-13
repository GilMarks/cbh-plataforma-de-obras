from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.obra import Obra
    from app.models.montagem import Montagem


class Carregamento(Base):
    __tablename__ = "carregamentos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), nullable=False, index=True)
    obra_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    veiculo: Mapped[str] = mapped_column(String(20), nullable=False)
    paineis: Mapped[dict] = mapped_column(JSONB, default=list)
    sequencia_montagem: Mapped[dict] = mapped_column(JSONB, default=list)
    status_autorizacao: Mapped[str] = mapped_column(String(20), default="Aguardando", index=True)
    autorizado_por: Mapped[str] = mapped_column(String(100), default="")
    data_autorizacao: Mapped[str] = mapped_column(String(10), default="")
    data_solicitacao: Mapped[str] = mapped_column(String(10), default="")
    solicitante: Mapped[str] = mapped_column(String(100), default="")
    executado_por: Mapped[str] = mapped_column(String(100), default="")
    data_execucao: Mapped[str] = mapped_column(String(10), default="")
    status: Mapped[str] = mapped_column(String(20), default="Pendente", index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    obra: Mapped["Obra"] = relationship(back_populates="carregamentos")
    montagens: Mapped[list["Montagem"]] = relationship(back_populates="carregamento")

    __table_args__ = (
        Index("ix_carregamentos_obra_status", "obra_id", "status"),
    )
