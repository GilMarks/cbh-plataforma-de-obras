from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.carregamento import Carregamento


class Montagem(Base):
    __tablename__ = "montagens"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), nullable=False, index=True)
    obra_nome: Mapped[str] = mapped_column(String(200), default="")
    carregamento_id: Mapped[int] = mapped_column(ForeignKey("carregamentos.id"), nullable=False, index=True)
    painel_id: Mapped[str] = mapped_column(String(100), default="")
    tipo: Mapped[str] = mapped_column(String(50), default="")
    dimensao: Mapped[str] = mapped_column(String(50), default="")
    equipe_responsavel: Mapped[str] = mapped_column(String(200), default="")
    data_montagem: Mapped[str] = mapped_column(String(10), default="")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    carregamento: Mapped["Carregamento"] = relationship(back_populates="montagens")
