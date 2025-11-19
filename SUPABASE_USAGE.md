# 🔧 Guia de Uso do Supabase - Kwai Marketing Dashboard

Este guia mostra como usar o Supabase no projeto, incluindo queries, operações CRUD, e uso dos hooks personalizados.

## 📚 Índice

- [Configuração](#configuração)
- [Clientes Supabase](#clientes-supabase)
- [Hooks Personalizados](#hooks-personalizados)
- [Queries Comuns](#queries-comuns)
- [Operações CRUD](#operações-crud)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Autenticação](#autenticação)

---

## ⚙️ Configuração

### Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pwxpxuiimvviwxlvefuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

---

## 🔌 Clientes Supabase

### Cliente para Browser (Client Components)

Use `createClient()` de `@/lib/supabase/client` em componentes client-side:

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";

export default function MyComponent() {
  const supabase = createClient();
  
  // Usar supabase aqui
}
```

### Cliente para Server (Server Components)

Use `createClient()` de `@/lib/supabase/server` em componentes server-side:

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function MyServerComponent() {
  const supabase = createClient();
  
  // Usar supabase aqui
}
```

---

## 🎣 Hooks Personalizados

### `useSupabase()`

Retorna uma instância do cliente Supabase para uso em componentes client:

```typescript
"use client";

import { useSupabase } from "@/hooks/useSupabase";

export default function MyComponent() {
  const supabase = useSupabase();
  
  // Usar supabase aqui
}
```

### `useUser()`

Hook que retorna o usuário atual e estado de carregamento:

```typescript
"use client";

import { useUser } from "@/hooks/useSupabase";

export default function UserProfile() {
  const { user, loading } = useUser();
  
  if (loading) return <div>Carregando...</div>;
  if (!user) return <div>Não autenticado</div>;
  
  return <div>Olá, {user.email}!</div>;
}
```

---

## 📊 Queries Comuns

### Buscar Perfil do Usuário

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .single();
  
  if (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
  
  return <div>{profile.full_name}</div>;
}
```

### Buscar Contas do Kwai

```typescript
const { data: accounts, error } = await supabase
  .from("kwai_accounts")
  .select("*")
  .eq("status", "active")
  .order("created_at", { ascending: false });
```

### Buscar Campanhas com Join

```typescript
const { data: campaigns, error } = await supabase
  .from("campaigns")
  .select(`
    *,
    kwai_accounts (
      account_name,
      account_type
    )
  `)
  .eq("status", "active")
  .order("created_at", { ascending: false });
```

### Buscar Ad Sets de uma Campanha

```typescript
const { data: adSets, error } = await supabase
  .from("ad_sets")
  .select("*")
  .eq("campaign_id", campaignId)
  .order("created_at", { ascending: false });
```

### Buscar Estatísticas de Campanha

```typescript
const { data: stats, error } = await supabase
  .from("campaign_stats")
  .select("*")
  .eq("campaign_id", campaignId)
  .gte("date", startDate)
  .lte("date", endDate)
  .order("date", { ascending: false });
```

### Buscar Materiais por Tipo

```typescript
const { data: videos, error } = await supabase
  .from("materials")
  .select("*")
  .eq("material_type", "video")
  .eq("status", "active")
  .order("created_at", { ascending: false });
```

---

## ✏️ Operações CRUD

### CREATE (Inserir)

#### Criar Nova Campanha

```typescript
const { data, error } = await supabase
  .from("campaigns")
  .insert({
    user_id: userId,
    account_id: accountId,
    name: "Nova Campanha",
    objective: "APP",
    status: "draft",
    budget_type: "daily",
    budget: 1000.00,
  })
  .select()
  .single();

if (error) {
  console.error("Erro ao criar campanha:", error);
} else {
  console.log("Campanha criada:", data);
}
```

#### Criar Ad Set

```typescript
const { data, error } = await supabase
  .from("ad_sets")
  .insert({
    user_id: userId,
    campaign_id: campaignId,
    name: "Ad Set 1",
    status: "draft",
    countries: ["BR", "US"],
    age_groups: ["18-24", "25-34"],
    genders: ["male", "female"],
    budget_type: "daily",
    budget: 500.00,
  })
  .select()
  .single();
```

### READ (Ler)

#### Buscar com Filtros

```typescript
const { data, error } = await supabase
  .from("campaigns")
  .select("*")
  .eq("status", "active")
  .gte("budget", 100)
  .order("created_at", { ascending: false })
  .limit(10);
```

#### Buscar com Paginação

```typescript
const pageSize = 20;
const page = 1;

const { data, error } = await supabase
  .from("campaigns")
  .select("*")
  .range((page - 1) * pageSize, page * pageSize - 1)
  .order("created_at", { ascending: false });
```

### UPDATE (Atualizar)

#### Atualizar Campanha

```typescript
const { data, error } = await supabase
  .from("campaigns")
  .update({
    name: "Nome Atualizado",
    status: "active",
    budget: 2000.00,
  })
  .eq("id", campaignId)
  .select()
  .single();
```

#### Atualizar Status

```typescript
const { error } = await supabase
  .from("campaigns")
  .update({ status: "paused" })
  .eq("id", campaignId);
```

### DELETE (Deletar)

#### Deletar (Soft Delete)

```typescript
// Soft delete - apenas marca como deletado
const { error } = await supabase
  .from("campaigns")
  .update({ status: "deleted" })
  .eq("id", campaignId);
```

#### Deletar Permanentemente

```typescript
const { error } = await supabase
  .from("campaigns")
  .delete()
  .eq("id", campaignId);
```

---

## 🔒 Row Level Security (RLS)

O Supabase usa Row Level Security para garantir que usuários só acessem seus próprios dados.

### Como Funciona

As políticas RLS são aplicadas automaticamente. Por exemplo:

```typescript
// Este query só retorna campanhas do usuário autenticado
const { data } = await supabase
  .from("campaigns")
  .select("*");
```

A política RLS garante que apenas campanhas onde `user_id = auth.uid()` sejam retornadas.

### Verificar Usuário Autenticado

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  // Usuário não autenticado
  return;
}
```

---

## 🔐 Autenticação

### Login com Email/Senha

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});
```

### Logout

```typescript
const { error } = await supabase.auth.signOut();
```

### Registrar Novo Usuário

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password123",
  options: {
    data: {
      full_name: "João Silva",
    },
  },
});
```

**Nota:** O trigger `handle_new_user()` criará automaticamente um perfil na tabela `profiles`.

### Verificar Sessão

```typescript
const {
  data: { session },
} = await supabase.auth.getSession();

if (session) {
  console.log("Usuário autenticado:", session.user);
}
```

---

## 📝 Exemplos Práticos

### Exemplo: Listar Campanhas com Estatísticas

```typescript
"use client";

import { useSupabase } from "@/hooks/useSupabase";
import { useEffect, useState } from "react";

export default function CampaignsList() {
  const supabase = useSupabase();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          kwai_accounts (
            account_name
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro:", error);
      } else {
        setCampaigns(data);
      }
      setLoading(false);
    }

    fetchCampaigns();
  }, [supabase]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      {campaigns.map((campaign) => (
        <div key={campaign.id}>
          <h3>{campaign.name}</h3>
          <p>Conta: {campaign.kwai_accounts.account_name}</p>
          <p>Orçamento: R$ {campaign.budget}</p>
        </div>
      ))}
    </div>
  );
}
```

### Exemplo: Criar Campanha com Formulário

```typescript
"use client";

import { useSupabase } from "@/hooks/useSupabase";
import { useState } from "react";

export default function CreateCampaignForm() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        name: formData.get("name") as string,
        account_id: formData.get("account_id") as string,
        objective: formData.get("objective") as string,
        budget_type: formData.get("budget_type") as string,
        budget: parseFloat(formData.get("budget") as string),
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro:", error);
      alert("Erro ao criar campanha");
    } else {
      alert("Campanha criada com sucesso!");
      // Redirecionar ou atualizar lista
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Nome da campanha" required />
      <input name="account_id" type="hidden" value={accountId} />
      <select name="objective" required>
        <option value="APP">App</option>
        <option value="WEBSITE">Website</option>
      </select>
      <select name="budget_type" required>
        <option value="daily">Diário</option>
        <option value="lifetime">Total</option>
      </select>
      <input name="budget" type="number" step="0.01" required />
      <button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar Campanha"}
      </button>
    </form>
  );
}
```

---

## 🔄 Atualizar Tipos TypeScript

Se você modificar o schema do banco, regenere os tipos:

```bash
# Autenticar primeiro
npx supabase login

# Gerar tipos
npm run db:generate-types
```

---

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)

---

## ⚠️ Notas Importantes

1. **RLS está sempre ativo**: Todas as queries respeitam as políticas RLS automaticamente
2. **Middleware**: O middleware atualiza automaticamente a sessão do usuário
3. **Tipos**: Use os tipos gerados em `src/types/supabase.ts` para type-safety
4. **Erros**: Sempre verifique erros nas respostas do Supabase

