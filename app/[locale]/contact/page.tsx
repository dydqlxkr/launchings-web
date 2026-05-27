/**
 * 문의하기 페이지 — /ko/contact
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: '문의하기 — Launchings',
  description: '런칭스에 궁금한 점이나 제안을 남겨주세요.',
};

export default async function ContactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1, width: '100%' }}>
        <div
          className="lp-container--sm"
          style={{ paddingTop: 40, paddingBottom: 60 }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-.5px',
              marginBottom: 8,
            }}
          >
            문의하기
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
            궁금한 점이나 제안이 있으시면 언제든지 남겨주세요.
          </p>
          <ContactForm
            defaultEmail={user?.email ?? ''}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
