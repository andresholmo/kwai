# 🚀 Deploy Guide - Kwai Marketing Dashboard

## ✅ Status

- ✅ Código enviado para GitHub
- ✅ Repositório: https://github.com/andresholmo/kwai
- ✅ Conectado à Vercel

## 🔧 Próximos Passos

### 1. Configurar Variáveis de Ambiente na Vercel

Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables

Adicione as seguintes variáveis:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Kwai API:**
- `KWAI_CLIENT_ID`
- `KWAI_CLIENT_SECRET`
- `KWAI_REDIRECT_URI=https://kwai.grupoupmidia.com.br/api/auth/callback`
- `KWAI_API_BASE_URL=https://developers.kwai.com`
- `KWAI_AUTH_URL=https://business.kwai.com/oauth/authorize`
- `KWAI_TOKEN_URL=https://business.kwai.com/oauth/token`

**Next.js:**
- `NEXT_PUBLIC_APP_URL=https://kwai.grupoupmidia.com.br`

### 2. Configurar Domínio Customizado na Vercel

1. Vá em **Settings > Domains**
2. Adicione: `kwai.grupoupmidia.com.br`
3. Configure DNS:
   - Type: CNAME
   - Name: kwai
   - Value: cname.vercel-dns.com

### 3. Deploy Automático

A partir de agora, qualquer `git push` na branch `main` fará deploy automático!

```bash
git add .
git commit -m "sua mensagem"
git push
```

### 4. Branches e Ambientes

- `main` → Produção (kwai.grupoupmidia.com.br)
- `develop` → Preview (criar para testes)

## 📦 Comandos Úteis

```bash
# Ver status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: nova funcionalidade"

# Push
git push

# Ver logs
git log --oneline

# Criar nova branch
git checkout -b develop
```

## 🔗 Links Importantes

- GitHub: https://github.com/andresholmo/kwai
- Vercel Dashboard: https://vercel.com
- Kwai Business Center: https://business.kwai.com

