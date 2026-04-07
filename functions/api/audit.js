export async function onRequestPost({ request, env }) {
  try {
    const { url, scores, failingAudits, pageContent } = await request.json();
    if (!url || !scores) return json({ ok: false, error: 'Missing data.' }, 400);

    const anthropicKey = env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return json({ ok: false, error: 'Analysis unavailable.' }, 500);

    const prompt = `You are a web consultant for AgenticSiteSolutions, which rebuilds outdated small business websites.

A small business owner just got their site audited. Google PageSpeed Insights results:

URL: ${url}
Performance: ${scores.performance}/100
SEO: ${scores.seo}/100
Accessibility: ${scores.accessibility}/100
Best Practices: ${scores.bestPractices}/100

Top technical issues detected:
${(failingAudits || []).length > 0 ? failingAudits.join('\n') : '- No specific failing audits'}

Homepage content:
- Page title: ${pageContent?.title || 'Not available'}
- Meta description: ${pageContent?.metaDesc || 'Missing'}
- H1 headings: ${pageContent?.h1s?.join(' | ') || 'None found'}
- H2 headings: ${pageContent?.h2s?.join(' | ') || 'None found'}
- Body text sample: ${pageContent?.bodyText || 'Not available'}

Write a short, plain-English breakdown for a non-technical business owner. 3–4 bullet points. Use both the technical scores AND the homepage content to give specific, personalized observations — mention actual content from their site where relevant. Focus on real business consequences: losing customers, poor Google rankings, lost trust. End with one short sentence about how these issues are all fixable.

Format: bullet points only using the • character. No markdown headers. No technical jargon. Under 130 words total.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) return json({ ok: false, error: 'Analysis unavailable.' }, 500);

    const data = await claudeRes.json();
    const analysis = data.content?.[0]?.text ?? null;

    return json({ ok: true, analysis });

  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
