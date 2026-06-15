import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Validate required env vars at startup
function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Meyah <notificaciones@meyah.com>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://meyah.com";

const VALID_EVENT_TYPES = ["new_application", "viewed", "accepted", "rejected"] as const;
type EventType = (typeof VALID_EVENT_TYPES)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface WebhookPayload {
  event_type: EventType;
  application_id: string;
  candidato_id: string;
  job_id: string;
  estado: string;
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- HTML escaping to prevent injection in email templates ---
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Idempotency check ---
async function alreadySent(
  applicationId: string,
  eventType: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("application_id", applicationId)
    .eq("event_type", eventType)
    .maybeSingle();
  return data !== null;
}

async function recordSent(
  applicationId: string,
  eventType: string,
  recipientId: string,
): Promise<boolean> {
  // Use upsert with ignoreDuplicates to atomically claim the send slot.
  // Returns false if the row already existed (another concurrent request won).
  const { data } = await supabase
    .from("notification_logs")
    .upsert(
      { application_id: applicationId, event_type: eventType, recipient_id: recipientId },
      { onConflict: "application_id,event_type", ignoreDuplicates: true },
    )
    .select("id");
  return (data?.length ?? 0) > 0;
}

// --- Opt-out check ---
async function isOptedOut(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("email_opt_out")
    .eq("id", userId)
    .single();
  return data?.email_opt_out === true;
}

// --- Data fetchers ---
async function getJobWithCompany(jobId: string) {
  const { data } = await supabase
    .from("jobs")
    .select("id, titulo, slug, company_id")
    .eq("id", jobId)
    .single();
  if (!data) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("id, nombre, owner_id")
    .eq("id", data.company_id)
    .single();

  return { job: data, company };
}

async function getUserEmail(userId: string): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(userId);
  return user?.email ?? null;
}

async function getUserName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", userId)
    .single();
  return data?.nombre ?? "Usuario";
}

// --- Email templates ---
function buildEmail(
  eventType: string,
  rawRecipientName: string,
  recipientEmail: string,
  rawJobTitle: string,
  rawCompanyName: string,
  linkUrl: string,
  unsubscribeUrl: string,
): EmailTemplate {
  // Escape user-supplied values to prevent HTML injection
  const recipientName = escapeHtml(rawRecipientName);
  const jobTitle = escapeHtml(rawJobTitle);
  const companyName = escapeHtml(rawCompanyName);
  const footer = `
    <p style="margin-top:32px;padding-top:16px;border-top:1px solid #E5DCC9;font-size:12px;color:#8C8176;">
      Este correo fue enviado por Meyah. Si no deseas recibir más notificaciones,
      <a href="${unsubscribeUrl}" style="color:#147068;">haz clic aquí para darte de baja</a>.
    </p>`;

  const wrapper = (content: string) => `
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:520px;margin:0 auto;background:#FAF5EC;padding:32px 24px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="font-family:'Fraunces',serif;color:#147068;margin:0;font-size:24px;">Meyah</h2>
      </div>
      ${content}
      ${footer}
    </div>`;

  switch (eventType) {
    case "new_application":
      return {
        to: recipientEmail,
        subject: `Nueva postulación para "${jobTitle}"`,
        html: wrapper(`
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            Hola <strong>${recipientName}</strong>,
          </p>
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            Alguien se ha postulado a tu vacante <strong>"${jobTitle}"</strong> en <strong>${companyName}</strong>.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${linkUrl}" style="display:inline-block;background:#147068;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">
              Ver postulante
            </a>
          </div>`),
      };

    case "viewed":
      return {
        to: recipientEmail,
        subject: `Tu postulación a "${jobTitle}" fue vista`,
        html: wrapper(`
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            Hola <strong>${recipientName}</strong>,
          </p>
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            ¡Buenas noticias! <strong>${companyName}</strong> ha visto tu postulación para <strong>"${jobTitle}"</strong>.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${linkUrl}" style="display:inline-block;background:#147068;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">
              Ver mis postulaciones
            </a>
          </div>`),
      };

    case "accepted":
      return {
        to: recipientEmail,
        subject: `¡Felicidades! Fuiste aceptado para "${jobTitle}"`,
        html: wrapper(`
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            Hola <strong>${recipientName}</strong>,
          </p>
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            🎉 <strong>${companyName}</strong> ha <strong style="color:#147068;">aceptado</strong> tu postulación para <strong>"${jobTitle}"</strong>.
          </p>
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            El empleador se pondrá en contacto contigo pronto. Revisa tu perfil para asegurarte de que tus datos de contacto estén actualizados.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${linkUrl}" style="display:inline-block;background:#147068;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">
              Ver mis postulaciones
            </a>
          </div>`),
      };

    case "rejected":
      return {
        to: recipientEmail,
        subject: `Actualización sobre tu postulación a "${jobTitle}"`,
        html: wrapper(`
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            Hola <strong>${recipientName}</strong>,
          </p>
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            <strong>${companyName}</strong> ha revisado tu postulación para <strong>"${jobTitle}"</strong> y en esta ocasión decidió continuar con otros candidatos.
          </p>
          <p style="color:#3D3530;font-size:15px;line-height:1.6;">
            No te desanimes — sigue explorando vacantes cerca de ti.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${linkUrl}" style="display:inline-block;background:#147068;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">
              Explorar vacantes
            </a>
          </div>`),
      };

    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

// --- Send via Resend ---
async function sendEmail(template: EmailTemplate): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: template.to,
      subject: template.subject,
      html: template.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // Log details server-side only; throw generic message
    console.error(`Resend API error ${res.status}: ${body}`);
    throw new Error("Email delivery failed");
  }
}

// --- Validation helpers ---
function isValidUUID(s: unknown): s is string {
  return typeof s === "string" && UUID_RE.test(s);
}

function isValidEventType(s: unknown): s is EventType {
  return typeof s === "string" && (VALID_EVENT_TYPES as readonly string[]).includes(s);
}

function validatePayload(body: unknown): WebhookPayload {
  if (typeof body !== "object" || body === null) throw new Error("Invalid payload");
  const b = body as Record<string, unknown>;
  if (!isValidEventType(b.event_type)) throw new Error("Invalid event_type");
  if (!isValidUUID(b.application_id)) throw new Error("Invalid application_id");
  if (!isValidUUID(b.candidato_id)) throw new Error("Invalid candidato_id");
  if (!isValidUUID(b.job_id)) throw new Error("Invalid job_id");
  return b as unknown as WebhookPayload;
}

// --- Main handler ---
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // --- Authentication: only the DB trigger (via service role key) may call this ---
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // --- Input validation ---
    const payload = validatePayload(await req.json());
    const { event_type, application_id, candidato_id, job_id } = payload;

    // 1. Idempotency
    if (await alreadySent(application_id, event_type)) {
      return new Response(JSON.stringify({ skipped: "already_sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch related data
    const result = await getJobWithCompany(job_id);
    if (!result?.job || !result?.company) {
      return new Response(JSON.stringify({ skipped: "job_not_found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { job, company } = result;

    // 3. Cross-validate: the application must belong to this candidate + job
    const { data: appRow } = await supabase
      .from("applications")
      .select("id")
      .eq("id", application_id)
      .eq("candidato_id", candidato_id)
      .eq("job_id", job_id)
      .maybeSingle();

    if (!appRow) {
      return new Response(JSON.stringify({ skipped: "application_mismatch" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Determine recipient and check opt-out
    let recipientId: string;
    let linkUrl: string;

    if (event_type === "new_application") {
      recipientId = company.owner_id;
      linkUrl = `${APP_URL}/dashboard/vacante/${job.id}/postulantes`;
    } else {
      recipientId = candidato_id;
      linkUrl =
        event_type === "rejected"
          ? `${APP_URL}/inicio`
          : `${APP_URL}/mis-postulaciones`;
    }

    if (await isOptedOut(recipientId)) {
      return new Response(JSON.stringify({ skipped: "opted_out" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Get recipient email and name
    const recipientEmail = await getUserEmail(recipientId);
    if (!recipientEmail) {
      return new Response(JSON.stringify({ skipped: "no_email" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const recipientName = await getUserName(recipientId);
    const unsubscribeUrl = `${APP_URL}/mi-perfil?opt_out=1`;

    // 6. Claim idempotency slot BEFORE sending (prevents race condition duplicates)
    const claimed = await recordSent(application_id, event_type, recipientId);
    if (!claimed) {
      return new Response(JSON.stringify({ skipped: "already_sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Build and send email
    const template = buildEmail(
      event_type,
      recipientName,
      recipientEmail,
      job.titulo,
      company.nombre,
      linkUrl,
      unsubscribeUrl,
    );

    await sendEmail(template);

    return new Response(JSON.stringify({ sent: true, event_type }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification error:", error);
    // Never leak internal error details to the caller
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
