'use client';

/**
 * 내 등록 제품 목록 — 클라이언트 컴포넌트.
 * 삭제 버튼 클릭 시 confirm 후 deleteApp Server Action 호출.
 * 삭제 후 router.refresh()로 목록 갱신.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deleteApp } from '@/lib/actions/app';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { AppWithRelations } from '@/lib/types';

interface Props {
  apps: AppWithRelations[];
}

export default function MyAppsList({ apps }: Props) {
  const t = useTranslations('myApps');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmApp, setConfirmApp] = useState<AppWithRelations | null>(null);

  function handleDelete(app: AppWithRelations) {
    setConfirmApp(app);
  }

  function handleDeleteConfirmed() {
    const app = confirmApp;
    setConfirmApp(null);
    if (!app) return;

    setDeletingId(app.id);
    setErrorMsg(null);

    startTransition(async () => {
      const result = await deleteApp(app.id);
      if ('error' in result) {
        setErrorMsg(result.error);
        setDeletingId(null);
      } else {
        // 낙관적 갱신: 서버 revalidatePath와 함께 목록 새로고침
        router.refresh();
        setDeletingId(null);
      }
    });
  }

  function statusLabel(status: string): string {
    switch (status) {
      case 'published': return t('statusPublished');
      case 'draft':     return t('statusDraft');
      case 'hidden':    return t('statusHidden');
      case 'removed':   return t('statusRemoved');
      default:          return status;
    }
  }

  function statusColor(status: string): string {
    switch (status) {
      case 'published': return '#4ade80';
      case 'draft':     return 'var(--muted)';
      case 'hidden':    return '#facc15';
      case 'removed':   return '#ff6b6b';
      default:          return 'var(--muted)';
    }
  }

  return (
    <>
      <ConfirmDialog
        open={confirmApp !== null}
        title={t('deleteConfirm')}
        confirmLabel={t('delete')}
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmApp(null)}
      />

      {errorMsg && (
        <div
          style={{
            background: 'rgba(255,107,107,.12)',
            border: '1px solid rgba(255,107,107,.3)',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#ff6b6b',
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {apps.map((app) => {
          const isDeleting = isPending && deletingId === app.id;
          return (
            <div
              key={app.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                opacity: isDeleting ? 0.5 : 1,
                transition: 'opacity .2s',
              }}
            >
              {/* 썸네일 */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  background: app.thumbnail_gradient
                    ? `linear-gradient(${app.thumbnail_gradient})`
                    : 'var(--card2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {app.thumbnail_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/app-images/${app.thumbnail_path}`}
                    alt={app.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  app.thumbnail_emoji ?? '📦'
                )}
              </div>

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Link
                    href={`/ko/apps/${app.slug}`}
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                    className="hover:text-[var(--brand)] transition-colors"
                  >
                    {app.title}
                  </Link>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: statusColor(app.status),
                      background: 'rgba(255,255,255,.06)',
                      border: `1px solid ${statusColor(app.status)}55`,
                      borderRadius: 6,
                      padding: '2px 8px',
                      flexShrink: 0,
                    }}
                  >
                    {statusLabel(app.status)}
                  </span>
                </div>
                {app.tagline && (
                  <div
                    style={{
                      color: 'var(--muted)',
                      fontSize: 13,
                      marginTop: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {app.tagline}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>▲</span>
                  <span>{app.vote_count} {t('votes')}</span>
                </div>
              </div>

              {/* 버튼 */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexShrink: 0,
                  alignItems: 'center',
                }}
              >
                <Link
                  href={`/ko/my-apps/${app.id}/edit`}
                  style={{
                    background: 'var(--chip)',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('edit')}
                </Link>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDelete(app)}
                  style={{
                    background: 'rgba(255,107,107,.1)',
                    border: '1px solid rgba(255,107,107,.3)',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ff6b6b',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
