from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.solicitacao import Solicitacao
    from app.models.carregamento import Carregamento


class Obra(Base):
    __tablename__ = "obras"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    cliente: Mapped[str] = mapped_column(String(200), default="")
    local: Mapped[str] = mapped_column(String(300), default="")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    paineis_min: Mapped[int] = mapped_column(Integer, default=0)
    pilares_min: Mapped[int] = mapped_column(Integer, default=0)
    sapatas_min: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    solicitacoes: Mapped[list["Solicitacao"]] = relationship(back_populates="obra")
    carregamentos: Mapped[list["Carregamento"]] = relationship(back_populates="obra")
