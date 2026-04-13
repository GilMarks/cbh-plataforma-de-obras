from datetime import datetime

from sqlalchemy import ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SolicitacaoCompra(Base):
    __tablename__ = "solicitacoes_compra"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), nullable=False, index=True)
    obra_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    setor: Mapped[str] = mapped_column(String(100), default="")
    item: Mapped[str] = mapped_column(String(300), nullable=False)
    quantidade: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    prioridade: Mapped[str] = mapped_column(String(10), default="Media")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    solicitante: Mapped[str] = mapped_column(String(100), default="")
    data: Mapped[str] = mapped_column(String(10), default="")
    status: Mapped[str] = mapped_column(String(30), default="SOLICITADO")
    fornecedor: Mapped[str] = mapped_column(String(200), default="")
    valor: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    pagamento: Mapped[str] = mapped_column(String(50), default="")
    imagem_orcamento: Mapped[str] = mapped_column(Text, default="")
    status_fluxo: Mapped[str] = mapped_column(String(30), default="SOLICITADO", index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
