# 🔧 Atualização de Variáveis de Ambiente na Vercel

## ⚠️ Ação Necessária

A URL de callback do OAuth do Kwai foi alterada. Você precisa atualizar as variáveis de ambiente na Vercel.

## 📝 Passos para Atualizar

1. **Acesse o Dashboard da Vercel**
   - Vá para: https://vercel.com/dashboard
   - Selecione o projeto `kwai`

2. **Vá em Settings > Environment Variables**

3. **Atualize/Crie as seguintes variáveis:**

   **KWAI_REDIRECT_URI**
   - Valor: `https://kwai.grupoupmidia.com.br/api/auth/callback`
   - Ambiente: Production, Preview, Development

   **NEXT_PUBLIC_KWAI_REDIRECT_URI** (opcional, se usar no cliente)
   - Valor: `https://kwai.grupoupmidia.com.br/api/auth/callback`
   - Ambiente: Production, Preview, Development

4. **Salve as alterações**

5. **Faça um novo deploy**
   - Vá em Deployments
   - Clique nos três pontos do último deploy
   - Selecione "Redeploy"

## ✅ Verificação

Após o deploy, teste o OAuth:
1. Acesse o dashboard
2. Clique em "Conectar conta do Kwai"
3. Verifique se o redirecionamento funciona corretamente

## 📌 Nota Importante

A URL de callback configurada no Kwai Business Center é:
```
https://kwai.grupoupmidia.com.br/api/auth/callback
```

Esta URL **não pode ser alterada** no Kwai Business Center, por isso o código foi ajustado para usar essa rota.

