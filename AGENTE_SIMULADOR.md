# Agente Simulador Tributário — Documentação

> Arquivo: `simulador/agente-fiscal.jsx`
> Tecnologia: React + Anthropic Claude API (claude-sonnet-4-20250514)

---

## Visão Geral

Componente React completo que implementa o simulador tributário com IA.
Recebe dados da empresa, calcula os 4 regimes tributários e gera relatórios
usando a API da Anthropic.

---

## Fluxo de Uso

```
1. Formulário de entrada (4 abas)
   ├── Identificação: CNPJ (validado), nome, e-mail, CNAE, UF, operação
   └── Financeiro: faturamento, folha, despesas

2. Motor de cálculo (matemática pura, sem IA)
   ├── Simples Nacional Tradicional (Fator R + Anexos III/V)
   ├── Simples Híbrido IBS/CBS (LC 214/2025)
   ├── Lucro Presumido (Lei 9.430/96)
   └── Lucro Real (Decreto-Lei 1.598/77)

3. Resultados em 5 abas
   ├── Dashboard: comparativo visual + gráfico de barras + Fator R
   ├── Parecer IA: parecer técnico com 11 seções (chamada Claude API)
   ├── Análise B2B/B2C: impacto na cadeia de créditos IBS/CBS
   ├── Checklist Contador: documentos + perguntas + timeline
   └── Relatório PDF: lista do que será gerado + botão download
```

---

## Validações Implementadas

- **CNPJ:** algoritmo módulo 11 (dígitos verificadores)
- **E-mail:** regex RFC-5322 + blacklist 25 domínios descartáveis
- **Botão de processar:** só habilita com CNPJ válido + e-mail + nome

---

## Motor de Cálculo

### Fator R
```
Fator R = Folha 12 meses ÷ Faturamento 12 meses
≥ 28% → Anexo III (alíquotas menores)
< 28% → Anexo V (alíquotas maiores)
```

### Alíquotas por Anexo (simplificadas)
| Faixa de Faturamento | Anexo III | Anexo V | Anexo I (Comércio) |
|---|---|---|---|
| Até R$ 180k | 6,0% | 15,5% | 4,0% |
| Até R$ 360k | 11,2% | 18,0% | 7,3% |
| Até R$ 720k | 13,5% | 19,5% | 9,5% |
| Até R$ 1,8M | 16,0% | 20,5% | 10,7% |
| Acima | 21,0% | 23,0% | 14,3% |

---

## System Prompt da IA (resumo)

O agente usa Claude como parecerista tributário com instruções para:
- Gerar parecer técnico em 11 seções com base legal real
- Citar artigos: LC 123/2006, LC 214/2025, CGSN 186/2026, Lei 9.430/96
- **Nunca** mencionar "Claude" ou "Anthropic" nos documentos gerados
- Usar data atual para evitar erros de data
- Tom técnico-jurídico, linguagem contábil precisa

---

## Deploy

### Opção A — Vercel (recomendado)
```bash
npx create-next-app fiscalmaster-sim
cp agente-fiscal.jsx pages/simulador.jsx
vercel --prod
# Configurar domínio: simulador.fiscalmaster.com.br
```

### Opção B — HTML Standalone
Solicitar ao Claude: "Converta agente-fiscal.jsx para HTML puro standalone"

### Opção C — Hostinger Node.js
hPanel → Node.js → criar app → porta 3000

---

## Variáveis de Ambiente

```env
# Não necessário — a API key é injetada automaticamente pelo Claude.ai
# Em produção standalone, adicionar:
ANTHROPIC_API_KEY=sk-ant-...
```
