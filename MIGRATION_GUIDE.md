# 🗄️ Guia de Aplicação de Migrations

## 📋 Pré-requisitos

- Projeto Supabase configurado
- Credenciais no `.env.local`
- Acesso ao Supabase Dashboard

## 🚀 Método 1: Via Supabase Dashboard (Recomendado)

Este é o método mais simples e não requer configuração adicional.

### Passos:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard/project/pwxpxuiimvviwxlvefuk
   - Faça login se necessário

2. **Abra o SQL Editor**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **New query**

3. **Aplique a Migration**
   - Abra o arquivo: `supabase/migrations/20250119170000_complete_schema.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verifique o Resultado**
   - Verifique se não há erros
   - Vá em **Table Editor** para confirmar que as tabelas foram criadas

---

## 🔧 Método 2: Via Supabase CLI

### Passo 1: Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -D supabase
```

### Passo 2: Autenticar no Supabase

```bash
npx supabase login
```

Siga as instruções na tela para autenticar.

### Passo 3: Linkar ao Projeto

```bash
npx supabase link --project-ref pwxpxuiimvviwxlvefuk
```

Você precisará fornecer:
- Database password (encontre no Supabase Dashboard > Settings > Database)

### Passo 4: Aplicar Migrations

```bash
npm run db:migrate
```

Ou diretamente:

```bash
npx supabase db push
```

---

## 🔧 Método 3: Via psql (PostgreSQL Client)

### Passo 1: Obter Connection String

No Supabase Dashboard:
- Vá em **Settings > Database**
- Copie a **Connection string** (URI format)
- Formato: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`

### Passo 2: Aplicar Migration

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  -f supabase/migrations/20250119170000_complete_schema.sql
```

**Exemplo:**
```bash
psql "postgresql://postgres.xxx:password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/20250119170000_complete_schema.sql
```

---

## ✅ Verificação Pós-Migration

Após aplicar as migrations, verifique:

### 1. Verificar Tabelas Criadas

No Supabase Dashboard > Table Editor, você deve ver:

- ✅ `profiles`
- ✅ `kwai_tokens`
- ✅ `kwai_accounts`
- ✅ `campaigns`
- ✅ `ad_sets`
- ✅ `creatives`
- ✅ `materials`
- ✅ `campaign_stats`
- ✅ `api_logs`

### 2. Verificar RLS (Row Level Security)

No Supabase Dashboard > Authentication > Policies:

- Verifique se todas as tabelas têm políticas RLS criadas
- Verifique se as políticas estão ativas

### 3. Verificar Funções e Triggers

No Supabase Dashboard > Database > Functions:

- ✅ `update_updated_at_column()` deve existir
- ✅ `handle_new_user()` deve existir

### 4. Testar Trigger de Perfil

1. Crie um novo usuário via Supabase Auth
2. Verifique se um perfil foi criado automaticamente na tabela `profiles`

---

## 📊 Gerar Tipos TypeScript

Após aplicar as migrations com sucesso, gere os tipos TypeScript:

### Via NPM Script (Recomendado)

```bash
npm run db:generate-types
```

Isso irá:
- Conectar ao projeto Supabase remoto
- Gerar tipos TypeScript baseados no schema atual
- Salvar em `src/types/supabase.ts`

### Via CLI Diretamente

```bash
npx supabase gen types typescript --project-id pwxpxuiimvviwxlvefuk > src/types/supabase.ts
```

### Para Desenvolvimento Local

Se estiver usando Supabase local:

```bash
npm run db:generate-types:local
```

---

## 🔄 Atualizar Migrations Existentes

Se você já aplicou a migration `001_initial_schema.sql` anteriormente:

### Opção 1: Manter Ambas

As migrations são aplicadas em ordem cronológica. A nova migration (`20250119170000_complete_schema.sql`) irá:
- Criar novas tabelas que não existem
- Ignorar tabelas que já existem (usando `CREATE TABLE IF NOT EXISTS` onde aplicável)

### Opção 2: Remover Migration Antiga

Se preferir ter apenas uma migration completa:

1. No Supabase Dashboard, execute:

```sql
-- Remover tabela antiga (se existir)
DROP TABLE IF EXISTS kwai_tokens CASCADE;

-- Remover função antiga (se existir)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

2. Aplique a nova migration completa

---

## 🐛 Troubleshooting

### Erro: "relation already exists"

Algumas tabelas já existem. Isso é normal se você já aplicou migrations anteriores. A migration usa `CREATE TABLE IF NOT EXISTS` onde possível.

### Erro: "permission denied"

Verifique se você tem permissões de administrador no projeto Supabase.

### Erro: "function already exists"

A função `update_updated_at_column()` já existe. Isso é normal. A migration usa `CREATE OR REPLACE FUNCTION`.

### Erro de Encoding no .env.local

Se encontrar erro de encoding ao usar Supabase CLI:

1. Verifique se o arquivo `.env.local` está em UTF-8
2. Ou use o Método 1 (Dashboard) que não requer o arquivo

---

## 📝 Próximos Passos

Após aplicar as migrations com sucesso:

1. ✅ Gerar tipos TypeScript: `npm run db:generate-types`
2. ✅ Atualizar código para usar os novos tipos
3. ✅ Testar criação de usuário e perfil automático
4. ✅ Implementar sincronização de contas do Kwai
5. ✅ Implementar CRUD de campanhas, ad sets e criativos

---

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard/project/pwxpxuiimvviwxlvefuk)
- [Documentação do Supabase](https://supabase.com/docs)
- [SQL Editor](https://supabase.com/dashboard/project/pwxpxuiimvviwxlvefuk/sql)

