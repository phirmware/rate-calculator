import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const NOTIFY_TO = "chibuzor.ojukwu@gmail.com";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function ipFromRequest(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function shiftTypeLabel(type: string): string {
  return type === "bankHoliday" ? "Bank Holiday" : type === "extra" ? "Extra" : "Normal";
}

function actionBadge(action: string): string {
  const styles: Record<string, string> = {
    add:    "background:#dcfce7;color:#166534;",
    edit:   "background:#fef9c3;color:#854d0e;",
    delete: "background:#fee2e2;color:#991b1b;",
  };
  const labels: Record<string, string> = { add: "Added", edit: "Edited", delete: "Deleted" };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;${styles[action] ?? ""}">${labels[action] ?? action}</span>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events, browser } = body as {
      events: Array<{ action: string; shift: { date: string; startTime: string; endTime: string; type: string }; ts: string }>;
      browser: Record<string, string>;
    };

    if (!events?.length) return NextResponse.json({ ok: true });

    const ip = ipFromRequest(req);
    const sessionStart = new Date(events[0].ts).toLocaleString("en-GB", {
      dateStyle: "full", timeStyle: "short", timeZone: browser?.timezone || "Europe/London",
    });

    const rows = events.map((e) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${actionBadge(e.action)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;">${e.shift.date}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${e.shift.startTime} → ${e.shift.endTime}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${shiftTypeLabel(e.shift.type)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:12px;">${new Date(e.ts).toLocaleTimeString("en-GB", { timeStyle: "short", timeZone: browser?.timezone || "Europe/London" })}</td>
      </tr>`).join("");

    const addCount    = events.filter((e) => e.action === "add").length;
    const editCount   = events.filter((e) => e.action === "edit").length;
    const deleteCount = events.filter((e) => e.action === "delete").length;
    const summary = [
      addCount    && `${addCount} added`,
      editCount   && `${editCount} edited`,
      deleteCount && `${deleteCount} deleted`,
    ].filter(Boolean).join(", ");

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

    <div style="background:#4f46e5;padding:20px 24px;">
      <p style="margin:0;color:rgba(255,255,255,.7);font-size:12px;text-transform:uppercase;letter-spacing:.08em;">RateCal · Session Summary</p>
      <h2 style="margin:4px 0 0;color:#fff;font-size:22px;">${events.length} shift action${events.length !== 1 ? "s" : ""} — ${summary}</h2>
    </div>

    <div style="padding:20px 24px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Session started</p>
      <p style="margin:0 0 20px;font-size:14px;color:#111;">${sessionStart}</p>
    </div>

    <div style="padding:0 24px;">
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Action</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Date</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Times</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Type</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">At</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="padding:20px 24px;">
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Browser / Device</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <tr><td style="padding:3px 12px 3px 0;color:#6b7280;white-space:nowrap;">IP Address</td><td style="padding:3px 0;color:#111;">${ip}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b7280;white-space:nowrap;">Browser</td><td style="padding:3px 0;color:#111;word-break:break-all;">${browser?.userAgent || "—"}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b7280;white-space:nowrap;">Language</td><td style="padding:3px 0;color:#111;">${browser?.language || "—"}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b7280;white-space:nowrap;">Timezone</td><td style="padding:3px 0;color:#111;">${browser?.timezone || "—"}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b7280;white-space:nowrap;">Screen</td><td style="padding:3px 0;color:#111;">${browser?.screen || "—"}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b7280;white-space:nowrap;">Platform</td><td style="padding:3px 0;color:#111;">${browser?.platform || "—"}</td></tr>
      </table>
    </div>

    <div style="padding:12px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Sent by RateCal · rate-calculator analytics</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: NOTIFY_TO,
      subject: `[RateCal] ${events.length} action${events.length !== 1 ? "s" : ""} — ${summary}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track] email error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
