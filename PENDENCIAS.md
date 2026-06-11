# FiscalMaster — Pendências e Próximos Passos

> Última atualização: 11/06/2026

---

## 🔴 CRÍTICO (fazer hoje)

- [ ] **Renovar plano Hostinger** — vence **20/06/2026** (9 dias!)
  - URL: https://hpanel.hostinger.com
  - Plano: Business Web Hosting

- [ ] **Subir `index.html` corrigido** na Hostinger
  - File Manager → public_html → upload do index.html deste repositório
  - Bug corrigido: countdown-bar estava dentro do `<header>`

---

## 🟡 IMPORTANTE (esta semana)

- [ ] **Backend de Token uso único**
  - Stack sugerida: Supabase (banco) + Resend (e-mail) + webhook Kiwify
  - Fluxo: Kiwify paga → webhook → gera UUID → salva no banco → envia e-mail
  - Token: válido 30 dias, uso único (marcar como `used=true` após 1ª utilização
  - Endpoint de validação: `GET /api/token?t=UUID`

- [ ] **Configurar página de obrigado na Kiwify**
  - Cada produto → "Página de obrigado" → `https://fiscalmaster.com.br/obrigado.html`

- [ ] **Google Search Console**
  - Verificar propriedade fiscalmaster.com.br
  - Enviar sitemap: `https://fiscalmaster.com.br/sitemap.xml`

- [ ] **Bing Webmaster Tools**
  - Importar do GSC

---

## 🟢 MÉDIO PRAZO

- [ ] **Deploy do simulador** (`agente-fiscal.jsx`)
  - Opção A: Vercel — `npx create-next-app` → colocar em `pages/simulador.jsx`
  - Opção B: Converter para HTML standalone (mais simples)
  - URL final: `fiscalmaster.com.br/simulador?token=UUID`

- [ ] **Sentry** — monitoramento de erros JS em produção
  - npm: `@sentry/browser`

- [ ] **Plausible Analytics** — substitui GA4, LGPD compliant
  - Script: `<script defer data-domain="fiscalmaster.com.br" src="https://plausible.io/js/script.js"></script>`

- [ ] **Publicar os outros 49 artigos** do blog (apenas 1 publicado)

- [ ] **OG Image** — criar imagem 1200x630 para preview no WhatsApp/redes

- [ ] **Pixel Meta Ads** — para remarketing

---

## ✅ CONCLUÍDO

- [x] Landing page completa (index.html)
- [x] Blog com 50 artigos estruturados
- [x] Artigo completo publicado (blog-regimes-tributarios-2027.html)
- [x] Política de Privacidade (LGPD)
- [x] Termos de Uso
- [x] Página de obrigado (obrigado.html)
- [x] Sitemap.xml + robots.txt
- [x] llms.txt (contexto para IAs)
- [x] .htaccess (cache control + HTTPS + gzip)
- [x] GTM configurado (GTM-N9FX36RJ)
- [x] Schema.org (SoftwareApplication + FAQPage)
- [x] Links Kiwify configurados nos 3 planos
- [x] Validação de e-mail em tempo real no checkout
- [x] Blacklist de e-mails descartáveis
- [x] Modal de checkout com LGPD
- [x] Menu hamburger mobile
- [x] iOS zoom fix
- [x] Banner de cookies LGPD
- [x] Agente simulador React com IA (agente-fiscal.jsx)
- [x] Imagens dos produtos para Kiwify (3 planos)
- [x] Copy de vendas + descrição para afiliados
- [x] Performance: GTM deferido + fontes assíncronas

---

## 🏗️ Arquitetura do Backend (a implementar)

```
Kiwify (webhook order_approved)
        ↓
POST /api/webhook
  → valida assinatura Kiwify
  → extrai email + plano + quantidade de tokens
  → gera N tokens UUID no Supabase
  → envia e-mail via Resend com link(s) de acesso
        ↓
GET /simulador?token=UUID
  → valida token (existe? usado? dentro de 30 dias?)
  → marca token como used=true
  → exibe formulário do simulador
  → chama Claude API para gerar relatório
  → entrega PDF por e-mail
```

### Tabela Supabase sugerida

```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  plano TEXT NOT NULL,  -- 'basico' | 'socio' | 'investidor'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  order_id TEXT  -- ID da ordem Kiwify
);
```
