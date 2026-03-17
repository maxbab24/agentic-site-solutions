import type { APIRoute } from 'astro';
import { Resend } from 'resend';
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

    const apiKey = (env as any).RESEND_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing API key' }), { status: 500 });
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
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
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Contact error:', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
};
