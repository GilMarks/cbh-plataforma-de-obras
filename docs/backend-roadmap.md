# Roteiro de Implementacao Backend - CBH Plataforma de Obras

**Stack**: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL + Alembic + JWT + Pydantic v2
**Deploy**: Railway (Nixpacks)
**Versao**: 1.0
**Data**: 2026-04-12

---

## 1. Stack e Arquitetura

### 1.1 Dependencias Principais

```txt
# requirements.txt
fastapi==0.115.*
uvicorn[standard]==0.34.*
sqlalchemy[asyncio]==2.0.*
asyncpg==0.30.*
alembic==1.14.*
pydantic==2.10.*
pydantic-settings==2.7.*
python-jose[cryptography]==3.3.*
passlib[bcrypt]==1.7.*
python-multipart==0.0.*
httpx==0.28.*          # para testes
pytest==8.*
pytest-asyncio==0.24.*
```

### 1.2 Estrutura de Pastas

```
backend/
  alembic/
    versions/
    env.py
  alembic.ini
  app/
    __init__.py
    main.py                  # FastAPI app, CORS, lifespan
    config.py                # Settings via pydantic-settings
    database.py              # Engine, SessionLocal, Base
    dependencies.py          # get_db, get_current_user, require_cargo
    seed.py                  # Popular banco com dados iniciais
    models/
      __init__.py            # re-export de todos os models
      usuario.py
      obra.py
      solicitacao.py
      solicitacao_compra.py
      processo.py
      lancamento.py
      banco.py
      insumo.py
      fornecedor.py
      carregamento.py
      montagem.py
      movimentacao_estoque.py
      ferramenta.py
      funcionario_rh.py
      config.py
    schemas/
      __init__.py
      auth.py
      usuario.py
      obra.py
      solicitacao.py
      solicitacao_compra.py
      processo.py
      lancamento.py
      banco.py
      insumo.py
      fornecedor.py
      carregamento.py
      montagem.py
      movimentacao_estoque.py
      ferramenta.py
      funcionario_rh.py
      config.py
    routers/
      __init__.py
      auth.py
      usuarios.py
      obras.py
      solicitacoes.py
      solicitacoes_compra.py
      processos.py
      lancamentos.py
      bancos.py
      insumos.py
      fornecedores.py
      carregamentos.py
      montagens.py
      movimentacoes_estoque.py
      ferramentas.py
      funcionarios_rh.py
      autorizacao.py
      dashboard.py
    services/
      __init__.py
      autorizacao.py         # Logica de aprovacao/negacao
      fabrica.py             # Lancamento de producao, calculo status
      carregamento.py        # Reserva estoque, capacidade
      compras.py             # Fluxo solicitacao -> processo -> financeiro
    tests/
      __init__.py
      conftest.py
      test_auth.py
      test_usuarios.py
      test_solicitacoes.py
      test_autorizacao.py
      test_compras.py
      test_financeiro.py
  railway.toml
  Procfile
  pyproject.toml
```

### 1.3 Arquitetura em Camadas

```
Router (HTTP) -> Schema (validacao Pydantic) -> Service (regra de negocio) -> Model (SQLAlchemy) -> DB
```

- **Routers**: Recebem HTTP, validam payload via schema, delegam para service ou queries diretas.
- **Services**: Encapsulam regras de negocio complexas (aprovacao de compras, lancamento de producao).
- **Models**: Mapeamento ORM das tabelas.
- **Schemas**: Pydantic v2 models para request/response.
- **Dependencies**: Injecao de sessao DB, usuario autenticado e validacao de cargo.

---

## 2. Modelagem do Banco de Dados

### 2.1 Diagrama de Entidades

```
usuarios
obras
solicitacoes          -> obras (FK obraId)
solicitacoes_compra   -> obras (FK obraId)
processos             -> solicitacoes_compra (FK solicitacao_compra_id, opcional)
lancamentos           -> processos (FK proc_id, opcional)
bancos
insumos
fornecedores
carregamentos         -> obras (FK obraId)
montagens             -> obras (FK obraId), carregamentos (FK carregamentoId)
movimentacoes_estoque -> insumos (FK insumoId)
ferramentas
funcionarios_rh
config
```

### 2.2 DDL dos Models (SQLAlchemy 2.0)

#### usuarios

```python
class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    login: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="Usuario")  # Master | Usuario
    cargo: Mapped[str] = mapped_column(String(50), nullable=False, default="Mestre")
    ativo: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    foto: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
```

**Indices**: `login` (unique), `cargo` (btree), `ativo` (btree).

#### obras

```python
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

    # Relationships
    solicitacoes: Mapped[list["Solicitacao"]] = relationship(back_populates="obra")
    carregamentos: Mapped[list["Carregamento"]] = relationship(back_populates="obra")
```

#### solicitacoes

```python
class Solicitacao(Base):
    __tablename__ = "solicitacoes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), nullable=False, index=True)
    obra_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cliente_nome: Mapped[str] = mapped_column(String(200), default="")

    # Paineis
    paineis: Mapped[int] = mapped_column(Integer, default=0)
    painel_comp: Mapped[float] = mapped_column(Numeric(5, 2), default=5)
    painel_alt: Mapped[float] = mapped_column(Numeric(5, 2), default=3)
    tipo_painel: Mapped[str] = mapped_column(String(50), default="Liso")
    ra_painel: Mapped[str] = mapped_column(String(50), default="")
    status_painel: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_painel: Mapped[int] = mapped_column(Integer, default=0)
    saldo_painel: Mapped[int] = mapped_column(Integer, default=0)
    historico_painel: Mapped[dict] = mapped_column(JSONB, default=list)

    # Pilares
    pilares: Mapped[int] = mapped_column(Integer, default=0)
    pilar_alt: Mapped[float] = mapped_column(Numeric(5, 2), default=3)
    bainha_pilar: Mapped[int] = mapped_column(Integer, default=0)
    status_pilar: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_pilar: Mapped[int] = mapped_column(Integer, default=0)
    saldo_pilar: Mapped[int] = mapped_column(Integer, default=0)
    historico_pilar: Mapped[dict] = mapped_column(JSONB, default=list)

    # Sapatas
    sapatas: Mapped[int] = mapped_column(Integer, default=0)
    tamanho_sapata: Mapped[str] = mapped_column(String(50), default="Grande")
    tipo_sapata: Mapped[str] = mapped_column(String(50), default="Normal")
    status_sapata: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_sapata: Mapped[int] = mapped_column(Integer, default=0)
    saldo_sapata: Mapped[int] = mapped_column(Integer, default=0)
    historico_sapata: Mapped[dict] = mapped_column(JSONB, default=list)

    # Gerais
    data: Mapped[str] = mapped_column(String(10), default="")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    solicitante: Mapped[str] = mapped_column(String(100), default="")
    cargo_solicitante: Mapped[str] = mapped_column(String(50), default="")
    data_solicitacao_registro: Mapped[str] = mapped_column(String(10), default="")
    status_autorizacao: Mapped[str] = mapped_column(String(20), default="Aguardando", index=True)
    autorizado_por: Mapped[str] = mapped_column(String(100), default="")
    data_autorizacao: Mapped[str] = mapped_column(String(10), default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationship
    obra: Mapped["Obra"] = relationship(back_populates="solicitacoes")
```

**Indices**: `obra_id`, `status_autorizacao`.

#### solicitacoes_compra

```python
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
    imagem_orcamento: Mapped[str] = mapped_column(Text, default="")  # base64
    status_fluxo: Mapped[str] = mapped_column(String(30), default="SOLICITADO", index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

**Indices**: `obra_id`, `status_fluxo`.

#### processos

```python
class Processo(Base):
    __tablename__ = "processos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    numero: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)  # CP-XXXXX
    obra: Mapped[str] = mapped_column(String(200), default="")
    item: Mapped[str] = mapped_column(String(300), default="")
    qtd: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    valor: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    forma_pagamento: Mapped[str] = mapped_column(String(50), default="")
    status: Mapped[str] = mapped_column(String(30), default="AGUARDANDO_AUTORIZACAO", index=True)
    timeline: Mapped[dict] = mapped_column(JSONB, default=list)
    solicitacao_compra_id: Mapped[int | None] = mapped_column(
        ForeignKey("solicitacoes_compra.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

#### lancamentos

```python
class LancamentoFinanceiro(Base):
    __tablename__ = "lancamentos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)  # Despesa | Receita
    centro: Mapped[str] = mapped_column(String(200), default="")
    descricao: Mapped[str] = mapped_column(String(500), default="")
    fornecedor: Mapped[str] = mapped_column(String(200), default="")
    valor: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    forma_pagamento: Mapped[str] = mapped_column(String(50), default="")
    status: Mapped[str] = mapped_column(String(20), default="Pendente", index=True)  # Pendente | Vencido | Pago
    proc_id: Mapped[int] = mapped_column(Integer, default=0)
    data: Mapped[str] = mapped_column(String(10), default="")
    emissao: Mapped[str] = mapped_column(String(10), default="")
    vencimento: Mapped[str] = mapped_column(String(10), default="")
    data_pagamento: Mapped[str] = mapped_column(String(10), default="")
    valor_pago: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    conta_origem: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

**Indices**: `status`, `tipo`.

**Nota**: Diferente do frontend, no backend vamos persistir `data_pagamento`, `valor_pago` e `conta_origem` (campos que o frontend coletava mas nao salvava).

#### bancos

```python
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
```

**Nota**: Persistimos os campos que o frontend coletava mas ignorava (instituicao, tipo_conta, chave_pix, saldo_inicial, ativo).

#### insumos

```python
class Insumo(Base):
    __tablename__ = "insumos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    coeficiente: Mapped[float] = mapped_column(Numeric(10, 4), default=0)
    estoque_atual: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    estoque_minimo: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

#### fornecedores

```python
class Fornecedor(Base):
    __tablename__ = "fornecedores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    fone: Mapped[str] = mapped_column(String(30), default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

#### carregamentos

```python
class Carregamento(Base):
    __tablename__ = "carregamentos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), nullable=False, index=True)
    obra_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    veiculo: Mapped[str] = mapped_column(String(20), nullable=False)  # Munck | Carreta
    paineis: Mapped[dict] = mapped_column(JSONB, default=list)  # array de PainelCarregamento
    sequencia_montagem: Mapped[dict] = mapped_column(JSONB, default=list)
    status_autorizacao: Mapped[str] = mapped_column(String(20), default="Aguardando", index=True)
    autorizado_por: Mapped[str] = mapped_column(String(100), default="")
    data_autorizacao: Mapped[str] = mapped_column(String(10), default="")
    data_solicitacao: Mapped[str] = mapped_column(String(10), default="")
    solicitante: Mapped[str] = mapped_column(String(100), default="")
    executado_por: Mapped[str] = mapped_column(String(100), default="")
    data_execucao: Mapped[str] = mapped_column(String(10), default="")
    status: Mapped[str] = mapped_column(String(20), default="Pendente", index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    obra: Mapped["Obra"] = relationship(back_populates="carregamentos")
    montagens: Mapped[list["Montagem"]] = relationship(back_populates="carregamento")
```

#### montagens

```python
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
```

#### movimentacoes_estoque

```python
class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id"), nullable=False, index=True)
    insumo_nome: Mapped[str] = mapped_column(String(200), default="")
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)  # Entrada | Saida
    quantidade: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    obra_destino: Mapped[str] = mapped_column(String(200), default="")
    data: Mapped[str] = mapped_column(String(10), default="")
    responsavel: Mapped[str] = mapped_column(String(100), default="")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

#### ferramentas

```python
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
```

#### funcionarios_rh

```python
class FuncionarioRH(Base):
    __tablename__ = "funcionarios_rh"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo_interno: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    sobrenome: Mapped[str] = mapped_column(String(200), default="")
    apelido: Mapped[str] = mapped_column(String(100), default="")
    admissao: Mapped[str] = mapped_column(String(10), default="")
    nacionalidade: Mapped[str] = mapped_column(String(100), default="Brasileira")
    nascimento: Mapped[str] = mapped_column(String(10), default="")
    sexo: Mapped[str] = mapped_column(String(20), default="")
    cpf: Mapped[str] = mapped_column(String(14), default="")
    rg: Mapped[str] = mapped_column(String(20), default="")
    pis: Mapped[str] = mapped_column(String(20), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    telefone: Mapped[str] = mapped_column(String(20), default="")
    notificacao: Mapped[int] = mapped_column(SmallInteger, default=0)
    whatsapp: Mapped[int] = mapped_column(SmallInteger, default=0)
    cep: Mapped[str] = mapped_column(String(10), default="")
    rua: Mapped[str] = mapped_column(String(300), default="")
    bairro: Mapped[str] = mapped_column(String(200), default="")
    numero: Mapped[str] = mapped_column(String(20), default="")
    complemento: Mapped[str] = mapped_column(String(200), default="")
    estado: Mapped[str] = mapped_column(String(2), default="")
    cidade: Mapped[str] = mapped_column(String(200), default="")
    escolaridade: Mapped[str] = mapped_column(String(50), default="")
    cei: Mapped[str] = mapped_column(String(50), default="")
    fornecedor: Mapped[str] = mapped_column(String(200), default="")
    ocupacao: Mapped[str] = mapped_column(String(200), default="")
    tipos_documentos: Mapped[str] = mapped_column(String(200), default="")
    certificacoes: Mapped[str] = mapped_column(Text, default="")
    foto: Mapped[str] = mapped_column(Text, default="")
    documentos: Mapped[dict] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

#### config

```python
class Config(Base):
    __tablename__ = "config"

    chave: Mapped[str] = mapped_column(String(100), primary_key=True)
    valor: Mapped[str] = mapped_column(Text, default="")
```

Usada para armazenar contadores (ex: `numeroProcesso`) e flags globais.

### 2.3 Campos JSONB

| Tabela | Campo | Conteudo |
|---|---|---|
| solicitacoes | historico_painel | `[{data, qtd, responsavel}]` |
| solicitacoes | historico_pilar | idem |
| solicitacoes | historico_sapata | idem |
| processos | timeline | `[{data, status, responsavel}]` |
| carregamentos | paineis | `[{solicitacaoId, tipo, dimensao, comp, alt, posicaoCarregamento, lado, camada, ...}]` |
| carregamentos | sequencia_montagem | `[int]` |
| ferramentas | historico_uso | `[{responsavel, dataRetirada, dataDevolucao}]` |
| funcionarios_rh | documentos | `[{nome, tipo, conteudo}]` |

### 2.4 Indices Adicionais Recomendados

```sql
CREATE INDEX ix_solicitacoes_obra_status ON solicitacoes (obra_id, status_autorizacao);
CREATE INDEX ix_lancamentos_tipo_status ON lancamentos (tipo, status);
CREATE INDEX ix_carregamentos_obra_status ON carregamentos (obra_id, status);
CREATE INDEX ix_movimentacoes_insumo_data ON movimentacoes_estoque (insumo_id, data);
```

---

## 3. Sistema de Auth JWT + RBAC

### 3.1 Configuracao

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:pass@localhost/cbh"
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480   # 8 horas
    refresh_token_expire_days: int = 30
    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
```

### 3.2 Geracao de Tokens

```python
# app/dependencies.py (parte auth)
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
```

### 3.3 Dependency de Usuario Autenticado

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or user.ativo != 1:
        raise credentials_exception
    return user
```

### 3.4 Dependency de RBAC (require_cargo)

```python
from functools import wraps
from typing import Sequence

def require_cargo(cargos_permitidos: Sequence[str]):
    """
    Dependency factory que valida se o cargo do usuario esta na lista.
    Master sempre tem acesso (wildcard).

    Uso:
        @router.get("/", dependencies=[Depends(require_cargo(["Master", "Mestre"]))])
        async def listar_obras(...): ...

    Ou como parametro injetado:
        async def criar_obra(user: Usuario = Depends(require_cargo(["Master", "Mestre"]))): ...
    """
    async def _dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.cargo == "Master":
            return current_user
        if current_user.cargo not in cargos_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cargo '{current_user.cargo}' nao tem permissao para esta acao",
            )
        return current_user
    return _dependency
```

### 3.5 Refresh Token Strategy

O login retorna dois tokens: `access_token` (curta duracao, 8h) e `refresh_token` (longa duracao, 30 dias).

Fluxo:
1. Frontend guarda `access_token` em memoria (variavel) e `refresh_token` em `localStorage`.
2. Toda request envia `access_token` no header `Authorization: Bearer <token>`.
3. Quando receber 401, o frontend chama `POST /api/auth/refresh` com o `refresh_token`.
4. Backend valida o refresh token e retorna novo `access_token`.
5. Se o refresh tambem expirou, redireciona para `/login`.

```python
# Endpoint de refresh
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
```

---

## 4. Endpoints por Modulo

Prefixo global: `/api`

### 4.1 Auth (`/api/auth`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| POST | `/login` | Login com credenciais | `{login, senha}` | `{access_token, refresh_token, token_type, user}` | Publico |
| POST | `/refresh` | Renovar access token | `{refresh_token}` | `{access_token, token_type}` | Publico |
| POST | `/logout` | Invalida sessao (no-op server-side, frontend limpa tokens) | - | `{ok: true}` | Autenticado |
| GET | `/me` | Dados do usuario logado | - | `Usuario` | Autenticado |

### 4.2 Usuarios (`/api/usuarios`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar usuarios | query: `?ativo=1` | `Usuario[]` | Master, Mestre, Encarregado, Financeiro, Compras, RH |
| GET | `/{id}` | Buscar por ID | - | `Usuario` | idem |
| POST | `/` | Criar usuario | `{login, senha, cargo, foto?}` | `Usuario` | Master |
| PUT | `/{id}` | Atualizar usuario | `{login?, senha?, cargo?, foto?}` | `Usuario` | Master |
| PATCH | `/{id}/toggle-ativo` | Ativar/desativar | - | `Usuario` | Master |
| DELETE | `/{id}` | Remover usuario | - | `{ok: true}` | Master |

**Regras**:
- `tipo` derivado automaticamente: cargo "Master" -> tipo "Master", qualquer outro -> "Usuario".
- `senha` no PUT e opcional; se vazia, mantem hash atual.
- Senha hasheada com bcrypt antes de salvar.

### 4.3 Obras (`/api/obras`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar obras | - | `Obra[]` (com campo calculado `progresso`) | Master, Mestre, Encarregado |
| GET | `/{id}` | Buscar por ID | - | `Obra` | idem |
| POST | `/` | Criar obra | `{nome, cliente?, local?, observacoes?, paineisMin?, pilaresMin?, sapatasMin?}` | `Obra` | Master, Mestre, Encarregado |
| PUT | `/{id}` | Atualizar obra | idem | `Obra` | Master, Mestre, Encarregado |
| DELETE | `/{id}` | Remover obra | - | `{ok: true}` | Master |
| GET | `/{id}/progresso` | Progresso detalhado | - | `{paineis: {total, fabricado, %}, pilares: {...}, sapatas: {...}}` | Master, Mestre, Encarregado |

**Regra de progresso**: calcula `fabricado / total` para cada tipo, somando todas as solicitacoes daquela obra.

### 4.4 Solicitacoes de Fabricacao (`/api/solicitacoes`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar | query: `?obraId=&status_autorizacao=` | `Solicitacao[]` | Master, Mestre, Encarregado |
| GET | `/{id}` | Buscar por ID | - | `Solicitacao` | idem |
| POST | `/` | Criar solicitacao | `{obraId, paineis, painelComp?, painelAlt?, tipoPainel?, pilares, pilarAlt?, sapatas, tamanhoSapata?, tipoSapata?, observacoes?}` | `Solicitacao` | Master, Mestre, Encarregado |
| DELETE | `/{id}` | Remover | - | `{ok: true}` | Master |

**Regras**:
- Criacao sempre com `statusAutorizacao: "Aguardando"`.
- `solicitante` e `cargoSolicitante` preenchidos automaticamente a partir do JWT.
- `obraNome` e `clienteNome` resolvidos a partir do `obraId`.

### 4.5 Fabrica - Controle de Producao (`/api/fabrica`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/producao` | Solicitacoes autorizadas para producao | - | `Solicitacao[]` (onde statusAutorizacao=Autorizado) | Master, Mestre, Encarregado, Meio-profissional, Ferreiro, Betoneiro, Servente |
| POST | `/producao/{solicitacao_id}/lancar` | Lancar producao | `{tipo: "painel"|"pilar"|"sapata", quantidade: int}` | `Solicitacao` atualizada | idem |
| GET | `/historico` | Historico de producao achatado | query: `?tipo=&data_inicio=&data_fim=` | `HistoricoProducaoEntry[]` | Master, Mestre, Encarregado |
| GET | `/estoque` | Estoque de pecas fabricadas | query: `?obraId=&tipo=` | `EstoquePecaEntry[]` | Master, Mestre, Encarregado, Compras |

**Regras do lancamento de producao**:
- Valida `quantidade > 0`.
- Valida `fabricado + quantidade <= meta` (clamp no backend).
- Atualiza `fabricado{Tipo}`, `saldo{Tipo}`, `status{Tipo}`.
- Appenda em `historico{Tipo}`: `{data: hoje, qtd, responsavel: user.login}`.
- Status: `fabricado >= meta` -> "Fabricado", senao -> "Parcial".

### 4.6 Carregamentos (`/api/carregamentos`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar carregamentos | query: `?obraId=&status=&status_autorizacao=` | `Carregamento[]` | Master, Mestre, Encarregado |
| GET | `/{id}` | Buscar por ID | - | `Carregamento` | idem |
| POST | `/` | Criar carregamento (planejamento) | `{obraId, veiculo, paineis: [...]}` | `Carregamento` | Master, Mestre, Encarregado |
| POST | `/{id}/executar` | Marcar como carregado | - | `Carregamento` | Master, Mestre, Encarregado |
| GET | `/fabrica` | Carregamentos autorizados para execucao | - | `Carregamento[]` (autorizados, nao finalizados) | Master, Mestre, Encarregado |
| GET | `/disponiveis` | Paineis disponiveis para carregamento (com reserva) | query: `?obraId=` | `PainelDisponivel[]` | Master, Mestre, Encarregado |

**Regras**:
- Criado com `statusAutorizacao: "Aguardando"`, `status: "Pendente"`.
- `sequencia_montagem` calculada no backend (LIFO).
- `/executar`: Valida que `statusAutorizacao == "Autorizado"`. Atualiza `status: "Carregado"`, `executadoPor`, `dataExecucao`.
- Calculo de reserva: paineis ja alocados em carregamentos onde `statusAutorizacao != "Negado"` sao contados como reservados.

### 4.7 Montagens (`/api/montagens`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar montagens | query: `?obraId=&carregamentoId=` | `Montagem[]` | Master, Mestre, Encarregado |
| POST | `/` | Registrar montagem de carregamento | `{carregamentoId, equipeResponsavel, observacoes?}` | `Montagem[]` (cria uma por painel) | Master, Mestre, Encarregado |
| GET | `/carregamentos-disponiveis` | Carregamentos prontos para montagem | - | `Carregamento[]` (Carregado ou Entregue) | Master, Mestre, Encarregado |

**Regras**:
- Cria um registro `Montagem` por painel do carregamento.
- Atualiza carregamento: `status: "Entregue"`.

### 4.8 Autorizacao (`/api/autorizacao`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/pendencias` | Contadores por aba | - | `{compras: int, fabricacao: int, logistica: int, total: int}` | Master |
| GET | `/compras` | Solicitacoes de compra aguardando | - | `SolicitacaoCompra[]` | Master |
| POST | `/compras/{id}/aprovar` | Aprovar compra | - | `SolicitacaoCompra` | Master |
| POST | `/compras/{id}/negar` | Negar compra | - | `SolicitacaoCompra` | Master |
| GET | `/fabricacao` | Solicitacoes de fabricacao aguardando | - | `Solicitacao[]` | Master |
| POST | `/fabricacao/{id}/aprovar` | Aprovar fabricacao | - | `Solicitacao` | Master |
| POST | `/fabricacao/{id}/negar` | Negar fabricacao | - | `Solicitacao` | Master |
| GET | `/logistica` | Carregamentos aguardando | - | `Carregamento[]` | Master |
| POST | `/logistica/{id}/aprovar` | Aprovar carregamento | - | `Carregamento` | Master |
| POST | `/logistica/{id}/negar` | Negar carregamento | - | `Carregamento` | Master |

### 4.9 Solicitacoes de Compra (`/api/solicitacoes-compra`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar | query: `?obraId=&statusFluxo=` | `SolicitacaoCompra[]` | Master, Compras, Mestre, Encarregado |
| GET | `/{id}` | Buscar por ID | - | `SolicitacaoCompra` | idem |
| POST | `/` | Criar solicitacao | `{obraId, item, quantidade, unidade?, prioridade?, observacoes?}` | `SolicitacaoCompra` | Master, Mestre, Encarregado |
| PUT | `/{id}/cotacao` | Salvar cotacao | `{fornecedor, valor?, pagamento?, imagemOrcamento?}` | `SolicitacaoCompra` | Master, Compras |
| POST | `/{id}/enviar-autorizacao` | Enviar para autorizacao | - | `{solicitacao: SolicitacaoCompra, processo: Processo}` | Master, Compras |
| DELETE | `/{id}` | Remover | - | `{ok: true}` | Master |

**Regras**:
- Criada com `status: "SOLICITADO"`, `statusFluxo: "SOLICITADO"`.
- `/cotacao`: Atualiza `statusFluxo: "EM_ORCAMENTO"`. `fornecedor` obrigatorio.
- `/enviar-autorizacao`: Atualiza `statusFluxo: "AGUARDANDO_AUTORIZACAO"`. Cria `Processo` com numero `CP-XXXXX`.

### 4.10 Processos (`/api/processos`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar processos | query: `?status=` | `Processo[]` | Master, Compras, Mestre, Encarregado |
| GET | `/{id}` | Buscar por ID | - | `Processo` | idem |

**Somente leitura** - processos sao criados e atualizados via fluxo de compras/autorizacao.

### 4.11 Lancamentos Financeiros (`/api/lancamentos`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar | query: `?tipo=&status=&centro=` | `LancamentoFinanceiro[]` | Master, Financeiro |
| GET | `/{id}` | Buscar por ID | - | `LancamentoFinanceiro` | idem |
| POST | `/` | Criar lancamento manual | `{tipo, centro, descricao, fornecedor?, valor, formaPagamento?, vencimento?}` | `LancamentoFinanceiro` | Master, Financeiro |
| POST | `/{id}/pagar` | Processar pagamento | `{bancoId, dataPagamento?, valorPago?}` | `LancamentoFinanceiro` | Master, Financeiro |
| GET | `/dashboard` | KPIs financeiros | query: `?periodo=` | `{totalReceitas, totalDespesas, saldo, totalAtrasado, proximasContas: [...], ultimasEntradas: [...]}` | Master, Financeiro |

**Regras do pagamento**:
- Valida que `status != "Pago"`.
- Atualiza: `status: "Pago"`, `data_pagamento`, `valor_pago`, `conta_origem` (nome do banco).
- Se `valorPago` nao informado, usa `valor` original.

### 4.12 Bancos (`/api/bancos`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar bancos | - | `Banco[]` | Master, Financeiro |
| GET | `/{id}` | Buscar por ID | - | `Banco` | idem |
| POST | `/` | Criar banco | `{nome, agencia?, conta?, instituicao?, tipoConta?, chavePix?, saldoInicial?}` | `Banco` | Master, Financeiro |
| PUT | `/{id}` | Atualizar banco | idem | `Banco` | Master, Financeiro |
| DELETE | `/{id}` | Remover banco | - | `{ok: true}` | Master, Financeiro |

### 4.13 Insumos (`/api/insumos`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar insumos | - | `Insumo[]` | Master, Compras, Mestre, Encarregado |
| POST | `/` | Criar insumo | `{nome, unidade?, estoqueMinimo?}` | `Insumo` | Master, Compras |
| PUT | `/{id}` | Atualizar insumo | `{nome?, unidade?, estoqueMinimo?}` | `Insumo` | Master, Compras |
| DELETE | `/{id}` | Remover insumo | - | `{ok: true}` | Master |
| POST | `/{id}/movimentar` | Entrada ou saida de estoque | `{tipo: "Entrada"|"Saida", quantidade, obraDestino?, observacoes?}` | `{insumo: Insumo, movimentacao: MovimentacaoEstoque}` | Master, Compras, Mestre |

**Regras da movimentacao**:
- `quantidade > 0` obrigatorio.
- Entrada: `estoqueAtual += quantidade`.
- Saida: `estoqueAtual = max(0, estoqueAtual - quantidade)`.
- `obraDestino` registrado apenas em Saida.
- `responsavel` preenchido via JWT.

### 4.14 Fornecedores (`/api/fornecedores`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar | - | `Fornecedor[]` | Master, Compras |
| POST | `/` | Criar | `{nome, fone?}` | `Fornecedor` | Master, Compras |
| PUT | `/{id}` | Atualizar | `{nome?, fone?}` | `Fornecedor` | Master, Compras |
| DELETE | `/{id}` | Remover | - | `{ok: true}` | Master, Compras |

### 4.15 Movimentacoes de Estoque (`/api/movimentacoes-estoque`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Historico de consumo | query: `?insumoId=&tipo=&data_inicio=&data_fim=` | `MovimentacaoEstoque[]` | Master, Compras, Mestre |
| GET | `/kpis` | KPIs | - | `{totalEntradas, totalSaidas, totalMovimentacoes}` | idem |

### 4.16 Ferramentas (`/api/ferramentas`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar ferramentas | - | `Ferramenta[]` | Master, Compras |
| POST | `/` | Criar ferramenta | `{nome, codigo?}` | `Ferramenta` | Master, Compras |
| PUT | `/{id}` | Atualizar | `{nome?, codigo?}` | `Ferramenta` | Master, Compras |
| DELETE | `/{id}` | Remover | - | `{ok: true}` | Master, Compras |
| POST | `/{id}/emprestar` | Emprestar | `{responsavel}` | `Ferramenta` | Master, Compras |
| POST | `/{id}/devolver` | Devolver | - | `Ferramenta` | Master, Compras |

**Regras**:
- Emprestar: `status: "Emprestada"`, `responsavelAtual`, `dataEmprestimo: hoje`.
- Devolver: Appenda `historicoUso`, limpa `responsavelAtual`, `status: "Disponivel"`.

### 4.17 Funcionarios RH (`/api/funcionarios-rh`)

| Metodo | Path | Descricao | Payload | Resposta | Cargos |
|---|---|---|---|---|---|
| GET | `/` | Listar | query: `?busca=` | `FuncionarioRH[]` | Master, RH |
| GET | `/{id}` | Buscar por ID | - | `FuncionarioRH` | idem |
| POST | `/` | Cadastrar funcionario | todos os campos (apenas `nome` obrigatorio) | `FuncionarioRH` | Master, RH |
| PUT | `/{id}` | Atualizar | idem | `FuncionarioRH` | Master, RH |
| DELETE | `/{id}` | Remover | - | `{ok: true}` | Master, RH |

**Regras**:
- `codigoInterno` gerado como `FUN-{timestamp}` automaticamente.
- Busca filtra por `nome`, `sobrenome`, `ocupacao` (case-insensitive) e `cpf` (substring).

### 4.18 Dashboard (`/api/dashboard`)

| Metodo | Path | Descricao | Resposta | Cargos |
|---|---|---|---|---|
| GET | `/` | Dashboard geral | `{totalObras, totalSolicitacoes, producaoHoje, pendenciasAutorizacao, obrasMaisAtivas: [...]}` | Master, Mestre |

---

## 5. Regras de Negocio Criticas no Backend

### 5.1 Aprovacao de Compras (Autorizacao)

Esta e a regra mais complexa do sistema. Ao aprovar uma solicitacao de compra:

```python
# app/services/autorizacao.py

async def aprovar_compra(
    db: AsyncSession,
    solicitacao_compra_id: int,
    user: Usuario,
) -> SolicitacaoCompra:
    hoje = date.today().isoformat()

    # 1. Atualiza SolicitacaoCompra
    sc = await db.get(SolicitacaoCompra, solicitacao_compra_id)
    if not sc or sc.status_fluxo != "AGUARDANDO_AUTORIZACAO":
        raise HTTPException(400, "Solicitacao nao esta aguardando autorizacao")

    sc.status_fluxo = "AUTORIZADO"
    sc.status = "AUTORIZADO"

    # 2. Busca e atualiza Processo correspondente
    result = await db.execute(
        select(Processo).where(
            Processo.item == sc.item,
            Processo.obra == sc.obra_nome,
        )
    )
    processo = result.scalar_one_or_none()

    if processo:
        processo.status = "NO_FINANCEIRO"
        timeline = list(processo.timeline or [])
        timeline.append({"data": hoje, "status": "AUTORIZADO", "responsavel": user.login})
        timeline.append({"data": hoje, "status": "NO_FINANCEIRO", "responsavel": "Sistema"})
        processo.timeline = timeline

    # 3. Cria LancamentoFinanceiro automaticamente
    lancamento = LancamentoFinanceiro(
        tipo="Despesa",
        centro=sc.obra_nome,
        descricao=sc.item,
        fornecedor=sc.fornecedor,
        valor=float(sc.valor),
        forma_pagamento=sc.pagamento,
        status="Pendente",
        proc_id=processo.id if processo else 0,
        data=hoje,
        emissao=hoje,
        vencimento="",
    )
    db.add(lancamento)

    await db.commit()
    await db.refresh(sc)
    return sc
```

### 5.2 Reserva de Estoque de Paineis no Carregamento

```python
# app/services/carregamento.py

async def calcular_paineis_disponiveis(
    db: AsyncSession,
    obra_id: int,
) -> list[dict]:
    """
    Calcula paineis disponiveis subtraindo os reservados.
    Reservados = paineis em carregamentos com statusAutorizacao != 'Negado'.
    """
    # Total fabricado por solicitacao
    result = await db.execute(
        select(Solicitacao).where(
            Solicitacao.obra_id == obra_id,
            Solicitacao.status_autorizacao == "Autorizado",
        )
    )
    solicitacoes = result.scalars().all()

    # Total reservado por solicitacao
    result = await db.execute(
        select(Carregamento).where(
            Carregamento.obra_id == obra_id,
            Carregamento.status_autorizacao != "Negado",
        )
    )
    carregamentos = result.scalars().all()

    reservados_por_solicitacao: dict[int, int] = {}
    for c in carregamentos:
        for p in (c.paineis or []):
            sid = p.get("solicitacaoId", 0)
            reservados_por_solicitacao[sid] = reservados_por_solicitacao.get(sid, 0) + 1

    paineis_disponiveis = []
    for s in solicitacoes:
        reservado = reservados_por_solicitacao.get(s.id, 0)
        disponivel = max(s.fabricado_painel - reservado, 0)
        if disponivel > 0:
            paineis_disponiveis.append({
                "solicitacaoId": s.id,
                "obraNome": s.obra_nome,
                "tipo": s.tipo_painel,
                "comp": float(s.painel_comp),
                "alt": float(s.painel_alt),
                "disponivel": disponivel,
                "fabricado": s.fabricado_painel,
                "reservado": reservado,
            })

    return paineis_disponiveis
```

### 5.3 Calculo de Status de Producao

```python
# app/services/fabrica.py

async def lancar_producao(
    db: AsyncSession,
    solicitacao_id: int,
    tipo: str,  # "painel" | "pilar" | "sapata"
    quantidade: int,
    responsavel: str,
) -> Solicitacao:
    s = await db.get(Solicitacao, solicitacao_id)
    if not s or s.status_autorizacao != "Autorizado":
        raise HTTPException(400, "Solicitacao nao autorizada")

    hoje = date.today().isoformat()

    if tipo == "painel":
        meta = s.paineis
        fabricado_atual = s.fabricado_painel
        # Clamp: nao ultrapassar meta
        qtd_efetiva = min(quantidade, meta - fabricado_atual)
        if qtd_efetiva <= 0:
            raise HTTPException(400, "Meta ja atingida para paineis")

        new_fab = fabricado_atual + qtd_efetiva
        s.fabricado_painel = new_fab
        s.saldo_painel = meta - new_fab
        s.status_painel = "Fabricado" if new_fab >= meta else "Parcial"

        historico = list(s.historico_painel or [])
        historico.append({"data": hoje, "qtd": qtd_efetiva, "responsavel": responsavel})
        s.historico_painel = historico

    elif tipo == "pilar":
        meta = s.pilares
        fabricado_atual = s.fabricado_pilar
        qtd_efetiva = min(quantidade, meta - fabricado_atual)
        if qtd_efetiva <= 0:
            raise HTTPException(400, "Meta ja atingida para pilares")

        new_fab = fabricado_atual + qtd_efetiva
        s.fabricado_pilar = new_fab
        s.saldo_pilar = meta - new_fab
        s.status_pilar = "Fabricado" if new_fab >= meta else "Parcial"

        historico = list(s.historico_pilar or [])
        historico.append({"data": hoje, "qtd": qtd_efetiva, "responsavel": responsavel})
        s.historico_pilar = historico

    elif tipo == "sapata":
        meta = s.sapatas
        fabricado_atual = s.fabricado_sapata
        qtd_efetiva = min(quantidade, meta - fabricado_atual)
        if qtd_efetiva <= 0:
            raise HTTPException(400, "Meta ja atingida para sapatas")

        new_fab = fabricado_atual + qtd_efetiva
        s.fabricado_sapata = new_fab
        s.saldo_sapata = meta - new_fab
        s.status_sapata = "Fabricado" if new_fab >= meta else "Parcial"

        historico = list(s.historico_sapata or [])
        historico.append({"data": hoje, "qtd": qtd_efetiva, "responsavel": responsavel})
        s.historico_sapata = historico

    else:
        raise HTTPException(400, f"Tipo invalido: {tipo}")

    await db.commit()
    await db.refresh(s)
    return s
```

### 5.4 Numeracao de Processos CP-XXXXX

```python
# app/services/compras.py

async def gerar_numero_processo(db: AsyncSession) -> str:
    """Gera proximo numero no formato CP-XXXXX."""
    result = await db.execute(
        select(Config).where(Config.chave == "numeroProcesso")
    )
    config = result.scalar_one_or_none()

    if config:
        proximo = int(config.valor) + 1
        config.valor = str(proximo)
    else:
        proximo = 1
        db.add(Config(chave="numeroProcesso", valor="1"))

    await db.flush()
    return f"CP-{proximo:05d}"


async def enviar_para_autorizacao(
    db: AsyncSession,
    solicitacao_compra_id: int,
    user: Usuario,
) -> tuple[SolicitacaoCompra, Processo]:
    sc = await db.get(SolicitacaoCompra, solicitacao_compra_id)
    if not sc or sc.status_fluxo != "EM_ORCAMENTO":
        raise HTTPException(400, "Solicitacao nao esta em orcamento")

    if not sc.fornecedor:
        raise HTTPException(400, "Fornecedor obrigatorio antes de enviar para autorizacao")

    hoje = date.today().isoformat()
    numero = await gerar_numero_processo(db)

    sc.status_fluxo = "AGUARDANDO_AUTORIZACAO"

    processo = Processo(
        numero=numero,
        obra=sc.obra_nome,
        item=sc.item,
        qtd=float(sc.quantidade),
        valor=float(sc.valor),
        forma_pagamento=sc.pagamento,
        status="AGUARDANDO_AUTORIZACAO",
        solicitacao_compra_id=sc.id,
        timeline=[{
            "data": hoje,
            "status": "AGUARDANDO_AUTORIZACAO",
            "responsavel": user.login,
        }],
    )
    db.add(processo)

    await db.commit()
    await db.refresh(sc)
    await db.refresh(processo)
    return sc, processo
```

### 5.5 Seed Database

```python
# app/seed.py

from app.dependencies import hash_password

async def seed_database(db: AsyncSession) -> None:
    """Popula banco com dados iniciais se estiver vazio."""
    result = await db.execute(select(func.count()).select_from(Usuario))
    count = result.scalar()
    if count > 0:
        return  # Banco ja populado

    # Usuarios
    usuarios = [
        Usuario(login="admin", senha_hash=hash_password("admin123"), tipo="Master", cargo="Master", ativo=1),
        Usuario(login="Walason", senha_hash=hash_password("123456"), tipo="Master", cargo="Master", ativo=1),
        Usuario(login="Carlos", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Mestre", ativo=1),
        Usuario(login="Ana", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Financeiro", ativo=1),
        Usuario(login="Pedro", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Compras", ativo=1),
        Usuario(login="Joao", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Ferreiro", ativo=1),
        Usuario(login="Maria", senha_hash=hash_password("123456"), tipo="Usuario", cargo="Betoneira", ativo=1),
    ]
    db.add_all(usuarios)

    # Obras
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

    # Config
    db.add(Config(chave="numeroProcesso", valor="0"))

    await db.commit()
```

O seed e executado no `lifespan` do FastAPI:

```python
# app/main.py
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with async_session() as db:
        await seed_database(db)
    yield
    # Shutdown (nada necessario)
```

---

## 6. Deploy no Railway

### 6.1 railway.toml

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
healthcheckPath = "/health"
healthcheckTimeout = 10
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 5
```

### 6.2 Nixpacks (sem Dockerfile)

Railway detecta Python via `requirements.txt` ou `pyproject.toml`. Nao e necessario Dockerfile.

Se usar `pyproject.toml`:

```toml
[project]
name = "cbh-backend"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.30",
    "alembic>=1.14",
    "pydantic>=2.10",
    "pydantic-settings>=2.7",
    "python-jose[cryptography]>=3.3",
    "passlib[bcrypt]>=1.7",
    "python-multipart>=0.0.9",
]
```

### 6.3 Variaveis de Ambiente no Railway

| Variavel | Exemplo | Descricao |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Preenchida automaticamente pelo plugin PostgreSQL do Railway. Pode precisar trocar `postgresql://` por `postgresql+asyncpg://` |
| `SECRET_KEY` | `uma-chave-aleatoria-de-64-chars` | Chave para assinar JWTs. Gerar com `openssl rand -hex 32` |
| `ALGORITHM` | `HS256` | Algoritmo JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Duracao do access token |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Duracao do refresh token |
| `CORS_ORIGINS` | `https://cbh-obras.vercel.app,http://localhost:5173` | Dominios permitidos (separados por virgula) |
| `PORT` | `8000` | Railway define automaticamente |

### 6.4 PostgreSQL no Railway

1. No dashboard Railway, clique em **"+ New"** -> **"Database"** -> **"Add PostgreSQL"**.
2. Railway gera `DATABASE_URL` automaticamente como variavel do servico.
3. No `config.py`, tratar a URL:

```python
class Settings(BaseSettings):
    database_url: str

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        # Railway gera com "postgresql://", precisa de "postgresql+asyncpg://"
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url
```

### 6.5 CORS

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CBH Plataforma de Obras API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.6 Health Check

```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## 7. Adaptacao do Frontend

### 7.1 Camada de API (`src/lib/api.ts`)

```typescript
// src/lib/api.ts

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// --- Token management ---

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("cbh_refresh_token");
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem("cbh_refresh_token", token);
  } else {
    localStorage.removeItem("cbh_refresh_token");
  }
}

// --- Fetch wrapper with auto-refresh ---

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Auto-refresh on 401
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed, redirect to login
      clearAuth();
      window.location.href = "/login";
      throw new Error("Sessao expirada");
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.access_token);
    return true;
  } catch {
    return false;
  }
}

export function clearAuth() {
  setAccessToken(null);
  setRefreshToken(null);
  localStorage.removeItem("cbh_current_user");
}

// --- Auth API ---

export async function login(loginStr: string, senha: string) {
  const data = await apiFetch<{
    access_token: string;
    refresh_token: string;
    user: any;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: loginStr, senha }),
  });
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);
  // Manter compatibilidade com getCurrentUser() do storage.ts
  localStorage.setItem("cbh_current_user", JSON.stringify(data.user));
  return data;
}

// --- Generic CRUD factories ---

export function createCrudApi<T extends { id: number }>(basePath: string) {
  return {
    getAll: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<T[]>(`${basePath}${query}`);
    },
    getById: (id: number) => apiFetch<T>(`${basePath}/${id}`),
    create: (data: Omit<T, "id">) =>
      apiFetch<T>(basePath, { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<T>) =>
      apiFetch<T>(`${basePath}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) =>
      apiFetch<{ ok: boolean }>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}

// --- Domain APIs ---

export const obrasApi = createCrudApi<Obra>("/obras");
export const usuariosApi = createCrudApi<Usuario>("/usuarios");
export const solicitacoesApi = createCrudApi<Solicitacao>("/solicitacoes");
export const bancosApi = createCrudApi<Banco>("/bancos");
export const insumosApi = createCrudApi<Insumo>("/insumos");
export const fornecedoresApi = createCrudApi<Fornecedor>("/fornecedores");
export const ferramentasApi = createCrudApi<Ferramenta>("/ferramentas");
export const funcionariosApi = createCrudApi<FuncionarioRH>("/funcionarios-rh");
// ... etc
```

### 7.2 Estrategia de Migracao Gradual

Usar feature flag para alternar entre localStorage e API:

```typescript
// src/lib/storage.ts (modificado)

const USE_API = import.meta.env.VITE_USE_API === "true";

export async function getAllObras(): Promise<Obra[]> {
  if (USE_API) {
    return obrasApi.getAll();
  }
  return getAll<Obra>(STORAGE_KEYS.OBRAS);
}
```

**Passos da migracao**:

1. **VITE_USE_API=false** (padrao): Frontend funciona 100% com localStorage como hoje.
2. Implementar `api.ts` e wrappers async para cada modulo.
3. Converter cada pagina para usar os wrappers async (refactoring page-by-page).
4. **VITE_USE_API=true**: Ativa API para todos os modulos migrados.
5. Remover localStorage fallback quando todos os modulos estiverem migrados.

**Importante**: Os componentes precisarao lidar com `async` -- provavelmente via TanStack Query ou `useEffect` + estado de loading. A migracao ideal e:

```
localStorage sincrono -> hook useQuery (TanStack Query) com api.ts -> remover localStorage
```

### 7.3 Tratamento de JWT no Frontend

- `access_token`: mantido em variavel em memoria (nao localStorage) para seguranca.
- `refresh_token`: em `localStorage` (aceitar trade-off para simplificar).
- Interceptor de 401 no `apiFetch` faz refresh automatico.
- `cbh_current_user` em localStorage para compatibilidade com `getCurrentUser()` e `AppLayout`.
- Ao trocar de aba/recarregar pagina: `access_token` e perdido (variavel). O frontend deve chamar `/auth/refresh` no mount do App para reauthenticar.

```typescript
// src/App.tsx ou AppLayout.tsx (no mount)
useEffect(() => {
  const rt = getRefreshToken();
  if (rt && !accessToken) {
    refreshAccessToken().then(ok => {
      if (!ok) clearAuth();
    });
  }
}, []);
```

### 7.4 Variavel de Ambiente do Frontend

```env
# .env.development
VITE_API_URL=http://localhost:8000/api
VITE_USE_API=false

# .env.production
VITE_API_URL=https://cbh-backend-production.up.railway.app/api
VITE_USE_API=true
```

---

## 8. Ordem de Implementacao (MVP First)

### Fase 1: Auth + Usuarios + Estrutura Base (1-2 semanas)

**O que implementar**:
- Estrutura de pastas completa
- `config.py`, `database.py`, `dependencies.py`
- Model + Schema + Router de `Usuario`
- Endpoints: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- CRUD de Usuarios com RBAC
- Seed database com usuarios demo
- Alembic: migration inicial com tabela `usuarios` + `config`
- Health check endpoint
- Deploy inicial no Railway (validar que sobe e conecta ao PostgreSQL)

**Testes minimos**:
- Login com credenciais validas retorna tokens
- Login com credenciais invalidas retorna 401
- Acesso a rota protegida sem token retorna 401
- Acesso a rota restrita com cargo errado retorna 403
- CRUD de usuarios funciona
- Refresh token renova access token

**Criterio de done**:
- API rodando no Railway
- Login funcional via curl/Postman
- Swagger UI (`/docs`) acessivel e documentado

---

### Fase 2: Obras + Fabrica (1-2 semanas)

**O que implementar**:
- Models + Schemas + Routers: `Obra`, `Solicitacao`
- CRUD de Obras com calculo de progresso
- Criacao de Solicitacoes de Fabricacao
- Lancamento de producao (`/fabrica/producao/{id}/lancar`)
- Historico de producao (leitura)
- Estoque de pecas fabricadas (leitura)
- Alembic: migration para `obras`, `solicitacoes`

**Testes minimos**:
- Criar obra e verificar que aparece na listagem
- Criar solicitacao com `statusAutorizacao: "Aguardando"`
- Lancar producao e verificar que fabricado/saldo/status atualizam corretamente
- Lancar producao alem da meta e verificar clamp
- Progresso da obra calculado corretamente

**Criterio de done**:
- Fluxo completo: criar obra -> criar solicitacao -> lancar producao funcional via API
- Frontend conectado (pelo menos a tela de Obras usando API)

---

### Fase 3: Autorizacao + Carregamento + Montagem (1-2 semanas)

**O que implementar**:
- Models + Schemas + Routers: `Carregamento`, `Montagem`
- Service de autorizacao: aprovar/negar fabricacao, aprovar/negar logistica
- Planejamento de carregamento com calculo de reserva de estoque
- Execucao de carregamento (`/carregamentos/{id}/executar`)
- Registro de montagem (cria N registros, atualiza carregamento para "Entregue")
- Endpoint de pendencias para dashboard de autorizacao

**Testes minimos**:
- Aprovar solicitacao de fabricacao muda `statusAutorizacao` para "Autorizado"
- Carregamento criado com paineis reserva estoque corretamente
- Executar carregamento muda status para "Carregado"
- Registrar montagem cria N montagens e muda carregamento para "Entregue"
- Paineis reservados nao aparecem como disponiveis

**Criterio de done**:
- Fluxo completo: solicitacao -> autorizacao -> producao -> carregamento -> montagem funcional

---

### Fase 4: Compras + Financeiro (1-2 semanas)

**O que implementar**:
- Models + Schemas + Routers: `SolicitacaoCompra`, `Processo`, `LancamentoFinanceiro`, `Banco`, `Insumo`, `Fornecedor`, `MovimentacaoEstoque`
- Fluxo completo de compras: SOLICITADO -> EM_ORCAMENTO -> AGUARDANDO_AUTORIZACAO -> AUTORIZADO -> NO_FINANCEIRO -> PAGO
- Autorizacao de compras (cria lancamento financeiro automaticamente)
- Numeracao de processos CP-XXXXX
- CRUD de bancos, insumos, fornecedores
- Movimentacao de estoque (entrada/saida)
- Pagamento de lancamentos
- Dashboard financeiro

**Testes minimos**:
- Fluxo completo de compra: criar -> cotar -> enviar autorizacao -> aprovar -> pagar
- Aprovar compra cria lancamento financeiro automaticamente
- Numero do processo incrementa corretamente (CP-00001, CP-00002, ...)
- Movimentacao de estoque atualiza `estoqueAtual` do insumo
- Saida nao deixa estoque negativo

**Criterio de done**:
- Fluxo de compras end-to-end funcional
- Tela de autorizacao de compras conectada ao backend

---

### Fase 5: RH + Ferramentas + Polimento (1 semana)

**O que implementar**:
- Models + Schemas + Routers: `FuncionarioRH`, `Ferramenta`
- CRUD de funcionarios com busca
- Emprestimo/devolucao de ferramentas com historico
- Dashboard geral (`/api/dashboard`)
- Paginacao server-side para listagens grandes
- Tratamento de erros padronizado
- Logs estruturados

**Testes minimos**:
- CRUD de funcionarios funciona
- Emprestar/devolver ferramenta atualiza status e historico
- Dashboard retorna KPIs corretos

**Criterio de done**:
- Todos os modulos implementados e conectados ao frontend
- Feature flag `VITE_USE_API=true` ativada em producao
- Zero uso de localStorage para dados (apenas tokens)

---

## 9. Exemplos de Codigo

### 9.1 Model SQLAlchemy Completo - Usuario

```python
# app/models/usuario.py
from datetime import datetime
from sqlalchemy import String, SmallInteger, Text, func
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

    def __repr__(self) -> str:
        return f"<Usuario id={self.id} login={self.login} cargo={self.cargo}>"
```

### 9.2 Model SQLAlchemy Completo - Solicitacao

```python
# app/models/solicitacao.py
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Solicitacao(Base):
    __tablename__ = "solicitacoes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    obra_id: Mapped[int] = mapped_column(ForeignKey("obras.id"), nullable=False, index=True)
    obra_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cliente_nome: Mapped[str] = mapped_column(String(200), default="")

    # Paineis
    paineis: Mapped[int] = mapped_column(Integer, default=0)
    painel_comp: Mapped[float] = mapped_column(Numeric(5, 2), default=5)
    painel_alt: Mapped[float] = mapped_column(Numeric(5, 2), default=3)
    tipo_painel: Mapped[str] = mapped_column(String(50), default="Liso")
    ra_painel: Mapped[str] = mapped_column(String(50), default="")
    status_painel: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_painel: Mapped[int] = mapped_column(Integer, default=0)
    saldo_painel: Mapped[int] = mapped_column(Integer, default=0)
    historico_painel: Mapped[list] = mapped_column(JSONB, default=list)

    # Pilares
    pilares: Mapped[int] = mapped_column(Integer, default=0)
    pilar_alt: Mapped[float] = mapped_column(Numeric(5, 2), default=3)
    bainha_pilar: Mapped[int] = mapped_column(Integer, default=0)
    status_pilar: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_pilar: Mapped[int] = mapped_column(Integer, default=0)
    saldo_pilar: Mapped[int] = mapped_column(Integer, default=0)
    historico_pilar: Mapped[list] = mapped_column(JSONB, default=list)

    # Sapatas
    sapatas: Mapped[int] = mapped_column(Integer, default=0)
    tamanho_sapata: Mapped[str] = mapped_column(String(50), default="Grande")
    tipo_sapata: Mapped[str] = mapped_column(String(50), default="Normal")
    status_sapata: Mapped[str] = mapped_column(String(20), default="Pendente")
    fabricado_sapata: Mapped[int] = mapped_column(Integer, default=0)
    saldo_sapata: Mapped[int] = mapped_column(Integer, default=0)
    historico_sapata: Mapped[list] = mapped_column(JSONB, default=list)

    # Gerais
    data: Mapped[str] = mapped_column(String(10), default="")
    observacoes: Mapped[str] = mapped_column(Text, default="")
    solicitante: Mapped[str] = mapped_column(String(100), default="")
    cargo_solicitante: Mapped[str] = mapped_column(String(50), default="")
    data_solicitacao_registro: Mapped[str] = mapped_column(String(10), default="")
    status_autorizacao: Mapped[str] = mapped_column(String(20), default="Aguardando", index=True)
    autorizado_por: Mapped[str] = mapped_column(String(100), default="")
    data_autorizacao: Mapped[str] = mapped_column(String(10), default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationships
    obra: Mapped["Obra"] = relationship(back_populates="solicitacoes")
```

### 9.3 Endpoint de Login com JWT

```python
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, TokenResponse
from app.dependencies import verify_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Buscar usuario pelo login
    result = await db.execute(
        select(Usuario).where(Usuario.login == body.login)
    )
    user = result.scalar_one_or_none()

    # Validar credenciais (usuario inexistente ou inativo = mesma mensagem)
    if not user or user.ativo != 1 or not verify_password(body.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario ou senha invalidos",
        )

    # Gerar tokens
    token_data = {"sub": user.id, "cargo": user.cargo}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user={
            "id": user.id,
            "login": user.login,
            "tipo": user.tipo,
            "cargo": user.cargo,
            "ativo": user.ativo,
            "foto": user.foto,
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    from jose import jwt, JWTError
    from app.config import settings

    try:
        payload = jwt.decode(
            body.refresh_token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Token tipo invalido")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Refresh token invalido ou expirado")

    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id, Usuario.ativo == 1)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Usuario nao encontrado ou inativo")

    new_access = create_access_token({"sub": user.id, "cargo": user.cargo})
    return TokenResponse(access_token=new_access, token_type="bearer")


@router.get("/me")
async def me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "login": current_user.login,
        "tipo": current_user.tipo,
        "cargo": current_user.cargo,
        "ativo": current_user.ativo,
        "foto": current_user.foto,
    }
```

**Schemas de Auth**:

```python
# app/schemas/auth.py
from pydantic import BaseModel


class LoginRequest(BaseModel):
    login: str
    senha: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
```

### 9.4 Dependency de RBAC

```python
# app/dependencies.py (secao RBAC)
from typing import Sequence
from fastapi import Depends, HTTPException, status
from app.models.usuario import Usuario


def require_cargo(cargos_permitidos: Sequence[str]):
    """
    Factory que retorna uma dependency do FastAPI.
    Master sempre passa. Outros cargos devem estar na lista.

    Exemplo de uso como dependency de rota:
        @router.get("/", dependencies=[Depends(require_cargo(["Mestre", "Encarregado"]))])

    Exemplo de uso para injetar usuario validado:
        async def endpoint(user: Usuario = Depends(require_cargo(["Financeiro"]))):
    """
    async def _check_cargo(
        current_user: Usuario = Depends(get_current_user),
    ) -> Usuario:
        # Master tem acesso irrestrito (wildcard)
        if current_user.cargo == "Master":
            return current_user

        if current_user.cargo not in cargos_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado para cargo '{current_user.cargo}'",
            )
        return current_user

    return _check_cargo
```

**Uso pratico em um router**:

```python
# app/routers/obras.py
from fastapi import APIRouter, Depends
from app.dependencies import require_cargo

router = APIRouter(prefix="/api/obras", tags=["obras"])

CARGOS_OBRA = ["Mestre", "Encarregado"]


@router.get("/")
async def listar_obras(
    user: Usuario = Depends(require_cargo(CARGOS_OBRA)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Obra).order_by(Obra.id))
    return result.scalars().all()


@router.delete("/{obra_id}")
async def deletar_obra(
    obra_id: int,
    user: Usuario = Depends(require_cargo(["Master"])),  # Apenas Master pode deletar
    db: AsyncSession = Depends(get_db),
):
    obra = await db.get(Obra, obra_id)
    if not obra:
        raise HTTPException(404, "Obra nao encontrada")
    await db.delete(obra)
    await db.commit()
    return {"ok": True}
```

### 9.5 Endpoint com Regra de Negocio Complexa: Aprovar Compra

```python
# app/routers/autorizacao.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.database import get_db
from app.dependencies import require_cargo, get_current_user
from app.models.usuario import Usuario
from app.models.solicitacao_compra import SolicitacaoCompra
from app.models.processo import Processo
from app.models.lancamento import LancamentoFinanceiro

router = APIRouter(prefix="/api/autorizacao", tags=["autorizacao"])


@router.post("/compras/{solicitacao_id}/aprovar")
async def aprovar_compra(
    solicitacao_id: int,
    user: Usuario = Depends(require_cargo(["Master"])),
    db: AsyncSession = Depends(get_db),
):
    hoje = date.today().isoformat()

    # 1. Buscar e validar a solicitacao de compra
    sc = await db.get(SolicitacaoCompra, solicitacao_id)
    if not sc:
        raise HTTPException(404, "Solicitacao de compra nao encontrada")
    if sc.status_fluxo != "AGUARDANDO_AUTORIZACAO":
        raise HTTPException(
            400,
            f"Solicitacao nao esta aguardando autorizacao (status atual: {sc.status_fluxo})",
        )

    # 2. Atualizar status da solicitacao
    sc.status_fluxo = "AUTORIZADO"
    sc.status = "AUTORIZADO"

    # 3. Buscar processo correspondente e atualizar timeline
    result = await db.execute(
        select(Processo).where(
            Processo.item == sc.item,
            Processo.obra == sc.obra_nome,
        )
    )
    processo = result.scalar_one_or_none()

    if processo:
        processo.status = "NO_FINANCEIRO"
        timeline = list(processo.timeline or [])
        timeline.append({
            "data": hoje,
            "status": "AUTORIZADO",
            "responsavel": user.login,
        })
        timeline.append({
            "data": hoje,
            "status": "NO_FINANCEIRO",
            "responsavel": "Sistema",
        })
        # Reatribuir para forcar deteccao de mudanca no JSONB
        processo.timeline = timeline

    # 4. Criar lancamento financeiro automaticamente
    lancamento = LancamentoFinanceiro(
        tipo="Despesa",
        centro=sc.obra_nome,
        descricao=sc.item,
        fornecedor=sc.fornecedor,
        valor=float(sc.valor),
        forma_pagamento=sc.pagamento,
        status="Pendente",
        proc_id=processo.id if processo else 0,
        data=hoje,
        emissao=hoje,
        vencimento="",
    )
    db.add(lancamento)

    # 5. Commit atomico - tudo ou nada
    await db.commit()
    await db.refresh(sc)

    return {
        "solicitacao": sc,
        "processo": processo,
        "lancamento_id": lancamento.id,
        "mensagem": "Compra aprovada. Lancamento financeiro criado automaticamente.",
    }


@router.post("/compras/{solicitacao_id}/negar")
async def negar_compra(
    solicitacao_id: int,
    user: Usuario = Depends(require_cargo(["Master"])),
    db: AsyncSession = Depends(get_db),
):
    sc = await db.get(SolicitacaoCompra, solicitacao_id)
    if not sc:
        raise HTTPException(404, "Solicitacao de compra nao encontrada")
    if sc.status_fluxo != "AGUARDANDO_AUTORIZACAO":
        raise HTTPException(400, "Solicitacao nao esta aguardando autorizacao")

    sc.status_fluxo = "NEGADO"
    sc.status = "NEGADO"

    await db.commit()
    await db.refresh(sc)
    return sc


@router.get("/pendencias")
async def pendencias(
    user: Usuario = Depends(require_cargo(["Master"])),
    db: AsyncSession = Depends(get_db),
):
    """Contadores para o badge de pendencias no menu de autorizacao."""
    from app.models.solicitacao import Solicitacao
    from app.models.carregamento import Carregamento
    from sqlalchemy import func as sqlfunc

    # Compras pendentes
    r1 = await db.execute(
        select(sqlfunc.count()).select_from(SolicitacaoCompra).where(
            SolicitacaoCompra.status_fluxo == "AGUARDANDO_AUTORIZACAO"
        )
    )
    compras = r1.scalar()

    # Fabricacao pendente
    r2 = await db.execute(
        select(sqlfunc.count()).select_from(Solicitacao).where(
            Solicitacao.status_autorizacao == "Aguardando"
        )
    )
    fabricacao = r2.scalar()

    # Logistica pendente
    r3 = await db.execute(
        select(sqlfunc.count()).select_from(Carregamento).where(
            Carregamento.status_autorizacao == "Aguardando"
        )
    )
    logistica = r3.scalar()

    return {
        "compras": compras,
        "fabricacao": fabricacao,
        "logistica": logistica,
        "total": compras + fabricacao + logistica,
    }
```

### 9.6 Database Setup

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    pool_size=10,
    max_overflow=20,
)

async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 9.7 Main App

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import async_session
from app.seed import seed_database

from app.routers import (
    auth, usuarios, obras, solicitacoes,
    solicitacoes_compra, processos, lancamentos,
    bancos, insumos, fornecedores, carregamentos,
    montagens, movimentacoes_estoque, ferramentas,
    funcionarios_rh, autorizacao, dashboard,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session() as db:
        await seed_database(db)
    yield


app = FastAPI(
    title="CBH Plataforma de Obras API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(obras.router)
app.include_router(solicitacoes.router)
app.include_router(solicitacoes_compra.router)
app.include_router(processos.router)
app.include_router(lancamentos.router)
app.include_router(bancos.router)
app.include_router(insumos.router)
app.include_router(fornecedores.router)
app.include_router(carregamentos.router)
app.include_router(montagens.router)
app.include_router(movimentacoes_estoque.router)
app.include_router(ferramentas.router)
app.include_router(funcionarios_rh.router)
app.include_router(autorizacao.router)
app.include_router(dashboard.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## Apendice A: Mapa de Conversao camelCase (frontend) -> snake_case (backend)

O frontend usa camelCase nos campos. O backend usa snake_case. Os schemas Pydantic devem aceitar ambos e responder em camelCase para compatibilidade:

```python
# Base schema com conversao automatica
from pydantic import BaseModel, ConfigDict

class CamelModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

    # Converte snake_case para camelCase na resposta JSON
    @classmethod
    def model_config_alias_generator(cls):
        def to_camel(string: str) -> str:
            parts = string.split("_")
            return parts[0] + "".join(word.capitalize() for word in parts[1:])
        return to_camel
```

Alternativa mais simples usando `alias_generator` do Pydantic v2:

```python
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )
```

Todos os schemas devem herdar de `CamelModel` para manter compatibilidade com o frontend.

---

## Apendice B: Checklist Pre-Deploy

- [ ] `SECRET_KEY` e uma chave forte (nao a default)
- [ ] `CORS_ORIGINS` contém apenas dominios de producao
- [ ] `DATABASE_URL` aponta para PostgreSQL do Railway
- [ ] Alembic migration roda sem erro (`alembic upgrade head`)
- [ ] Seed popula dados iniciais na primeira execucao
- [ ] Health check responde em `/health`
- [ ] Swagger UI acessivel em `/docs`
- [ ] Login funcional com usuario demo
- [ ] Todas as rotas protegidas retornam 401 sem token
- [ ] Rotas restritas retornam 403 com cargo incorreto
