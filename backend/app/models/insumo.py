from datetime import datetime

from sqlalchemy import Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Insumo(Base):
    __tablename__ = "insumos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    coeficiente: Mapped[float] = mapped_column(Numeric(10, 4), default=0)
    estoque_atual: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    estoque_minimo: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
