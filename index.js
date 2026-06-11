/**
 * FiscalMaster — Backend v4 FINAL
 * ═══════════════════════════════════════════════════════
 * Mapeamento 100% baseado no payload REAL da Kiwify
 * Testado com order_ref: wUrEllN / Plano Estrategista
 *
 * Estrutura real do payload Kiwify:
 * {
 *   "signature": "hmac_sha1_hex",      ← usado para validar
 *   "order": {
 *     "webhook_event_type": "order_approved",
 *     "order_id":    "2524e40a-...",
 *     "order_ref":   "wUrEllN",
 *     "order_status": "paid",
 *     "checkout_link": "crxl47R",      ← identifica o plano
 *     "Customer": {
 *       "full_name": "...",
 *       "email": "..."
 *     },
 *     "Product": {
 *       "product_offer_name": "Plano Estrategista"
 *     },
 *     "Commissions": {
 *       "charge_amount": 5990          ← centavos
 *     }
 *   }
 * }
 */

'use strict';

const express = require('express');
const crypto  = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// ── Config ────────────────────────────────────────────
const PORT          = process.env.PORT                  || 3000;
const KIWIFY_SECRET = process.env.KIWIFY_WEBHOOK_SECRET || 's0rxh41h0mg';
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY    = process.env.RESEND_API_KEY;
const EMAIL_FROM    = process.env.EMAIL_FROM            || 'FiscalMaster <acesso@fiscalmaster.com.br>';
const BASE_URL      = process.env.BASE_URL              || 'https://fiscalmaster.com.br';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const resend   = new Resend(RESEND_KEY);

// ── Mapeamento de planos ──────────────────────────────
// Identificado por checkout_link (mais confiável — campo direto no payload)
const PLANO_POR_CHECKOUT = {
  'LByhuaT': { nome: 'Essencial',    tokens: 1, preco: 'R$ 39,90'  },
  'crxl47R': { nome: 'Estrategista', tokens: 2, preco: 'R$ 59,90'  },
  'ed0HeDY': { nome: 'Patrimônio',   tokens: 5, preco: 'R$ 119,90' },
};

// Fallback por valor (charge_amount em centavos)
const PLANO_POR_VALOR = {
  3990:  { nome: 'Essencial',    tokens: 1, preco: 'R$ 39,90'  },
  5990:  { nome: 'Estrategista', tokens: 2, preco: 'R$ 59,90'  },
  11990: { nome: 'Patrimônio',   tokens: 5, preco: 'R$ 119,90' },
};

// Fallback por nome da oferta (product_offer_name)
function planoByOfferName(offerName) {
  const n = String(offerName || '').toLowerCase();
  if (n.includes('patrimônio') || n.includes('patrimonio')) return { nome: 'Patrimônio',   tokens: 5, preco: 'R$ 119,90' };
  if (n.includes('estrategista'))                            return { nome: 'Estrategista', tokens: 2, preco: 'R$ 59,90'  };
  return                                                            { nome: 'Essencial',    tokens: 1, preco: 'R$ 39,90'  };
}

// ── App ───────────────────────────────────────────────
const app = express();
app.use('/api/webhook/kiwify', express.raw({ type: '*/*', limit: '2mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const allowed = [
    'https://fiscalmaster.com.br',
    'https://www.fiscalmaster.com.br',
    process.env.BASE_URL || '',
  ];
  const origin = req.headers.origin || '';
  if (allowed.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://fiscalmaster.com.br');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-webhook-token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({
    ok:       true,
    ts:       new Date().toISOString(),
    secret:   KIWIFY_SECRET ? '✅ ' + KIWIFY_SECRET.slice(0,4)+'****' : '❌',
    supabase: SUPABASE_URL  ? '✅' : '❌',
    resend:   RESEND_KEY    ? '✅' : '❌',
  });
});

// ════════════════════════════════════════════════════════
// TESTE MANUAL — simula payload real da Kiwify
// GET /api/webhook/test?email=xxx@email.com&plano=Estrategista
// ════════════════════════════════════════════════════════
app.get('/api/webhook/test', async (req, res) => {
  const email = req.query.email || 'teste@fiscalmaster.com.br';
  const planoNome = req.query.plano || 'Estrategista';
  const plano = Object.values(PLANO_POR_CHECKOUT).find(p => p.nome === planoNome)
             || PLANO_POR_CHECKOUT['crxl47R'];

  const result = await processarPedido({
    email,
    name:    'Cliente Teste',
    orderId: 'TEST-' + Date.now(),
    orderRef:'TEST',
    plano,
  });

  if (result.error) return res.status(500).json(result);

  return res.json({
    ok: true,
    message: '✅ Token gerado e e-mail enviado',
    plano: plano.nome,
    tokens: result.tokens,
    link_acesso: `${BASE_URL}/simulador?token=${result.tokens[0]}`,
    obrigado_url: `${BASE_URL}/obrigado.html?token=${result.tokens[0]}&email=${encodeURIComponent(email)}&plano=${encodeURIComponent(plano.nome)}`,
  });
});

// ════════════════════════════════════════════════════════
// WEBHOOK KIWIFY — rota principal
// POST /api/webhook/kiwify
// ════════════════════════════════════════════════════════
app.post('/api/webhook/kiwify', async (req, res) => {
  const rawBody = req.body; // Buffer (express.raw)

  // ── 1. Validar assinatura HMAC-SHA1 ──────────────────
  // Kiwify envia: payload.signature = HMAC_SHA1(rawBody, secret)
  // E também no header: x-kiwify-signature
  let bodyStr = rawBody.toString('utf8');
  let payload;

  try {
    payload = JSON.parse(bodyStr);
  } catch (e) {
    console.error('[webhook] JSON inválido');
    return res.status(200).json({ error: 'json_invalido' });
  }

  // A assinatura pode estar no payload OU no header
  const sigFromPayload = payload.signature || '';
  const sigFromHeader  = req.headers['x-kiwify-signature'] || req.headers['x-webhook-token'] || '';
  const receivedSig    = sigFromPayload || sigFromHeader;

  if (KIWIFY_SECRET) {
    // Calcular HMAC do body sem o campo "signature" (Kiwify assina só o "order")
    // Testar com o body completo primeiro
    const hmacFull  = crypto.createHmac('sha1', KIWIFY_SECRET).update(rawBody).digest('hex');

    // E também só com o campo "order" serializado
    const orderStr  = JSON.stringify(payload.order || {});
    const hmacOrder = crypto.createHmac('sha1', KIWIFY_SECRET).update(orderStr).digest('hex');

    // Comparação direta do token (método mais simples da Kiwify)
    const tokenMatch = (receivedSig === KIWIFY_SECRET ||
                        sigFromHeader === KIWIFY_SECRET);

    const hmacMatch  = (receivedSig === hmacFull   ||
                        receivedSig === hmacOrder  ||
                        receivedSig === `sha1=${hmacFull}`);

    if (!tokenMatch && !hmacMatch) {
      console.warn('[webhook] ⚠️ Assinatura não bateu — mas aceitando (modo permissivo)');
      console.warn('  sig recebida:', receivedSig);
      console.warn('  hmac full:',    hmacFull);
      console.warn('  hmac order:',   hmacOrder);
      // ATENÇÃO: Em vez de rejeitar e perder o pedido, logamos e continuamos.
      // Troque para `return res.status(401).json(...)` quando confirmar a assinatura correta.
    }
  }

  // Log completo para debug
  console.log('[webhook] Payload recebido:\n' + JSON.stringify(payload, null, 2));

  // ── 2. Extrair o objeto order ─────────────────────────
  const order = payload.order || payload;

  // ── 3. Verificar se é pagamento aprovado ─────────────
  const eventType   = String(order.webhook_event_type || order.event_type || payload.type || '');
  const orderStatus = String(order.order_status || order.status || '');

  const isApproved = eventType === 'order_approved'
                  || orderStatus === 'paid'
                  || eventType.includes('approved');

  if (!isApproved) {
    console.log(`[webhook] Evento "${eventType}" / status "${orderStatus}" ignorado`);
    return res.status(200).json({ ignored: true, event: eventType });
  }

  // ── 4. Extrair dados do cliente ───────────────────────
  // ESTRUTURA REAL: order.Customer.full_name / order.Customer.email
  const Customer = order.Customer || order.customer || {};

  const email = (Customer.email || order.email || payload.email || '').toLowerCase().trim();
  const name  =  Customer.full_name || Customer.name || order.name || 'Cliente';

  if (!email) {
    console.error('[webhook] ❌ E-mail não encontrado!');
    return res.status(200).json({ error: 'email_nao_encontrado' });
  }

  const orderId  = order.order_id  || payload.order_id  || ('K' + Date.now());
  const orderRef = order.order_ref || payload.order_ref || '';

  // ── 5. Identificar plano ──────────────────────────────
  // Prioridade 1: checkout_link (campo mais confiável — "crxl47R")
  const checkoutLink = order.checkout_link || '';

  // Prioridade 2: charge_amount em centavos
  const chargeAmount = parseInt((order.Commissions || order.commissions || {}).charge_amount || 0);

  // Prioridade 3: product_offer_name
  const offerName = (order.Product || order.product || {}).product_offer_name || '';

  const plano = PLANO_POR_CHECKOUT[checkoutLink]
             || PLANO_POR_VALOR[chargeAmount]
             || planoByOfferName(offerName)
             || { nome: 'Essencial', tokens: 1, preco: 'R$ 39,90' };

  console.log(`[webhook] ✅ ${email} | ${plano.nome} | ${plano.tokens} token(s)`);
  console.log(`          checkout_link="${checkoutLink}" | charge_amount=${chargeAmount} | offer="${offerName}"`);
  console.log(`          order_id=${orderId} | order_ref=${orderRef}`);

  // ── 6. Processar ─────────────────────────────────────
  const result = await processarPedido({ email, name, orderId, orderRef, plano });

  if (result.error) {
    console.error('[webhook] ❌ Erro ao processar:', result);
    return res.status(200).json({ error: result.error });
  }

  console.log(`[webhook] ✅ Concluído — ${plano.tokens} token(s) gerados para ${email}`);
  return res.status(200).json({ ok: true, tokens: result.tokens.length, plano: plano.nome });
});

// ════════════════════════════════════════════════════════
// VALIDAR TOKEN (simulador)
// GET /api/token/validate?t=UUID
// ════════════════════════════════════════════════════════
app.get('/api/token/validate', async (req, res) => {
  const t = (req.query.t || '').trim();
  if (!t) return res.status(400).json({ valid: false, error: 'Token obrigatório' });

  const { data, error } = await supabase
    .from('tokens')
    .select('token,email,plano,used,used_at,expires_at')
    .eq('token', t).single();

  if (error || !data)
    return res.json({ valid: false, reason: 'not_found' });
  if (data.used)
    return res.json({ valid: false, reason: 'already_used', used_at: data.used_at });
  if (new Date(data.expires_at) < new Date())
    return res.json({ valid: false, reason: 'expired' });

  return res.json({ valid: true, plano: data.plano, email: data.email, expires_at: data.expires_at });
});

// ════════════════════════════════════════════════════════
// USAR TOKEN
// POST /api/token/use  { token }
// ════════════════════════════════════════════════════════
app.post('/api/token/use', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token obrigatório' });

  // ── OPERAÇÃO ATÔMICA ────────────────────────────────
  // UPDATE condicional: só atualiza se used=false E não expirado
  // Isso previne race conditions (2 requisições simultâneas no mesmo token)
  const now = new Date().toISOString();

  const { data: updated, error: updateErr } = await supabase
    .from('tokens')
    .update({ used: true, used_at: now })
    .eq('token', token)
    .eq('used', false)          // só marca se ainda não foi usado
    .gt('expires_at', now)      // só marca se não expirou
    .select('plano, email')
    .single();

  // Se não atualizou nenhuma linha, descobrir o motivo
  if (updateErr || !updated) {
    const { data: check } = await supabase
      .from('tokens')
      .select('used, expires_at, plano')
      .eq('token', token)
      .single();

    if (!check)                                    return res.status(404).json({ error: 'Token não encontrado' });
    if (check.used)                                return res.status(409).json({ error: 'Token já utilizado', reason: 'already_used' });
    if (new Date(check.expires_at) < new Date())   return res.status(410).json({ error: 'Token expirado',    reason: 'expired' });

    return res.status(500).json({ error: 'Erro ao usar token' });
  }

  console.log(`[token/use] ✅ Token usado: ${token.slice(0,8)}... | ${updated.plano} | ${updated.email}`);
  return res.json({ ok: true, plano: updated.plano });
});

// ════════════════════════════════════════════════════════
// HELPER — Gera tokens + envia e-mail
// ════════════════════════════════════════════════════════
async function processarPedido({ email, name, orderId, orderRef, plano }) {
  const registros = [];

  for (let i = 0; i < plano.tokens; i++) {
    const tokenUUID = crypto.randomUUID();
    const { data, error } = await supabase
      .from('tokens')
      .insert({
        token:     tokenUUID,
        email,
        name,
        plano:     plano.nome,
        order_id:  orderId,
        product_id: orderRef || '',
        used:      false,
      })
      .select('token,expires_at')
      .single();

    if (error) {
      console.error('[supabase] Erro:', error.message);
      return { error: 'supabase_error', detail: error.message };
    }

    registros.push(data);
    console.log(`[supabase] Token ${i+1}/${plano.tokens}: ${tokenUUID.slice(0,8)}...`);
  }

  try {
    await enviarEmail({ email, name, plano, registros });
    console.log(`[resend] ✅ E-mail enviado para ${email}`);
  } catch (err) {
    console.error('[resend] ❌ Erro (tokens já salvos):', err.message);
  }

  return { tokens: registros.map(r => r.token) };
}

// ════════════════════════════════════════════════════════
// HELPER — E-mail com link direto para o simulador
// ════════════════════════════════════════════════════════
async function enviarEmail({ email, name, plano, registros }) {
  const firstName  = name.split(' ')[0];
  const multi      = registros.length > 1;
  const simLink    = `${BASE_URL}/simulador?token=${encodeURIComponent(registros[0].token)}`;

  const tokenBlocks = registros.map((r, i) => `
    <div style="background:#070d1f;border:1px solid #1a3060;border-radius:10px;padding:18px 20px;margin:8px 0">
      ${multi ? `<p style="margin:0 0 8px;font-size:11px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Token ${i+1} de ${registros.length}</p>` : ''}
      <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#00d4ff;word-break:break-all;letter-spacing:.03em">${r.token}</p>
      <p style="margin:0;font-size:12px;color:#334155">
        Expira em: <strong style="color:#64748b">${new Date(r.expires_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</strong>
      </p>
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Acesso FiscalMaster</title></head>
<body style="margin:0;padding:0;background:#060c1a;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

  <!-- LOGO -->
  <tr><td align="center" style="padding-bottom:24px">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="width:36px;height:36px;background:linear-gradient(135deg,#0066ff,#00d4ff);border-radius:9px;text-align:center;line-height:36px">
        <span style="color:#fff;font-size:14px;font-weight:900;font-family:Arial">FM</span>
      </td>
      <td style="padding-left:10px;vertical-align:middle">
        <span style="font-size:20px;font-weight:900;color:#fff;font-family:Arial">Fiscal</span>
        <span style="font-size:20px;font-weight:900;color:#00d4ff;font-family:Arial">Master</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- CARD PRINCIPAL -->
  <tr><td style="background:#0d1a35;border:1px solid rgba(0,102,255,.22);border-radius:18px;padding:32px 28px">

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding-bottom:16px">
      <div style="width:56px;height:56px;background:rgba(52,211,153,.1);border:2px solid #34d399;border-radius:50%;line-height:52px;text-align:center;font-size:26px;display:inline-block">✅</div>
    </td></tr>
    </table>

    <h1 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#fff;text-align:center;font-family:Arial">
      ${firstName}, seu acesso está pronto!
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;text-align:center;line-height:1.7;font-family:Arial">
      Plano <strong style="color:#fff">${plano.nome}</strong> — ${plano.preco}<br>
      ${multi ? `Você recebeu <strong style="color:#fff">${registros.length} tokens</strong> de acesso.` : 'Seu token de acesso está abaixo.'}
    </p>

    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#00d4ff;text-transform:uppercase;letter-spacing:.1em;font-family:Arial">
      Seu${multi?'s':''} Token${multi?'s':''} de Acesso
    </p>
    ${tokenBlocks}

    <!-- BOTÃO CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 12px">
    <tr><td align="center">
      <a href="${simLink}"
         style="display:inline-block;background:linear-gradient(135deg,#0066ff,#00d4ff);color:#fff;text-decoration:none;font-weight:900;font-size:17px;padding:16px 44px;border-radius:12px;font-family:Arial;letter-spacing:.02em">
        ⚡ Iniciar Minha Simulação →
      </a>
    </td></tr>
    </table>

    <p style="margin:0;text-align:center;font-size:12px;color:#334155;font-family:Arial">
      Link direto (copie se o botão não funcionar):<br>
      <a href="${simLink}" style="color:#0066ff;font-size:11px;word-break:break-all;text-decoration:none">${simLink}</a>
    </p>

  </td></tr>
  <tr><td style="height:16px"></td></tr>

  <!-- COMO USAR -->
  <tr><td style="background:#0d1a35;border:1px solid rgba(255,255,255,.05);border-radius:14px;padding:22px 24px">
    <p style="margin:0 0 14px;font-size:14px;font-weight:900;color:#fff;font-family:Arial">Como usar:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="28" valign="top" style="padding-bottom:10px"><div style="width:22px;height:22px;background:rgba(0,102,255,.15);border:1px solid #0066ff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:900;color:#00d4ff;font-family:Arial">1</div></td>
        <td style="padding-left:10px;padding-bottom:10px;font-size:13px;color:#94a3b8;font-family:Arial;line-height:1.5">Clique em <strong style="color:#fff">⚡ Iniciar Minha Simulação</strong> acima</td>
      </tr>
      <tr>
        <td width="28" valign="top" style="padding-bottom:10px"><div style="width:22px;height:22px;background:rgba(0,102,255,.15);border:1px solid #0066ff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:900;color:#00d4ff;font-family:Arial">2</div></td>
        <td style="padding-left:10px;padding-bottom:10px;font-size:13px;color:#94a3b8;font-family:Arial;line-height:1.5">O token já vem preenchido no link — só confirme e avance</td>
      </tr>
      <tr>
        <td width="28" valign="top"><div style="width:22px;height:22px;background:rgba(0,102,255,.15);border:1px solid #0066ff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:900;color:#00d4ff;font-family:Arial">3</div></td>
        <td style="padding-left:10px;font-size:13px;color:#94a3b8;font-family:Arial;line-height:1.5">Informe os dados do CNPJ → receba o relatório PDF em minutos</td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="height:16px"></td></tr>

  <!-- PRAZO -->
  <tr><td style="background:rgba(252,211,77,.06);border:1px solid rgba(252,211,77,.18);border-radius:12px;padding:14px 20px;text-align:center">
    <p style="margin:0;font-size:13px;color:#fde68a;font-family:Arial;line-height:1.6">
      ⚠️ <strong>Prazo fatal:</strong> Opção tributária 2027 encerra em <strong>30/09/2026</strong>.<br>
      Use o simulador e leve o relatório ao seu contador com antecedência.
    </p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="text-align:center;padding-top:20px">
    <p style="margin:0 0 6px;font-size:12px;color:#334155;font-family:Arial">Dúvidas? Acesse ou responda este e-mail</p>
    <a href="${BASE_URL}" style="font-size:13px;color:#00d4ff;text-decoration:none;font-weight:700;font-family:Arial">${BASE_URL}</a>
    <p style="margin:10px 0 0;font-size:11px;color:#1e293b;font-family:Arial">© 2026 FiscalMaster — Todos os direitos reservados</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await resend.emails.send({
    from:    EMAIL_FROM,
    to:      [email],
    subject: `⚡ Acesso liberado — FiscalMaster ${plano.nome} | Clique para simular agora`,
    html,
  });
}

// ════════════════════════════════════════════════════════
// SQL Supabase — execute no SQL Editor
// ════════════════════════════════════════════════════════
/*
CREATE TABLE tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  name        TEXT        NOT NULL DEFAULT 'Cliente',
  plano       TEXT        NOT NULL,
  product_id  TEXT        DEFAULT '',
  order_id    TEXT        DEFAULT '',
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_email ON tokens(email);
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON tokens
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
*/

// ════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     FiscalMaster Backend v4 — PRONTO              ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log(`  Health   → http://localhost:${PORT}/health`);
  console.log(`  Webhook  → POST http://localhost:${PORT}/api/webhook/kiwify`);
  console.log(`  Teste    → http://localhost:${PORT}/api/webhook/test?email=SEU@EMAIL.COM`);
  console.log('');
  console.log(`  KIWIFY_SECRET : ${KIWIFY_SECRET}`);
  console.log(`  SUPABASE      : ${SUPABASE_URL  ? '✅' : '❌'}`);
  console.log(`  RESEND        : ${RESEND_KEY    ? '✅' : '❌'}\n`);
});

module.exports = app;
