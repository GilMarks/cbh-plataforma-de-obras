from datetime import datetime

from sqlalchemy import Boolean, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Banco(Base):
    __tablename__ = "bancos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    agencia: Mapped[str] = mapped_column(String(20), default="")
    conta: Mapped[str] = mapped_column(String(30), default="")
    instituicao: Mapped[str] = mapped_column(String(200), default="")
    tipo_conta: Mapped[str] = mapped_column(String(50), default="Conta Corrente PJ")
    chave_pix: Mapped[str] = mapped_column(String(200), default="")
    saldo_inicial: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
