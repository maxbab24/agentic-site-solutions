export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') || '';
    const business = formData.get('business') || '';
    const website = formData.get('website') || '';
    const message = formData.get('message') || '';
    const botField = formData.get('bot-field') || '';

    if (botField) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const apiKey = env.RESEND_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing API key' }), { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AgenticSiteSolutions <max@outreach.agenticsitesolutions.com>',
        to: 'inquiry@agenticsitesolutions.com',
        subject: `New inquiry from ${business || name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Business:</strong> ${business}</p>
          <p><strong>Website:</strong> ${website || 'Not provided'}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ ok: false, error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
}
