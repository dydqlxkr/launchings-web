'use client';

/**
 * 알림 목록 클라이언트 컴포넌트.
 * - 마운트 시 전체 읽음 처리
 * - 각 알림 클릭 시 해당 앱 상세로 이동
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { markAllRead } from '@/lib/actions/notification';
import type { Notification } from '@/lib/types';

interface Props {
  title: string;
  initialNotifications: Notification[];
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function NotificationsContent({ title, initialNotifications }: Props) {
  const t = useTranslations('notifications');
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  // 페이지 진입 시 전체 읽음 처리 (배지 제거를 위해) — setState 없이 async 함수만 호출
  useEffect(() => {
    const hasUnread = initialNotifications.some((n) => !n.is_read);
    if (hasUnread) {
      // markAllRead는 Server Action이므로 외부 시스템 동기화에 해당
      // 로컬 state 갱신은 promise 콜백에서 수행
      markAllRead().then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      });
    }
    // 초기 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '-.5px',
          }}
        >
          {title}
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: 10,
                background: '#ff4757',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: 10,
                padding: '2px 8px',
                verticalAlign: 'middle',
              }}
            >
              {unreadCount}
            </span>
          )}
        </h1>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: 'var(--muted)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            {t('empty')}
          </h2>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 320,
              margin: '0 auto',
            }}
          >
            {t('emptyDesc')}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </>
  );
}

function NotificationItem({ notification: n }: { notification: Notification }) {
  const t = useTranslations('notifications');

  const actorName = n.actor?.display_name ?? n.actor?.handle ?? '알 수 없는 메이커';
  const appTitle = n.app?.title ?? '새 앱';

  const emoji = n.app?.thumbnail_emoji;
  const gradient = n.app?.thumbnail_gradient ?? '135deg, #1e2a4a, #3a2a5a';

  const content = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 12,
        background: n.is_read ? 'var(--card)' : 'rgba(108,140,255,.06)',
        border: n.is_read ? '1px solid var(--line)' : '1px solid rgba(108,140,255,.25)',
        transition: 'background .15s, border-color .15s',
        cursor: n.app ? 'pointer' : 'default',
      }}
    >
      {/* 앱 썸네일 미니 */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `linear-gradient(${gradient})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {emoji ?? '📦'}
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: n.is_read ? 500 : 700,
            color: 'var(--ink)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {n.type === 'new_app'
            ? t('newApp', { actor: actorName })
            : n.message ?? '새 알림'}
        </div>
        {n.app && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--muted)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {appTitle}
          </div>
        )}
      </div>

      {/* 시간 + 안 읽음 점 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {formatRelativeTime(n.created_at)}
        </span>
        {!n.is_read && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--brand)',
            }}
          />
        )}
      </div>
    </div>
  );

  if (n.app?.slug) {
    return (
      <Link href={`/ko/apps/${n.app.slug}`} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
