# Plano de Projeto: Simulador Tributário 2027

**Data:** 09 de junho de 2026
**Objetivo:** Desenvolver e lançar uma plataforma web de simulação tributária com inteligência artificial, vendida como produto digital (venda única) via Kiwify, para atender à demanda gerada pela Resolução CGSN nº 186/2026.

## 1. ANÁLISE DE MERCADO E OPORTUNIDADE

A Resolução CGSN nº 186/2026 estabelece que, entre 1º e 30 de setembro de 2026, empresas do Simples Nacional devem tomar uma decisão crítica sobre seu regime tributário para 2027. O mercado atual oferece simuladores, mas eles são direcionados a contadores, exigem conhecimento técnico avançado e não possuem preços transparentes.

A oportunidade reside em criar um simulador "self-service" para o empresário final, que traduz a complexidade matemática em um parecer estratégico claro gerado por Inteligência Artificial, vendido através de uma landing page de alta conversão.

## 2. ARQUITETURA TÉCNICA E FLUXO DO USUÁRIO

O sistema foi desenhado para maximizar a conversão e automatizar a entrega do serviço, reduzindo o custo operacional a quase zero após a venda. A arquitetura não utiliza a Kiwify como área de membros, mas sim como gateway de pagamento via Webhooks.

O fluxo inicia com o usuário acessando a Landing Page através de tráfego pago. Ao decidir pela compra, ele é redirecionado ao checkout da Kiwify. Após a aprovação do pagamento, a Kiwify dispara um Webhook para a nossa API (Backend). A API gera um Token de Acesso Único e o envia por e-mail ao cliente. O usuário então acessa a plataforma web, insere o Token e preenche o formulário de simulação. O sistema processa os dados, a IA gera o parecer e o usuário visualiza o resultado em tela, podendo baixar o relatório em PDF. O Token é invalidado após o uso.

O sistema é composto por três pilares:

- **Frontend:** Desenvolvido em Next.js e Tailwind CSS, hospedado na Vercel, focado em velocidade e UI intuitiva.

- **Backend:** Desenvolvido em Node.js com banco de dados PostgreSQL, responsável pela gestão de tokens, recebimento de webhooks e execução da lógica matemática.

- **Motor de IA:** Integração com a API da OpenAI (GPT-4o) para transformar os números em um parecer estratégico personalizado.

## 3. LÓGICA DE CÁLCULO E DADOS DE ENTRADA

Para evitar atrito no preenchimento, o formulário solicitará apenas dados essenciais: CNAE Principal, Estado (UF), Natureza da Operação (B2B ou B2C), Faturamento Anual Projetado, Folha de Pagamento Anual e Despesas Operacionais Anuais.

Com esses dados, o Backend calculará quatro cenários distintos:

- **Simples Nacional (Tradicional):** Cálculo do DAS baseado no Anexo correspondente e Fator R (se aplicável).

- **Simples Nacional (Híbrido IBS/CBS):** Cálculo do DAS reduzido somado à apuração de IBS/CBS "por fora", conforme a nova legislação.

- **Lucro Presumido:** Cálculo baseado nas margens de presunção, IRPJ, CSLL, PIS, COFINS, impostos estaduais/municipais e encargos trabalhistas.

- **Lucro Real:** Cálculo sobre o lucro líquido real projetado.

A Inteligência Artificial receberá esses quatro resultados e aplicará uma lógica de recomendação. Por exemplo, se a empresa for B2C e tiver um Fator R elevado, a IA recomendará o Simples Tradicional. Se for B2B com alto faturamento, alertará sobre a necessidade do Simples Híbrido ou Lucro Presumido para repasse de créditos.

## 4. ESTRATÉGIA DE MARKETING E FUNIL DE CONVERSÃO

A estratégia de aquisição será baseada em tráfego pago (Meta Ads e Google Ads) direcionado para uma Landing Page de alta conversão.

A promessa principal da Landing Page será: *"**Descubra exatamente qual regime tributário vai fazer sua empresa pagar menos impostos em 2027. Simulação com Inteligência Artificial baseada nas novas regras da Reforma Tributária. Prazo final: 30/09.**"*

A página agitará a dor da Resolução 186/2026, mostrando os riscos de inação (pagar até 40% a mais ou perder clientes corporativos). A oferta será ancorada no preço de uma consultoria tributária tradicional (R$ 1.500 a R$ 5.000), vendendo os pacotes de simulação por valores acessíveis (R$ 39,90 a R$ 149,90). O checkout na Kiwify incluirá Order Bumps e Upsells para maximizar o Ticket Médio (LTV).

## 5. ANÁLISE DE CUSTOS E VIABILIDADE

O projeto exige um investimento inicial e possui custos operacionais mensais. A viabilidade depende do volume de vendas gerado pelo tráfego pago.

### Custos de Desenvolvimento (Investimento Inicial)

O desenvolvimento engloba Frontend, Backend, Integração com IA, Integração Kiwify, Testes/QA e Infraestrutura.

- **Estimativa Conservadora (R$ 200/hora):** R$ 74.000

- **Estimativa Premium (R$ 300/hora):** R$ 111.000

### Custos Operacionais Mensais

Os custos recorrentes incluem hospedagem (Vercel/AWS), banco de dados, e-mail transacional, consumo da API da OpenAI e ferramentas de monitoramento. O tráfego pago é a variável de maior impacto.

- **Infraestrutura e APIs:** R$ 830 a R$ 6.150 (dependendo do volume)

- **Marketing (Tráfego Pago):** R$ 1.300 a R$ 12.000 (totalmente variável)

### Análise de Break-even

Considerando um custo operacional fixo de R$ 2.000/mês (sem marketing) e a venda do Pacote Básico (R$ 39,90), a margem bruta por venda (descontando taxa Kiwify e custo da IA) é de aproximadamente R$ 34,90.

- **Ponto de Equilíbrio:** 58 vendas por mês (menos de 2 vendas por dia).

- **Cenário Realista (100 vendas/mês):** Gera um lucro líquido aproximado de R$ 2.760/mês, cobrindo a operação.

## 6. CRONOGRAMA DE DESENVOLVIMENTO (TIMELINE)

Para atender ao prazo de setembro, o projeto deve ser executado em 6 semanas, conforme o cronograma abaixo:

| Período | Foco Principal | Entregáveis |
| --- | --- | --- |
| **Semana 1** | Fundação e Arquitetura | Ambientes configurados, Banco de Dados modelado, estrutura base do código. |
| **Semana 2** | Lógica e IA | Motor de cálculo tributário validado, integração com OpenAI e System Prompt finalizado. |
| **Semana 3** | Integração Kiwify | Produtos criados, Webhooks operantes, sistema de Tokens e e-mails transacionais. |
| **Semana 4** | Frontend e UX | Formulário interativo, Dashboard de resultados e Gerador de PDF concluídos. |
| **Semana 5** | Marketing e Landing Page | Landing Page no ar, pixels configurados, criativos de anúncios prontos. |
| **Semana 6** | QA e Lançamento | Testes finais, Soft Launch, ajustes e Lançamento Oficial. |

## CONCLUSÃO

O projeto é tecnicamente viável e possui um modelo de negócios escalável. A urgência criada pela Resolução 186/2026 gera uma demanda reprimida significativa. O principal desafio não é a tecnologia, mas sim a capacidade de gerar tráfego qualificado e converter visitantes antes do encerramento do prazo em 30 de setembro de 2026. A execução deve iniciar imediatamente para garantir o lançamento a tempo.