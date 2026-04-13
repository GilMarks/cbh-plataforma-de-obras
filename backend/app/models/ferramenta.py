from datetime import datetime

from sqlalchemy import String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Ferramenta(Base):
    __tablename__ = "ferramentas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    codigo: Mapped[str] = mapped_column(String(50), default="")
    status: Mapped[str] = mapped_column(String(20), default="Disponivel")
    responsavel_atual: Mapped[str] = mapped_column(String(200), default="")
    data_emprestimo: Mapped[str] = mapped_column(String(10), default="")
    data_devolvida: Mapped[str] = mapped_column(String(10), default="")
    historico_uso: Mapped[dict] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
