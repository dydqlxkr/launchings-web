/**
 * 이메일 알림 유틸리티 — 서버 전용
 *
 * 환경변수 RESEND_API_KEY 와 INQUIRY_NOTIFY_EMAIL 이 모두 설정된 경우에만 발송.
 * 하나라도 없으면 graceful no-op (DB 저장은 정상 진행).
 */

export interface InquiryNotificationPayload {
  name: string;
  email: string;
  message: string;
}

export async function sendInquiryNotification(
  payload: InquiryNotificationPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.INQUIRY_NOTIFY_EMAIL;

  // 키 또는 수신 주소가 없으면 조용히 skip
  if (!apiKey || !toEmail) {
    return;
  }

  const from =
    process.env.RESEND_FROM ?? 'Launchings <onboarding@resend.dev>';

  const { name, email, message } = payload;

  const senderLabel = name || '(이름 미입력)';
  const senderEmail = email || '(이메일 미입력)';

  const htmlBody = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">[런칭스] 새 문의가 접수됐어요</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="padding:8px 12px;background:#f5f5f5;font-weight:700;width:100px;border:1px solid #e0e0e0">이름</td>
      <td style="padding:8px 12px;border:1px solid #e0e0e0">${escapeHtml(senderLabel)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#f5f5f5;font-weight:700;border:1px solid #e0e0e0">이메일</td>
      <td style="padding:8px 12px;border:1px solid #e0e0e0">${escapeHtml(senderEmail)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#f5f5f5;font-weight:700;border:1px solid #e0e0e0;vertical-align:top">내용</td>
      <td style="padding:8px 12px;border:1px solid #e0e0e0;white-space:pre-wrap">${escapeHtml(message)}</td>
    </tr>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#666">
    이 메일은 <a href="https://launchings.io/ko/contact">launchings.io/ko/contact</a> 문의 폼을 통해 자동 발송됐습니다.
  </p>
</div>
`;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: [toEmail],
      subject: '[런칭스] 새 문의가 접수됐어요',
      html: htmlBody,
    });

    if (error) {
      console.error('[Email] Resend 발송 오류:', error);
    }
  } catch (err) {
    console.error('[Email] sendInquiryNotification 예외:', err);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
