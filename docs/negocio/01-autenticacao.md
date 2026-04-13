# Autenticacao e Sessao

## Tela: Login (`/login`)

### Proposito
Porta de entrada do sistema. Valida credenciais e redireciona o usuario para a primeira rota permitida pelo seu cargo.

### Regras de Negocio

1. **Validacao de credenciais**: O login deve corresponder a `login === input.login AND senha === input.senha AND ativo === 1`. Usuarios inativos recebem a mesma mensagem de erro generico.
2. **Senhas em texto plano**: As senhas sao armazenadas e comparadas sem hash (limitacao conhecida).
3. **Redirecionamento pos-login**: Apos autenticacao, o usuario e enviado para `getPrimeiraRotaPermitida(cargo)`. Master vai para `/dashboard`. Cargos operacionais (Ferreiro, Betoneiro etc.) vao direto para `/fabrica/controle`.
4. **Sessao**: O objeto completo do usuario e salvo em `localStorage['cbh_current_user']`.
5. **Delay simulado**: 500ms de delay para simular latencia de API.

### Campos do Formulario

| Campo | Tipo | Obrigatorio |
|---|---|---|
| Login | text | Sim (HTML required) |
| Senha | password (com toggle de visibilidade) | Sim (HTML required) |
| Lembrar dispositivo | checkbox | Nao (decorativo, sem logica) |
| Esqueceu a senha? | link | Nao (decorativo, sem acao) |

### Estados da UI

- **Padrao**: Formulario habilitado.
- **Carregando**: Botao desabilitado, texto "Entrando...".
- **Erro**: Alerta vermelho "Usuario ou senha invalidos".

### Sessao e Logout

- `getCurrentUser()`: Le `cbh_current_user` do localStorage.
- `setCurrentUser(user)`: Salva o usuario na sessao.
- `clearCurrentUser()`: Remove a sessao (usado no logout do Topbar).
- `AppLayout` verifica `getCurrentUser()` a cada render e redireciona para `/login` se nulo.

---

## Tela: Usuarios (`/usuarios`)

### Proposito
CRUD completo de usuarios do sistema.

### Acesso
Master, Mestre, Encarregado, Financeiro, Compras, RH.

### Regras de Negocio

1. **Criacao**: Login e senha sao obrigatorios. O tipo (`Master` ou `Usuario`) e derivado automaticamente: cargo `Master` -> tipo `Master`, qualquer outro -> tipo `Usuario`.
2. **Edicao**: Login obrigatorio. Senha opcional (deixar vazio mantem a senha atual).
3. **Ativacao/Inativacao**: Toggle direto na tabela, alterna `ativo` entre 0 e 1.
4. **Exclusao**: Requer confirmacao via `confirm()` do browser.
5. **Cargo padrao** para novos usuarios: `Mestre`.
6. **Foto**: Inicializada como string vazia, sem upload implementado.

### Cargos Disponiveis
`Master, Mestre, Encarregado, Compras, Financeiro, RH, Meio-profissional, Ferreiro, Betoneiro, Servente`

### Status dos Usuarios
- `ativo: 1` -> Ativo (badge verde "Ativo")
- `ativo: 0` -> Inativo (badge cinza "Inativo")
- Tipo `Master` exibe badge "Autorizado"; outros exibem badge "Pendente" (representacao visual do tipo de acesso)

---

## Tela: Configuracoes (`/configuracoes`)

### Proposito
Configuracoes de perfil do usuario logado.

### Acesso
Apenas Master (nao aparece no menu de outros cargos).

### Regras de Negocio

1. **Unico campo salvo de fato**: apenas o campo `Nome Completo` (campo `login`) e persistido.
2. **Campos decorativos** (coletam input mas nao salvam): Email, Telefone, Senha Atual/Nova/Confirmar, Tema, Notificacoes.
3. **Departamento**: Read-only, exibe `user.cargo`.
4. **Feedback de save**: Exibe "Salvo!" por 3 segundos, depois volta para "Salvar Perfil".
5. **Botao "Descartar Alteracoes"**: Decorativo, sem handler.
6. **Alterar Foto**: Decorativo, sem handler.
