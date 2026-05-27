'use client';

/**
 * 문의 폼 클라이언트 컴포넌트.
 * 이름(선택)·이메일(선택)·문의내용(필수) 입력 → submitInquiry Server Action 호출.
 * 성공 시 토스트 표시 + 폼 초기화. 에러는 인라인 표시.
 */

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { submitInquiry } from '@/lib/actions/inquiry';
import { useToast } from '@/components/Toast';

interface Props {
  defaultEmail: string;
}

export default function ContactForm({ defaultEmail }: Props) {
  const t = useTranslations('contact');
  const toast = useToast();

  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [fieldError, setFieldError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const message = (data.get('message') as string | null)?.trim() ?? '';
    const email   = (data.get('email')   as string | null)?.trim() ?? '';

    // 클라이언트 사전 검증
    if (!message) {
      setFieldError(t('messageRequired'));
      return;
    }
    if (message.length > 2000) {
      setFieldError(t('messageTooLong'));
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(t('emailError'));
      return;
    }

    startTransition(async () => {
      const result = await submitInquiry(data);
      if (result.error) {
        setFieldError(result.error);
      } else {
        toast.show(t('success'), 'success');
        formRef.current?.reset();
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* 이름 */}
      <div>
        <label
          htmlFor="inq-name"
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--muted-strong)',
            marginBottom: 6,
          }}
        >
          이름 (선택)
        </label>
        <input
          id="inq-name"
          name="name"
          type="text"
          placeholder={t('namePlaceholder')}
          maxLength={100}
          style={{
            width: '100%',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14.5,
            color: 'var(--ink)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 이메일 */}
      <div>
        <label
          htmlFor="inq-email"
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--muted-strong)',
            marginBottom: 6,
          }}
        >
          이메일 (선택)
        </label>
        <input
          id="inq-email"
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          defaultValue={defaultEmail}
          maxLength={200}
          style={{
            width: '100%',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14.5,
            color: 'var(--ink)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 문의 내용 */}
      <div>
        <label
          htmlFor="inq-message"
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--muted-strong)',
            marginBottom: 6,
          }}
        >
          문의 내용 <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        <textarea
          id="inq-message"
          name="message"
          rows={6}
          required
          placeholder={t('messagePlaceholder')}
          maxLength={2000}
          style={{
            width: '100%',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14.5,
            color: 'var(--ink)',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 에러 메시지 */}
      {fieldError && (
        <p
          role="alert"
          style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}
        >
          {fieldError}
        </p>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          background: isPending
            ? 'var(--card2)'
            : 'linear-gradient(135deg,var(--brand),var(--brand2))',
          color: isPending ? 'var(--muted)' : '#fff',
          border: 0,
          borderRadius: 12,
          padding: '13px 24px',
          fontSize: 15.5,
          fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background .15s',
          alignSelf: 'flex-start',
        }}
      >
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
