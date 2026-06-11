# FiscalMaster — Simulador Tributário 2027 com IA

> Plataforma SaaS que compara os 4 regimes tributários de 2027 usando Inteligência Artificial,
> baseada na Resolução CGSN nº 186/2026 e LC 214/2025.
> **Prazo crítico:** 30/09/2026

---

## 📦 Estrutura do Repositório

```
fiscalmaster/
├── docs/                          # Documentação do projeto
│   ├── README.md                  # Este arquivo
│   ├── FISCALMASTER_SKILL.md      # Contexto completo do projeto (usar no Claude)
│   ├── Branding_e_Conceito.md     # Identidade visual e tom de voz
│   ├── Copy_de_Vendas.md          # Copy da landing page
│   ├── Web_System_Designer.md     # Estrutura de layout
│   ├── Especificacao_de_Assets.md # Assets visuais
│   ├── Plano_de_Projeto.md        # Plano completo do projeto
│   ├── Resolucao_CGSN_186_2026.md # Base legal completa
│   ├── copy-kiwify-vendas.md      # Copy para Kiwify + Afiliados
│   └── PENDENCIAS.md              # Pendências e próximos passos
│
├── frontend/                      # Site estático (Hostinger)
│   ├── index.html                 # Landing page principal ← ARQUIVO PRINCIPAL
│   ├── blog.html                  # Blog — índice de 50 artigos
│   ├── blog-regimes-tributarios-2027.html  # Artigo publicado
│   ├── privacidade.html           # Política de Privacidade (LGPD)
│   ├── termos.html                # Termos de Uso
│   ├── obrigado.html              # Página pós-pagamento Kiwify
│   ├── sitemap.xml                # Sitemap para SEO
│   ├── robots.txt                 # Permite GPTBot, Claude-Web etc
│   ├── llms.txt                   # Contexto para IAs
│   └── .htaccess                  # Cache control + HTTPS + gzip
│
├── simulador/                     # Agente IA (deploy pendente)
│   └── agente-fiscal.jsx          # Componente React do simulador
│
└── assets/                        # Imagens
    ├── fm-kiwify-basico.png       # Imagem produto Kiwify R$39,90
    ├── fm-kiwify-socio.png        # Imagem produto Kiwify R$59,90
    ├── fm-kiwify-investidor.png   # Imagem produto Kiwify R$119,90
    └── fiscalmaster-planos.png    # Banner comparativo 3 planos
```

---

## 🛒 Produtos Kiwify (Produção)

| Plano | Preço | URL Checkout |
|---|---|---|
| Básico | R$ 39,90 | https://pay.kiwify.com.br/mRmnZZz |
| Sócio | R$ 59,90 | https://pay.kiwify.com.br/3BoER2l |
| Investidor | R$ 119,90 | https://pay.kiwify.com.br/JZbDn2O |

---

## 🎨 Design System

| Token | Valor |
|---|---|
| Background | `#0B1120` |
| Blue primário | `#0066FF` |
| Cyan accent | `#00D4FF` |
| Verde sucesso | `#34D399` |
| Font heading | Plus Jakarta Sans |
| Font body | Inter |

---

## 🔧 Stack Técnica

- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem framework)
- **Simulador:** React JSX + Anthropic Claude API (claude-sonnet-4-20250514)
- **Hospedagem:** Hostinger Business (fiscalmaster.com.br)
- **Pagamentos:** Kiwify
- **Analytics:** Google Tag Manager (GTM-N9FX36RJ)
- **SEO:** Schema.org, sitemap, llms.txt, robots.txt

---

## ⚠️ Pendências Críticas

1. **URGENTE** — Renovar plano Hostinger antes de **20/06/2026**
2. Backend de token uso único (Supabase + Resend + webhook Kiwify)
3. Deploy do simulador `agente-fiscal.jsx` (Vercel ou Hostinger Node.js)
4. Google Search Console — verificar + enviar sitemap

---

## 📞 Contato

- **Proprietário:** Valter Cerqueira — Recife/PE
- **E-mail:** contato@fiscalmaster.com.br
- **Domínio:** fiscalmaster.com.br (expira 2027-06-09)
