// ══════════════════════════════════════════════════════
// FiscalMaster Backend — Railway (Node.js)
// Repo: valtercerqueira/fiscalmaster-api
// ══════════════════════════════════════════════════════

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

// ── CORS aberto (HTML estático na Hostinger) ──
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-webhook-token,x-kiwify-signature');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Clientes ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WEBHOOK_TOKEN = process.env.KIWIFY_WEBHOOK_TOKEN || 's0rxh41h0mg';
const BASE_URL = process.env.BASE_URL || 'https://fiscalmaster.com.br';

// ── Mapa de produtos Kiwify → tokens ──
const PRODUCT_MAP = {
  'LByhuaT': { name: 'Essencial', tokens: 1, price: '39.90' },
  'crxl47R': { name: 'Estrategista', tokens: 2, price: '59.90' },
  'ed0HeDY': { name: 'Patrimônio', tokens: 5, price: '119.90' },
};

// ══════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ══════════════════════════════════════════════════════
// WEBHOOK KIWIFY — recebe pagamento aprovado
// ══════════════════════════════════════════════════════
app.post('/api/webhook/kiwify', async (req, res) => {
  try {
    // Verificar token de segurança
    const token = req.headers['x-webhook-token'] || req.query.token;
    if (token !== WEBHOOK_TOKEN) {
      console.log('[webhook] Token inválido:', token);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body;
    console.log('[webhook] Recebido:', JSON.stringify(body).slice(0, 500));

    // Kiwify envia order_status
    const status = body.order_status || body.subscription_status || '';
    if (status !== 'paid' && status !== 'completed') {
      console.log('[webhook] Status ignorado:', status);
      return res.json({ ok: true, action: 'ignored', status });
    }

    // Extrair dados do comprador
    const customer = body.Customer || body.customer || {};
    const email = customer.email || body.email || '';
    const name = customer.full_name || customer.name || body.name || 'Cliente';
    const productId = body.product_id || body.Product?.id || '';

    if (!email) {
      console.log('[webhook] Email ausente');
      return res.status(400).json({ error: 'Email ausente' });
    }

    // Determinar quantidade de tokens
    const product = PRODUCT_MAP[productId] || { name: 'Avulso', tokens: 1, price: '39.90' };
    console.log(`[webhook] Produto: ${product.name} (${product.tokens} tokens) para ${email}`);

    // Gerar tokens e salvar no Supabase
    const tokenIds = [];
    for (let i = 0; i < product.tokens; i++) {
      const tokenId = crypto.randomUUID();
      const { error } = await supabase.from('tokens').insert({
        id: tokenId,
        email: email,
        name: name,
        product: product.name,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) {
        console.error('[webhook] Erro Supabase:', error);
        return res.status(500).json({ error: 'Erro ao gerar token' });
      }
      tokenIds.push(tokenId);
    }

    // Montar links de acesso
    const links = tokenIds.map((t, i) =>
      `Simulação ${i + 1}: ${BASE_URL}/simulador?token=${t}`
    ).join('\n');

    // Enviar e-mail via Resend
    try {
      await resend.emails.send({
        from: 'FiscalMaster <acesso@fiscalmaster.com.br>',
        to: [email],
        subject: `🔑 Seu acesso ao FiscalMaster — Pacote ${product.name}`,
        html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0B1120;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#0066FF,#00D4FF);border-radius:8px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-weight:bold;font-size:18px">F</span>
      </div>
      <span style="color:white;font-weight:700;font-size:20px">Fiscal<span style="color:#00D4FF">Master</span></span>
    </div>
  </div>

  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px">
    <h1 style="color:#fff;font-size:22px;margin:0 0 8px">Olá, ${name}! 👋</h1>
    <p style="color:#94A3B8;font-size:15px;line-height:1.7;margin:0 0 24px">
      Seu pagamento do <strong style="color:#fff">Pacote ${product.name}</strong> foi confirmado.
      ${product.tokens > 1 ? `Você tem <strong style="color:#00D4FF">${product.tokens} simulações</strong> disponíveis.` : 'Sua simulação está pronta para uso.'}
    </p>

    <div style="background:rgba(0,102,255,0.1);border:1px solid rgba(0,102,255,0.3);border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#93C5FD;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">
        ${product.tokens > 1 ? 'Seus links de acesso' : 'Seu link de acesso'}
      </p>
      ${tokenIds.map((t, i) => `
      <div style="margin-bottom:${i < tokenIds.length - 1 ? '12px' : '0'}">
        ${product.tokens > 1 ? `<p style="color:#fff;font-size:13px;margin:0 0 6px;font-weight:600">Simulação ${i + 1}:</p>` : ''}
        <a href="${BASE_URL}/simulador?token=${t}"
           style="display:inline-block;background:#0066FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Iniciar Simulação${product.tokens > 1 ? ` ${i + 1}` : ''} →
        </a>
      </div>
      `).join('')}
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px">
      <p style="color:#64748B;font-size:12px;line-height:1.6;margin:0">
        ⏰ Tokens válidos por 30 dias.<br>
        📧 Dúvidas? Responda este e-mail ou escreva para acesso@fiscalmaster.com.br
      </p>
    </div>
  </div>

  <p style="text-align:center;color:#475569;font-size:11px;margin-top:24px">
    © 2026 FiscalMaster — Simulador Tributário com IA
  </p>
</div>
</body></html>`,
      });
      console.log(`[webhook] E-mail enviado para ${email}`);
    } catch (emailErr) {
      console.error('[webhook] Erro ao enviar e-mail:', emailErr);
      // Token já foi gerado, não falhar por causa do e-mail
    }

    res.json({
      ok: true,
      product: product.name,
      tokens_generated: tokenIds.length,
      email,
    });
  } catch (err) {
    console.error('[webhook] Erro geral:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════════
// VALIDAR TOKEN — chamado pelo simulador.html
// ══════════════════════════════════════════════════════
app.get('/api/token/validate', async (req, res) => {
  try {
    const tokenId = req.query.token;
    if (!tokenId) return res.status(400).json({ valid: false, reason: 'missing' });

    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error || !data) {
      return res.json({ valid: false, reason: 'invalid' });
    }
    if (data.status === 'used') {
      return res.json({ valid: false, reason: 'used' });
    }
    if (new Date(data.expires_at) < new Date()) {
      return res.json({ valid: false, reason: 'expired' });
    }

    res.json({
      valid: true,
      name: data.name,
      email: data.email,
      product: data.product,
    });
  } catch (err) {
    console.error('[validate] Erro:', err);
    res.status(500).json({ valid: false, reason: 'server_error' });
  }
});

// ══════════════════════════════════════════════════════
// SIMULAÇÃO — motor de cálculo + parecer IA
// ══════════════════════════════════════════════════════
app.post('/api/simulate', async (req, res) => {
  try {
    const { token, cnae, uf, natureza, faturamento, folha, despesas } = req.body;

    // Validar token
    if (!token) return res.status(400).json({ error: 'Token obrigatório' });

    const { data: tokenData, error: tokenErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', token)
      .eq('status', 'active')
      .single();

    if (tokenErr || !tokenData) {
      return res.status(403).json({ error: 'Token inválido ou já utilizado' });
    }
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Token expirado' });
    }

    // ── Cálculos tributários ──
    const fat = parseFloat(faturamento) || 0;
    const fol = parseFloat(folha) || 0;
    const desp = parseFloat(despesas) || 0;
    const fatorR = fat > 0 ? fol / fat : 0;

    // 1. Simples Nacional Tradicional (estimativa simplificada)
    let aliquotaSimples = 0.06; // Anexo III base
    if (fat > 180000) aliquotaSimples = 0.112;
    if (fat > 360000) aliquotaSimples = 0.135;
    if (fat > 720000) aliquotaSimples = 0.16;
    if (fat > 1800000) aliquotaSimples = 0.21;
    if (fat > 3600000) aliquotaSimples = 0.33;
    // Se fator R < 28% e for serviço, vai pro Anexo V (mais caro)
    const isServico = natureza === 'B2B' || (cnae && cnae.startsWith('6'));
    if (isServico && fatorR < 0.28) {
      aliquotaSimples = Math.min(aliquotaSimples * 1.4, 0.33);
    }
    const simplesTradicional = fat * aliquotaSimples;

    // 2. Simples Híbrido IBS/CBS (DAS reduzido + IBS/CBS por fora)
    const aliquotaIBS_CBS = 0.0765; // estimativa IBS 3.65% + CBS 3.0% = ~7.65% média
    const dasReduzido = fat * (aliquotaSimples * 0.7); // DAS ~30% menor
    const ibsCbs = fat * aliquotaIBS_CBS;
    const simplesHibrido = dasReduzido + ibsCbs;

    // 3. Lucro Presumido
    const margemPresuncao = isServico ? 0.32 : 0.08;
    const basePresumida = fat * margemPresuncao;
    const irpj = basePresumida * 0.15;
    const irpjAdicional = Math.max(0, (basePresumida - 240000)) * 0.10;
    const csll = basePresumida * 0.09;
    const pisCofins = fat * 0.0365; // PIS 0.65% + COFINS 3%
    const issIcms = fat * (isServico ? 0.05 : 0.03); // estimativa ISS ou ICMS
    const lucroPresumido = irpj + irpjAdicional + csll + pisCofins + issIcms;

    // 4. Lucro Real
    const lucroLiquido = fat - fol - desp;
    const irpjReal = Math.max(0, lucroLiquido * 0.15);
    const irpjAdicionalReal = Math.max(0, (lucroLiquido - 240000)) * 0.10;
    const csllReal = Math.max(0, lucroLiquido * 0.09);
    const pisCofinsReal = fat * 0.0925; // PIS 1.65% + COFINS 7.6% (não-cumulativo)
    const issIcmsReal = fat * (isServico ? 0.05 : 0.03);
    const lucroReal = irpjReal + irpjAdicionalReal + csllReal + pisCofinsReal + issIcmsReal;

    const resultados = {
      simplesTradicional: Math.round(simplesTradicional * 100) / 100,
      simplesHibrido: Math.round(simplesHibrido * 100) / 100,
      lucroPresumido: Math.round(lucroPresumido * 100) / 100,
      lucroReal: Math.round(lucroReal * 100) / 100,
      fatorR: Math.round(fatorR * 10000) / 100,
    };

    // Determinar menor carga
    const regimes = [
      { nome: 'Simples Nacional (Tradicional)', valor: resultados.simplesTradicional },
      { nome: 'Simples Nacional (Híbrido IBS/CBS)', valor: resultados.simplesHibrido },
      { nome: 'Lucro Presumido', valor: resultados.lucroPresumido },
      { nome: 'Lucro Real', valor: resultados.lucroReal },
    ];
    regimes.sort((a, b) => a.valor - b.valor);
    const melhorRegime = regimes[0];
    const piorRegime = regimes[regimes.length - 1];
    const economiaAnual = piorRegime.valor - melhorRegime.valor;

    // ── Parecer IA (Claude Haiku — barato e rápido) ──
    let parecer = '';
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: `Você é um consultor tributário especialista na Reforma Tributária brasileira (Lei Complementar 214/2025 e Resolução CGSN 186/2026). Gere um parecer estratégico claro e direto em português brasileiro. Máximo 800 palavras. Sem disclaimers legais genéricos — o aviso "consulte seu contador" já está no site. Use tópicos e negrito quando necessário.`,
        messages: [{
          role: 'user',
          content: `Dados da empresa:
- CNAE: ${cnae}
- UF: ${uf}
- Natureza: ${natureza}
- Faturamento projetado 2027: R$ ${fat.toLocaleString('pt-BR')}
- Folha de pagamento anual: R$ ${fol.toLocaleString('pt-BR')}
- Despesas operacionais anuais: R$ ${desp.toLocaleString('pt-BR')}
- Fator R: ${resultados.fatorR}%

Resultados dos cálculos:
- Simples Tradicional: R$ ${resultados.simplesTradicional.toLocaleString('pt-BR')}
- Simples Híbrido (IBS/CBS): R$ ${resultados.simplesHibrido.toLocaleString('pt-BR')}
- Lucro Presumido: R$ ${resultados.lucroPresumido.toLocaleString('pt-BR')}
- Lucro Real: R$ ${resultados.lucroReal.toLocaleString('pt-BR')}
- Melhor regime: ${melhorRegime.nome} (R$ ${melhorRegime.valor.toLocaleString('pt-BR')})
- Economia potencial: R$ ${economiaAnual.toLocaleString('pt-BR')}/ano

Gere o parecer com: 1) Diagnóstico da situação, 2) Análise de cada regime, 3) Recomendação principal, 4) Próximos passos antes de 30/09/2026.`,
        }],
      });
      parecer = msg.content[0]?.text || 'Parecer indisponível. Consulte os números acima.';
    } catch (aiErr) {
      console.error('[simulate] Erro IA:', aiErr);
      parecer = `Com base nos cálculos, o regime **${melhorRegime.nome}** apresenta a menor carga tributária estimada (R$ ${melhorRegime.valor.toLocaleString('pt-BR')}/ano), gerando uma economia potencial de R$ ${economiaAnual.toLocaleString('pt-BR')}/ano em relação ao cenário mais caro. Recomendamos apresentar estes números ao seu contador antes de 30/09/2026 para formalizar a opção.`;
    }

    // ── Consumir token ──
    await supabase
      .from('tokens')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', token);

    res.json({
      ok: true,
      dados: { cnae, uf, natureza, faturamento: fat, folha: fol, despesas: desp },
      resultados,
      melhorRegime: melhorRegime.nome,
      economiaAnual: Math.round(economiaAnual * 100) / 100,
      parecer,
    });
  } catch (err) {
    console.error('[simulate] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// ══════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FiscalMaster API rodando na porta ${PORT}`);
});
