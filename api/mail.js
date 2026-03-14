export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { winery, country, region, nl_available, where_to_buy, summary, notes } = req.body;

  const statusLabel = nl_available === true ? '✅ Beschikbaar in NL' : nl_available === false ? '❌ Niet in NL' : '❓ Onbekend';
  const shops = (where_to_buy || []).join(', ') || '—';
  const now = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

  const html = `
    <h2 style="color:#7B1E3A;font-family:Georgia,serif">🍷 ProWein 2026 — Gespreksnotitie</h2>
    <table style="font-family:Georgia,serif;font-size:15px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;color:#888;width:160px">Wijnhuis</td><td style="padding:8px;font-weight:bold">${winery}</td></tr>
      <tr style="background:#faf7f2"><td style="padding:8px;color:#888">Regio / Land</td><td style="padding:8px">${[region, country].filter(Boolean).join(' · ')}</td></tr>
      <tr><td style="padding:8px;color:#888">NL beschikbaar</td><td style="padding:8px">${statusLabel}</td></tr>
      <tr style="background:#faf7f2"><td style="padding:8px;color:#888">Te koop bij</td><td style="padding:8px">${shops}</td></tr>
      <tr><td style="padding:8px;color:#888">Samenvatting</td><td style="padding:8px">${summary || '—'}</td></tr>
      <tr style="background:#faf7f2"><td style="padding:8px;color:#888;vertical-align:top">Notities</td><td style="padding:8px;white-space:pre-wrap">${notes || '—'}</td></tr>
      <tr><td style="padding:8px;color:#888">Tijdstip</td><td style="padding:8px">${now}</td></tr>
    </table>
    <p style="font-family:Georgia,serif;font-size:12px;color:#aaa;margin-top:24px">Verstuurd via wijntripje.nl NL Wijn Checker · ProWein 2026</p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'ProWein Checker <onboarding@resend.dev>',
        to: ['info@wijntripje.nl'],
        subject: `🍷 ProWein: ${winery}`,
        html
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: true, detail: data });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: true, detail: err.message });
  }
}
