# Configuração NocoDB para o Cardápio

Para o app usar o NocoDB como backend, você precisa de uma base com as tabelas importadas (categories, admin_users, menu_items, sales, sale_items, kitchen_orders, kitchen_order_items) e dos IDs abaixo.

## Onde encontrar os IDs no NocoDB

1. **URL do NocoDB**  
   Ex.: `https://cardapiohsp.db.hopelabs.com.br` (sem barra no final).  
   Use em `VITE_NOCODB_URL` e `NOCODB_URL`.

2. **Token de API**  
   No NocoDB: **Account** (canto inferior esquerdo) → **Token** → criar/copiar um token.  
   Use em `VITE_NOCODB_API_TOKEN` (frontend) e `NOCODB_API_TOKEN` (API routes no Vercel).

3. **Base ID**  
   Na barra de endereço ao abrir uma base, o ID começa com `p` (ex.: `p_abc123...`).  
   Ou: menu da base (seta ao lado do nome) → copiar ID.  
   Use em `VITE_NOCODB_BASE_ID` e `NOCODB_BASE_ID`.

4. **Table IDs**  
   Ao abrir uma tabela, na URL aparece o Table ID (começa com `m`, ex.: `m_xyz789...`).  
   Ou: menu da tabela (três pontos ao lado do nome) → copiar ID.  
   Anote um ID para cada tabela:
   - categories
   - admin_users
   - menu_items
   - sales
   - sale_items
   - kitchen_orders
   - kitchen_order_items  

   Coloque no `.env` como `VITE_NOCODB_TABLE_IDS` (JSON, ver exemplo abaixo).

## Exemplo de `.env` (e variáveis no Vercel)

```env
# Frontend (Vite)
VITE_NOCODB_URL=https://sua-instancia.nocodb.com
VITE_NOCODB_API_TOKEN=seu_token_aqui
VITE_NOCODB_BASE_ID=p_xxxxxxxxxx
VITE_NOCODB_TABLE_IDS={"categories":"m_xxx","admin_users":"m_yyy","menu_items":"m_zzz","sales":"m_aaa","sale_items":"m_bbb","kitchen_orders":"m_ccc","kitchen_order_items":"m_ddd"}

# Backend (só no Vercel / API routes)
NOCODB_URL=https://sua-instancia.nocodb.com
NOCODB_API_TOKEN=seu_token_aqui
NOCODB_BASE_ID=p_xxxxxxxxxx
NOCODB_TABLE_IDS={"admin_users":"m_yyy"}
```

No **Vercel**: Project → Settings → Environment Variables. Crie `NOCODB_URL`, `NOCODB_API_TOKEN`, `NOCODB_BASE_ID` e `NOCODB_TABLE_IDS` (com o mesmo JSON, pelo menos com `admin_users` para as rotas de auth).

## Schema esperado

As tabelas devem ter as colunas compatíveis com o backup/CSV que você importou (IDs em UUID, nomes de colunas em snake_case: id, name, created_at, etc.). Se alguma tabela tiver nome ou tipo diferente, será preciso ajustar o cliente em `src/lib/nocodb.ts` e os tipos em `src/types/database.ts`.

## Testar o fluxo

1. Configure o `.env` (copie de `.env.example`) e preencha os IDs no NocoDB.
2. Em desenvolvimento: `npm run dev`. Para testar as rotas de auth, use `vercel dev` (ou defina `VITE_API_URL` para a URL onde as API routes estão rodando).
3. Em produção (Vercel): defina as variáveis de ambiente no painel da Vercel (incluindo `NOCODB_*` para as API routes). O deploy publica o front e as funções em `/api/auth/*` na mesma origem.
4. Fluxo sugerido: login admin → perfil → categorias e itens do cardápio → nova venda → tela da cozinha (atualização a cada 5s).

---

## O que fazer agora (deploy no Vercel)

Com o deploy já feito no Vercel, falta só configurar as **variáveis de ambiente** para o app e as API routes falarem com o NocoDB.

### 1. Variáveis no Vercel

No painel: **seu projeto** → **Settings** → **Environment Variables**. Crie as variáveis abaixo (e marque **Production**, **Preview** e **Development** se quiser).

**Frontend (build do Vite)** — todas com prefixo `VITE_`:

| Nome | Valor |
|------|--------|
| `VITE_NOCODB_URL` | URL da sua instância NocoDB (ex.: `https://cardapiohsp.db.hopelabs.com.br`) |
| `VITE_NOCODB_API_TOKEN` | Token de API (Account → Token no NocoDB) |
| `VITE_NOCODB_BASE_ID` | `pxdj6gn4l48uvex` |
| `VITE_NOCODB_TABLE_IDS` | JSON abaixo (sem `kitchen_orders` por enquanto) |

**Valor de `VITE_NOCODB_TABLE_IDS`** (copie e cole; sem quebras de linha):

```json
{"admin_users":"mz5gkkq3v3ssdn5","categories":"mh12iwf3hnhje8s","kitchen_order_items":"mdvu7lxi5why36n","menu_items":"mxkth178wwr2w8k","sale_items":"m62xba45fq4mu0h","sales":"mjfudfl9dygt8pf"}
```

**Backend (API routes de auth)** — usadas pelas rotas `/api/auth/*`:

| Nome | Valor |
|------|--------|
| `NOCODB_URL` | Mesma URL do NocoDB acima |
| `NOCODB_API_TOKEN` | Mesmo token acima |
| `NOCODB_BASE_ID` | `pxdj6gn4l48uvex` |
| `NOCODB_TABLE_IDS` | `{"admin_users":"mz5gkkq3v3ssdn5"}` |

### 2. Novo deploy

Depois de salvar as variáveis, faça um **Redeploy** do projeto (Deployments → ⋮ no último deploy → Redeploy) para o build usar os valores novos.

### 3. Conferir

- Acesse a URL do app no Vercel.
- Faça login (email/senha de um admin que exista na tabela `admin_users` no NocoDB; o hash da senha precisa ser compatível com bcrypt — se vier do backup em Postgres `crypt()`, pode ser necessário redefinir a senha).
- Teste: categorias, itens do cardápio, nova venda. A tela da cozinha deve abrir vazia; quando quiser usar pedidos da cozinha, crie a tabela `kitchen_orders` no NocoDB, pegue o Table ID e adicione em `VITE_NOCODB_TABLE_IDS` e faça redeploy.
