export async function onRequestPost({ request, env }) {
  try {
    const { url, scores, failingAudits, pageContent } = await request.json();
    if (!url || !scores) return json({ ok: false, error: 'Missing data.' }, 400);

    const anthropicKey = env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return json({ ok: false, error: 'Analysis unavailable.' }, 500);

    const prompt = `You are a friendly website advisor writing to a small business owner — think restaurant owner, salon owner, plumber. They are not technical at all. You are reviewing their website and explaining what's wrong in simple, everyday language.

Here is their website data:

URL: ${url}
Speed score: ${scores.performance}/100${scores.loadTime ? ` (main content loads in: ${scores.loadTime})` : ''}${scores.fcp ? ` (first thing appears on screen in: ${scores.fcp})` : ''}
Google findability score: ${scores.seo}/100
Accessibility score: ${scores.accessibility}/100
Overall quality score: ${scores.bestPractices}/100

Issues found on the site:
${(failingAudits || []).length > 0 ? failingAudits.join('\n') : '- None detected'}

Their homepage:
- Page title: ${pageContent?.title || 'Not set'}
- Description shown in Google search results: ${pageContent?.metaDesc || 'Missing — nothing shows up in Google'}
- Main headline: ${pageContent?.h1s?.join(' | ') || 'None found'}
- Section headings: ${pageContent?.h2s?.join(' | ') || 'None found'}
- Page content: ${pageContent?.bodyText || 'Not available'}

Write 3–4 bullet points explaining what's wrong. Rules:
- Use zero technical terms. No "H1", no "meta description", no "LCP", no "accessibility", no "semantic structure". Translate everything into plain English a business owner would understand.
- Only use real numbers from the data above — never invent load times or statistics.
- Tie every issue to a real business consequence they'd care about: losing customers, not showing up on Google, looking unprofessional.
- Reference actual content from their site where possible to make it feel personal.
- End with one short encouraging sentence — these problems are common and fixable.

Format: bullet points only using the • character. No bold. No headers. Under 140 words total.`;

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
