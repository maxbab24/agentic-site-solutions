import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const name = formData.get('name')?.toString() || '';
    const business = formData.get('business')?.toString() || '';
    const website = formData.get('website')?.toString() || '';
    const message = formData.get('message')?.toString() || '';
    const botField = formData.get('bot-field')?.toString() || '';

    if (botField) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const resendKey = (env as any).RESEND_API_KEY;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
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
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ ok: false }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('Contact error:', err);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
};
