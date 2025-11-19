# 📊 Database Schema - Kwai Marketing Dashboard

## 📋 Visão Geral

Este documento descreve a estrutura completa do banco de dados do Kwai Marketing Dashboard, incluindo tabelas, relacionamentos, políticas de segurança (RLS) e exemplos de queries.

## 🗂️ Estrutura das Tabelas

### 1. **profiles** - Perfis de Usuários

Estende a tabela `auth.users` do Supabase com informações adicionais do perfil.

**Campos:**
- `id` (UUID, PK) - Referência a `auth.users(id)`
- `email` (TEXT, UNIQUE) - Email do usuário
- `full_name` (TEXT) - Nome completo
- `avatar_url` (TEXT) - URL do avatar
- `role` (TEXT) - Papel do usuário: 'admin', 'user', 'viewer'
- `created_at`, `updated_at` (TIMESTAMP)

**Políticas RLS:**
- Usuários podem visualizar e atualizar apenas seu próprio perfil

---

### 2. **kwai_tokens** - Tokens OAuth do Kwai

Armazena os tokens de acesso e refresh do OAuth do Kwai para cada usuário.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `access_token` (TEXT) - Token de acesso
- `refresh_token` (TEXT) - Token de refresh
- `token_type` (TEXT) - Tipo do token (default: 'bearer')
- `expires_in` (INTEGER) - Tempo de expiração em segundos
- `expires_at` (TIMESTAMP) - Data/hora de expiração
- `scope` (TEXT) - Escopos concedidos
- `created_at`, `updated_at` (TIMESTAMP)

**Políticas RLS:**
- Usuários podem gerenciar apenas seus próprios tokens

**Índices:**
- `idx_kwai_tokens_user_id` - Busca rápida por usuário
- `idx_kwai_tokens_expires_at` - Verificação de expiração

---

### 3. **kwai_accounts** - Contas do Kwai

Representa as contas de publicidade do Kwai vinculadas aos usuários.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `account_id` (BIGINT, UNIQUE) - ID da conta no Kwai
- `account_name` (TEXT) - Nome da conta
- `account_type` (TEXT) - Tipo: 'advertiser' ou 'agency'
- `timezone` (TEXT) - Fuso horário (default: 'UTC')
- `currency` (TEXT) - Moeda (default: 'USD')
- `status` (TEXT) - Status: 'active', 'paused', 'deleted'
- `last_synced_at` (TIMESTAMP) - Última sincronização
- `created_at`, `updated_at` (TIMESTAMP)

**Políticas RLS:**
- Usuários podem visualizar apenas suas próprias contas

**Índices:**
- `idx_kwai_accounts_user_id` - Busca por usuário
- `idx_kwai_accounts_account_id` - Busca por ID do Kwai

---

### 4. **campaigns** - Campanhas

Armazena as campanhas de publicidade criadas no Kwai.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `account_id` (UUID, FK → kwai_accounts)
- `kwai_campaign_id` (BIGINT, UNIQUE) - ID da campanha no Kwai
- `name` (TEXT) - Nome da campanha
- `objective` (TEXT) - Objetivo: 'APP', 'WEBSITE'
- `status` (TEXT) - Status: 'draft', 'active', 'paused', 'deleted', 'pending_review'
- `budget_type` (TEXT) - Tipo de orçamento: 'daily', 'lifetime'
- `budget` (DECIMAL) - Valor do orçamento
- `start_date`, `end_date` (TIMESTAMP) - Datas de início e fim
- `kwai_data` (JSONB) - Dados completos da API do Kwai
- `created_at`, `updated_at`, `synced_at` (TIMESTAMP)

**Políticas RLS:**
- Usuários podem gerenciar campanhas em suas próprias contas

**Índices:**
- `idx_campaigns_user_id` - Busca por usuário
- `idx_campaigns_account_id` - Busca por conta
- `idx_campaigns_status` - Filtro por status
- `idx_campaigns_kwai_id` - Busca por ID do Kwai

---

### 5. **ad_sets** - Grupos de Anúncios

Representa os conjuntos de anúncios (ad sets) dentro de uma campanha.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `campaign_id` (UUID, FK → campaigns)
- `kwai_ad_set_id` (BIGINT, UNIQUE) - ID do ad set no Kwai
- `name` (TEXT) - Nome do ad set
- `status` (TEXT) - Status: 'draft', 'active', 'paused', 'deleted', 'pending_review'

**Targeting:**
- `countries` (JSONB) - Array de códigos de país
- `age_groups` (JSONB) - Array de faixas etárias
- `genders` (JSONB) - Array de gêneros
- `languages` (JSONB) - Array de idiomas
- `device_prices` (JSONB) - Array de faixas de preço
- `operating_systems` (JSONB) - Array de sistemas operacionais
- `interests` (JSONB) - Array de interesses

**Budget & Bidding:**
- `budget_type` (TEXT) - 'daily' ou 'lifetime'
- `budget` (DECIMAL) - Valor do orçamento
- `bid_strategy` (TEXT) - 'TARGET_COST', 'LOWEST_COST', 'COST_CAP'
- `bid_amount` (DECIMAL) - Valor do lance
- `optimization_goal` (TEXT) - 'ACTIVATION', 'PURCHASE', etc

**Placement & Schedule:**
- `placement` (JSONB) - 'IN_FEED', 'REWARD'
- `start_time`, `end_time` (TIMESTAMP)

**Dados:**
- `kwai_data` (JSONB) - Dados completos da API
- `created_at`, `updated_at`, `synced_at` (TIMESTAMP)

**Políticas RLS:**
- Usuários podem gerenciar ad sets em suas próprias campanhas

**Índices:**
- `idx_ad_sets_user_id` - Busca por usuário
- `idx_ad_sets_campaign_id` - Busca por campanha
- `idx_ad_sets_status` - Filtro por status

---

### 6. **creatives** - Criativos

Armazena os criativos (anúncios) dentro de um ad set.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `ad_set_id` (UUID, FK → ad_sets)
- `kwai_creative_id` (BIGINT, UNIQUE) - ID do criativo no Kwai
- `name` (TEXT) - Nome do criativo
- `status` (TEXT) - Status: 'draft', 'active', 'paused', 'deleted', 'pending_review', 'rejected'

**Conteúdo:**
- `title` (TEXT) - Título do anúncio
- `description` (TEXT) - Descrição
- `call_to_action` (TEXT) - CTA: 'INSTALL_NOW', 'DOWNLOAD', etc

**Assets:**
- `video_id` (UUID) - Referência ao material de vídeo
- `thumbnail_url` (TEXT) - URL da miniatura

**Landing:**
- `landing_page_url` (TEXT) - URL da página de destino
- `app_id` (TEXT) - ID do app (se aplicável)

**Review:**
- `review_status` (TEXT) - Status da revisão
- `review_message` (TEXT) - Mensagem da revisão

**Dados:**
- `kwai_data` (JSONB) - Dados completos da API
- `created_at`, `updated_at`, `synced_at` (TIMESTAMP)

**Políticas RLS:**
- Usuários podem gerenciar criativos em seus próprios ad sets

**Índices:**
- `idx_creatives_user_id` - Busca por usuário
- `idx_creatives_ad_set_id` - Busca por ad set
- `idx_creatives_status` - Filtro por status

---

### 7. **materials** - Materiais (Vídeos, Imagens, Apps)

Armazena os materiais de mídia (vídeos, imagens, apps) disponíveis para uso em anúncios.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `account_id` (UUID, FK → kwai_accounts)
- `kwai_material_id` (BIGINT, UNIQUE) - ID do material no Kwai
- `material_type` (TEXT) - Tipo: 'video', 'image', 'app', 'avatar', 'playable'
- `name` (TEXT) - Nome do material
- `url` (TEXT) - URL do material
- `thumbnail_url` (TEXT) - URL da miniatura

**Vídeo/Imagem:**
- `duration` (INTEGER) - Duração em segundos
- `width`, `height` (INTEGER) - Dimensões
- `file_size` (BIGINT) - Tamanho em bytes
- `format` (TEXT) - Formato: 'mp4', 'jpg', etc

**App:**
- `app_name` (TEXT) - Nome do app
- `package_name` (TEXT) - Nome do pacote
- `platform` (TEXT) - 'android' ou 'ios'

**Status:**
- `status` (TEXT) - 'active', 'processing', 'failed', 'deleted'

**Dados:**
- `kwai_data` (JSONB) - Dados completos da API
- `created_at`, `updated_at` (TIMESTAMP)

**Políticas RLS:**
- Usuários podem gerenciar materiais em suas próprias contas

**Índices:**
- `idx_materials_user_id` - Busca por usuário
- `idx_materials_account_id` - Busca por conta
- `idx_materials_type` - Filtro por tipo

---

### 8. **campaign_stats** - Estatísticas de Campanhas

Cache de métricas de performance das campanhas.

**Campos:**
- `id` (UUID, PK)
- `campaign_id` (UUID, FK → campaigns)
- `date` (DATE) - Data das métricas
- `impressions` (BIGINT) - Número de impressões
- `clicks` (BIGINT) - Número de cliques
- `cost` (DECIMAL) - Custo total
- `conversions` (BIGINT) - Número de conversões
- `ctr` (DECIMAL) - Click-through rate
- `cpc` (DECIMAL) - Cost per click
- `cpa` (DECIMAL) - Cost per acquisition
- `country_code` (TEXT) - Código do país (opcional, para breakdown)
- `created_at`, `updated_at` (TIMESTAMP)

**Constraint:**
- `UNIQUE(campaign_id, date, country_code)` - Evita duplicatas

**Políticas RLS:**
- Usuários podem visualizar stats de suas próprias campanhas

**Índices:**
- `idx_campaign_stats_campaign_id` - Busca por campanha
- `idx_campaign_stats_date` - Busca por data

---

### 9. **api_logs** - Logs de API (Auditoria)

Registra todas as chamadas à API do Kwai para auditoria e debugging.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, nullable)
- `endpoint` (TEXT) - Endpoint chamado
- `method` (TEXT) - Método HTTP
- `status_code` (INTEGER) - Código de status HTTP
- `request_body` (JSONB) - Corpo da requisição
- `response_body` (JSONB) - Corpo da resposta
- `error_message` (TEXT) - Mensagem de erro (se houver)
- `duration_ms` (INTEGER) - Duração em milissegundos
- `created_at` (TIMESTAMP)

**Políticas RLS:**
- Apenas admins podem visualizar logs

**Índices:**
- `idx_api_logs_user_id` - Busca por usuário
- `idx_api_logs_created_at` - Busca por data
- `idx_api_logs_endpoint` - Busca por endpoint

---

## 🔗 Relacionamentos

```
auth.users
  ├── profiles (1:1)
  ├── kwai_tokens (1:N)
  ├── kwai_accounts (1:N)
  ├── campaigns (1:N)
  ├── ad_sets (1:N)
  ├── creatives (1:N)
  ├── materials (1:N)
  └── api_logs (1:N)

kwai_accounts
  ├── campaigns (1:N)
  └── materials (1:N)

campaigns
  ├── ad_sets (1:N)
  └── campaign_stats (1:N)

ad_sets
  └── creatives (1:N)
```

---

## 🔒 Políticas de Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) habilitado:

1. **profiles**: Usuários veem/atualizam apenas seu próprio perfil
2. **kwai_tokens**: Usuários gerenciam apenas seus próprios tokens
3. **kwai_accounts**: Usuários veem apenas suas próprias contas
4. **campaigns**: Usuários gerenciam campanhas em suas próprias contas
5. **ad_sets**: Usuários gerenciam ad sets em suas próprias campanhas
6. **creatives**: Usuários gerenciam criativos em seus próprios ad sets
7. **materials**: Usuários gerenciam materiais em suas próprias contas
8. **campaign_stats**: Usuários veem stats de suas próprias campanhas
9. **api_logs**: Apenas admins podem visualizar logs

---

## 📝 Queries Comuns

### Buscar todas as campanhas de um usuário

```sql
SELECT 
  c.*,
  a.account_name,
  a.account_type
FROM campaigns c
JOIN kwai_accounts a ON c.account_id = a.id
WHERE c.user_id = auth.uid()
ORDER BY c.created_at DESC;
```

### Buscar ad sets de uma campanha com targeting

```sql
SELECT 
  ad.*,
  c.name as campaign_name
FROM ad_sets ad
JOIN campaigns c ON ad.campaign_id = c.id
WHERE ad.campaign_id = $1
  AND ad.user_id = auth.uid();
```

### Buscar estatísticas de uma campanha

```sql
SELECT 
  date,
  impressions,
  clicks,
  cost,
  conversions,
  ctr,
  cpc,
  cpa
FROM campaign_stats
WHERE campaign_id = $1
  AND date >= $2
  AND date <= $3
ORDER BY date DESC;
```

### Buscar materiais por tipo

```sql
SELECT *
FROM materials
WHERE user_id = auth.uid()
  AND material_type = $1
  AND status = 'active'
ORDER BY created_at DESC;
```

### Verificar token expirado

```sql
SELECT *
FROM kwai_tokens
WHERE user_id = auth.uid()
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🔧 Funções e Triggers

### `update_updated_at_column()`

Função que atualiza automaticamente o campo `updated_at` quando um registro é atualizado.

**Aplicada em:**
- profiles
- kwai_tokens
- kwai_accounts
- campaigns
- ad_sets
- creatives
- materials

### `handle_new_user()`

Função que cria automaticamente um perfil quando um novo usuário é criado no `auth.users`.

**Trigger:** `on_auth_user_created`

---

## 🚀 Aplicando as Migrations

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/20250119170000_complete_schema.sql`
4. Cole e execute no SQL Editor

### Opção 2: Via Supabase CLI

```bash
# Linkar ao projeto (requer autenticação)
npx supabase link --project-ref pwxpxuiimvviwxlvefuk

# Aplicar migrations
npm run db:migrate
```

### Opção 3: Via psql

```bash
psql -h aws-0-sa-east-1.pooler.supabase.com \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20250119170000_complete_schema.sql
```

---

## 📊 Gerando Tipos TypeScript

Após aplicar as migrations, gere os tipos TypeScript:

```bash
npm run db:generate-types
```

Isso atualizará o arquivo `src/types/supabase.ts` com os tipos gerados automaticamente.

---

## ✅ Checklist de Verificação

Após aplicar as migrations, verifique:

- [ ] Todas as tabelas foram criadas
- [ ] RLS está habilitado em todas as tabelas
- [ ] Políticas RLS foram criadas corretamente
- [ ] Índices foram criados
- [ ] Triggers estão funcionando
- [ ] Função `handle_new_user()` está criada
- [ ] Tipos TypeScript foram gerados

---

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [TypeScript Types](https://supabase.com/docs/reference/javascript/typescript-support)

