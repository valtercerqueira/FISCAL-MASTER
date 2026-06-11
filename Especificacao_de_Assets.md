# Especificação de Assets Visuais: FiscalMaster

Este documento lista todos os recursos visuais necessários para o desenvolvimento da landing page, garantindo a estética BizNext (Dark Mode, Neon, Glassmorphism).

## 1. LOGOTIPO
O logotipo deve ser tipográfico e minimalista. A palavra "Fiscal" em peso normal (regular) e "Master" em negrito (bold). Ao lado esquerdo, um ícone geométrico que remeta a um escudo (proteção) ou um gráfico ascendente (lucro). As cores devem ser branco sólido e azul elétrico (#0066FF).

## 2. IMAGENS PRINCIPAIS (MOCKUPS)

### Mockup Hero (Notebook)
Uma imagem de alta resolução de um notebook moderno (estilo MacBook Pro prateado) aberto sobre uma mesa de escritório limpa, com iluminação dramática. A tela do notebook deve exibir uma interface fictícia do FiscalMaster: um dashboard escuro com um grande gráfico de barras comparando quatro colunas (representando os 4 regimes tributários) e um box de destaque com o texto "Recomendação da IA: Simples Híbrido".

### Mockup Secundário (Mobile/Tablet)
Uma imagem de um smartphone e um tablet flutuando em perspectiva isométrica. As telas devem mostrar o formulário de entrada de dados (simples e limpo) e a tela de "Relatório PDF Gerado com Sucesso". O fundo deve ser escuro com um brilho radial azul neon (#00D4FF) emanando de trás dos dispositivos.

## 3. ÍCONES (VETORES SVG)

Os ícones devem seguir um estilo "outline" (linha fina) com espessura de 1.5px a 2px, na cor branca ou azul elétrico. A biblioteca recomendada é Lucide Icons ou Phosphor Icons.

| Seção | Ícone Sugerido | Propósito |
|-------|----------------|-----------|
| Hero Cards | `bot` (Robô/IA) | Representar a Análise por Inteligência Artificial. |
| Hero Cards | `calculator` (Calculadora) | Representar o cálculo dos 4 regimes tributários. |
| Hero Cards | `shield-check` (Escudo com Check) | Representar segurança e atualização 100% com a lei. |
| Riscos | `trending-down` (Gráfico caindo) | Representar o risco de perda de clientes B2B. |
| Riscos | `alert-triangle` (Alerta) | Representar o perigo de pagar 40% a mais de impostos. |
| Riscos | `eye-off` (Olho fechado) | Representar o risco de tomar decisões "no escuro". |

## 4. EFEITOS VISUAIS (CSS EFFECTS)

### Glassmorphism (Efeito Vidro)
Aplicado nos cards flutuantes e na área de preços. A receita CSS exata é:
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
```

### Neon Glow (Brilhos Radiais)
Aplicado atrás de elementos focais (Mockup principal e Cards de Preço) para dar profundidade ao Dark Mode.
```css
background: radial-gradient(circle at center, rgba(0, 102, 255, 0.15) 0%, rgba(11, 17, 32, 0) 70%);
```

### Button Hover (Glow Animado)
Aplicado no botão principal (CTA) para incentivar o clique.
```css
background-color: #0066FF;
box-shadow: 0 0 15px rgba(0, 102, 255, 0.4);
transition: all 0.3s ease;

/* No Hover */
transform: translateY(-2px);
box-shadow: 0 0 25px rgba(0, 212, 255, 0.6);
```

## 5. ILUSTRAÇÕES ABSTRATAS
Para a seção "Como Funciona", em vez de fotos reais, devem ser usadas ilustrações 3D abstratas ou gráficos vetoriais complexos que remetam a "processamento de dados" e "inteligência artificial" (ex: esferas conectadas por linhas brilhantes, blocos de dados sendo organizados). Isso reforça o posicionamento de ferramenta tecnológica avançada.
