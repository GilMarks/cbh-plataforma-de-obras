from datetime import datetime

from sqlalchemy import Index, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    login: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="Usuario")
    cargo: Mapped[str] = mapped_column(String(50), nullable=False, default="Mestre")
    ativo: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    foto: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_usuarios_cargo", "cargo"),
        Index("ix_usuarios_ativo", "ativo"),
    )
