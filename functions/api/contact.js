export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') || '';
    const business = formData.get('business') || '';
    const website = formData.get('website') || '';
    const message = formData.get('message') || '';
    const botField = formData.get('bot-field') || '';

    // Honeypot check
    if (botField) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AgenticSiteSolutions <max@outreach.agenticsitesolutions.com>',
        to: 'max@agenticsitesolutions.com',
        reply_to: name && message ? undefined : undefined,
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
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ ok: false, error: 'Failed to send' }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('Contact function error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500 });
  }
}
