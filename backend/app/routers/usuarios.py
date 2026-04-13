from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, hash_password, require_cargo
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate

router = APIRouter()

LEITORES = ["Master", "Mestre", "Encarregado", "Financeiro", "Compras", "RH"]


@router.get("", response_model=list[UsuarioResponse])
async def listar_usuarios(
    ativo: int | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(LEITORES)),
):
    q = select(Usuario)
    if ativo is not None:
        q = q.where(Usuario.ativo == ativo)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def buscar_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(LEITORES)),
):
    user = await db.get(Usuario, usuario_id)
    if not user:
        raise HTTPException(404, "Usuario nao encontrado")
    return user


@router.post("", response_model=UsuarioResponse)
async def criar_usuario(
    body: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    tipo = "Master" if body.cargo == "Master" else "Usuario"
    user = Usuario(
        login=body.login,
        senha_hash=hash_password(body.senha),
        cargo=body.cargo,
        tipo=tipo,
        foto=body.foto,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def atualizar_usuario(
    usuario_id: int,
    body: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    user = await db.get(Usuario, usuario_id)
    if not user:
        raise HTTPException(404, "Usuario nao encontrado")

    if body.login is not None:
        user.login = body.login
    if body.senha:
        user.senha_hash = hash_password(body.senha)
    if body.cargo is not None:
        user.cargo = body.cargo
        user.tipo = "Master" if body.cargo == "Master" else "Usuario"
    if body.foto is not None:
        user.foto = body.foto

    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{usuario_id}/toggle-ativo", response_model=UsuarioResponse)
async def toggle_ativo(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    user = await db.get(Usuario, usuario_id)
    if not user:
        raise HTTPException(404, "Usuario nao encontrado")
    user.ativo = 0 if user.ativo == 1 else 1
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{usuario_id}")
async def remover_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_cargo(["Master"])),
):
    user = await db.get(Usuario, usuario_id)
    if not user:
        raise HTTPException(404, "Usuario nao encontrado")
    await db.delete(user)
    await db.commit()
    return {"ok": True}
