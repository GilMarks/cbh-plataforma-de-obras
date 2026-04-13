from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import hash_password
from app.models.config import Config
from app.models.obra import Obra
from app.models.usuario import Usuario


async def seed_database(db: AsyncSession) -> None:
    result = await db.execute(select(func.count()).select_from(Usuario))
    count = result.scalar()
    if count > 0:
        return

    usuarios = [
        Usuario(login="admin", senha_hash=hash_password("admin123"), tipo="Master", cargo="Master", ativo=1),
        Usuario(login="Walason", senha_hash=hash_password("123456"), tipo="Master", cargo="Master", ativo=1),
        Usuario(login="Carlos", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Mestre", ativo=1),
        Usuario(login="Ana", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Financeiro", ativo=1),
        Usuario(login="Pedro", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Compras", ativo=1),
        Usuario(login="Joao", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Ferreiro", ativo=1),
        Usuario(login="Maria", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Betoneiro", ativo=1),
    ]
    db.add_all(usuarios)

    obras = [
        Obra(nome="Residencial Aurora", cliente="Construtora Alpha", local="Sao Paulo, SP",
             observacoes="Prazo: 6 meses", paineis_min=120, pilares_min=60, sapatas_min=60),
        Obra(nome="Edificio Horizon", cliente="Beta Engenharia", local="Campinas, SP",
             observacoes="", paineis_min=200, pilares_min=100, sapatas_min=100),
        Obra(nome="Centro Logistico Sul", cliente="LogTech Brasil", local="Curitiba, PR",
             observacoes="Fase 2", paineis_min=80, pilares_min=40, sapatas_min=40),
        Obra(nome="Parque Empresarial Norte", cliente="GrupoNB", local="Brasilia, DF",
             observacoes="Inicio previsto: Mai/2026", paineis_min=160, pilares_min=80, sapatas_min=80),
        Obra(nome="Condominio Villa Verde", cliente="Incorporadora Verde", local="Porto Alegre, RS",
             observacoes="Obra concluida", paineis_min=90, pilares_min=45, sapatas_min=45),
    ]
    db.add_all(obras)

    db.add(Config(chave="numeroProcesso", valor="0"))

    await db.commit()
