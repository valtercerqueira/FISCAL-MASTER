# Web System Designer: Estrutura de Layout FiscalMaster

Este documento define a arquitetura de informação e a estrutura visual da landing page, baseada no template BizNext (Dark Theme, Glassmorphism, Neon Blue).

## 1. CONFIGURAÇÕES GERAIS (CSS ROOT)
- `--bg-primary`: `#0B1120` (Azul Marinho Muito Escuro)
- `--bg-secondary`: `#111827` (Azul Acinzentado)
- `--accent-blue`: `#0066FF` (Azul Principal)
- `--accent-neon`: `#00D4FF` (Azul Neon para glows/brilhos)
- `--text-primary`: `#FFFFFF` (Branco)
- `--text-secondary`: `#94A3B8` (Cinza Claro)
- `--glass-bg`: `rgba(255, 255, 255, 0.05)`
- `--glass-border`: `rgba(255, 255, 255, 0.1)`

## 2. ESTRUTURA DE SEÇÕES (DOM)

### 2.1 HEADER (Fixo no topo)
- **Container:** `flex justify-between items-center py-4 px-8 bg-opacity-90 backdrop-blur-md`
- **Logo:** Esquerda. Ícone geométrico azul + Texto "FiscalMaster" em branco.
- **Navegação:** Oculta (é uma landing page, não queremos distrações).
- **CTA Topo:** Botão pequeno azul `[ Simular Agora ]` ancorado para a seção de preços.

### 2.2 HERO SECTION (A Dobra Principal)
- **Background:** `--bg-primary` com um glow radial suave (`--accent-neon`) centralizado atrás do mockup.
- **Kicker:** Badge pequeno, fundo glassmorphism, texto azul: "Atenção: Prazo encerra em 30/09/2026".
- **Headline (H1):** Centralizado, fonte grande, bold. Palavras "Pagar Menos Impostos" em gradiente azul.
- **Subheadline:** Texto em `--text-secondary`, centralizado, max-width de 800px.
- **CTA Principal:** Botão grande, arredondado, fundo `--accent-blue` com box-shadow glow azul.
- **Mockup Central:** Imagem de um notebook flutuando (estilo Apple) mostrando o dashboard do FiscalMaster. Fundo do mockup iluminado.
- **Floating Cards (Estilo BizNext):** Três cards pequenos flutuando abaixo/frente ao notebook usando glassmorphism:
  - Card 1: Ícone de Gráfico + "Análise IA"
  - Card 2: Ícone de Calculadora + "4 Regimes"
  - Card 3: Ícone de Check + "100% Atualizado"

### 2.3 PROBLEM SECTION (A Dor)
- **Background:** Transição suave para `--bg-secondary`.
- **Layout:** Grid de 3 colunas para os "Riscos".
- **Cards de Risco:** 
  - Fundo `--glass-bg`, borda `--glass-border`, border-radius 16px, padding interno.
  - Ícone de alerta/fogo em vermelho suave ou laranja (para contrastar com o azul).
  - Título em branco, texto descritivo em cinza.
  - Efeito hover: Levanta ligeiramente (translate-y) e aumenta o brilho da borda.

### 2.4 HOW IT WORKS (A Solução)
- **Layout:** Zigue-zague (Texto na esquerda, Imagem na direita / Imagem na esquerda, Texto na direita).
- **Passo 1 (Dados):** Ilustração de um formulário limpo flutuando.
- **Passo 2 (Processamento):** Ilustração abstrata de IA (redes neurais ou processador com glow azul).
- **Passo 3 (Decisão):** Mockup de um PDF elegante com gráficos.

### 2.5 DELIVERABLES (O Entregável)
- **Layout:** Container centralizado.
- **Visual:** Uma imagem grande e detalhada do Dashboard que o cliente verá. Uma interface escura, com gráficos de barras coloridos (comparando os 4 regimes) e um bloco de texto com a "Recomendação da IA".
- **Lista de Benefícios:** Lista com checkmarks em azul brilhante ao lado do mockup.

### 2.6 PRICING SECTION (Checkout)
- **Background:** Volta para `--bg-primary` com glow radial forte atrás das tabelas de preço.
- **Layout:** Flex container com 3 cards de preço (Básico, Sócio, Investidor).
- **Design dos Cards:**
  - Card Básico: Glassmorphism padrão.
  - Card Sócio (Destaque): Escala ligeiramente maior (transform: scale 1.05), borda sólida `--accent-blue`, badge "Mais Popular" no topo.
  - Card Investidor: Glassmorphism padrão.
- **Botões de Compra:** Integram diretamente com o modal de checkout da Manus. Ao clicar, abre o modal de pagamento (Stripe) na própria página.

### 2.7 FAQ SECTION
- **Layout:** Accordion (lista expansível) centralizado. Max-width 800px.
- **Design:** Fundo do item transparente, borda inferior fina. Ao expandir, o texto de resposta aparece suavemente (transition opacity/height).

### 2.8 FOOTER
- **Layout:** Simples, centralizado.
- **Conteúdo:** Logo monocromática, frase de efeito, links legais (Termos/Privacidade) e copyright.
- **Design:** Texto em `--text-secondary`, tamanho reduzido.

---

## 3. LÓGICA DE COMPORTAMENTO (INTERAÇÕES)
- **Scroll Suave:** Todos os botões "Simular Agora" ancoram suavemente para a Seção de Preços.
- **Animações de Entrada:** Usar Intersection Observer para fazer os elementos aparecerem suavemente (fade-in up) conforme o usuário faz scroll.
- **Integração de Pagamento:** Os botões de preço devem ter o atributo/função que aciona a API de pagamento da Manus (Stripe Checkout Modal). Não há redirecionamento de página. Após o pagamento aprovado via webhook, a página atualiza ou exibe um modal com o Token de Acesso.
