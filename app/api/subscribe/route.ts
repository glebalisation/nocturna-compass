import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { randomBytes } from 'crypto';

function refCode() { return randomBytes(4).toString('hex'); } // 8 chars

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = typeof b.email === 'string' ? b.email.toLowerCase().trim() : '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  if (b.consent !== true) {
    return NextResponse.json({ error: 'Consent required' }, { status: 400 });
  }

  const phone = typeof b.phone === 'string' && b.phone.trim()
    ? b.phone.replace(/[^\d+()\-\s]/g, '').slice(0, 24) : null;
  const genres = Array.isArray(b.genres) ? b.genres.map(String).slice(0, 10) : [];
  const areas = Array.isArray(b.areas) ? b.areas.map(String).slice(0, 10) : [];
  const code = refCode();

  const sb = supabaseAdmin();
  let referral_code = code;

  if (sb) {
    const { data, error } = await sb.from('subscribers').upsert({
      email,
      phone,
      genres,
      areas,
      consent: true,
      sms_consent: !!phone && b.sms_consent === true,
      source: typeof b.source === 'string' ? b.source.slice(0, 60) : 'site',
      referred_by: typeof b.ref === 'string' ? b.ref.slice(0, 16) : null,
      status: 'active',
    }, { onConflict: 'email' }).select('referral_code').single();

    if (error) return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });

    // ensure referral code exists (upsert of an existing row keeps old code)
    if (data?.referral_code) referral_code = data.referral_code;
    else await sb.from('subscribers').update({ referral_code: code }).eq('email', email);

    // credit the inviter (best-effort)
    if (typeof b.ref === 'string' && b.ref) {
      const { data: inviter } = await sb.from('subscribers')
        .select('id, referral_count').eq('referral_code', b.ref).maybeSingle();
      if (inviter && inviter.referral_count < 10000) {
        await sb.from('subscribers')
          .update({ referral_count: (inviter.referral_count ?? 0) + 1 })
          .eq('id', inviter.id);
      }
    }
  }

  // mirror into Resend audience for Friday broadcasts
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
    await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, referral_code });
}
