from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_db,
    verify_password,
)
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.config import settings
from jose import JWTError, jwt

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.login == body.login))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.senha, user.senha_hash) or user.ativo != 1:
        raise HTTPException(status_code=401, detail="Credenciais invalidas")

    access_token = create_access_token({"sub": user.id, "cargo": user.cargo})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user={
            "id": user.id,
            "login": user.login,
            "cargo": user.cargo,
            "tipo": user.tipo,
            "foto": user.foto,
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(body.refresh_token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token tipo invalido")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token invalido")

    result = await db.execute(select(Usuario).where(Usuario.id == user_id, Usuario.ativo == 1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario nao encontrado")

    new_access = create_access_token({"sub": user.id, "cargo": user.cargo})
    return TokenResponse(access_token=new_access, token_type="bearer")


@router.post("/logout")
async def logout():
    return {"ok": True}


@router.get("/me")
async def me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "login": current_user.login,
        "cargo": current_user.cargo,
        "tipo": current_user.tipo,
        "foto": current_user.foto,
    }
