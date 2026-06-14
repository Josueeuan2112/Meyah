import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Meyah <notificaciones@meyah.com>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://meyah.com";

interface WebhookPayload {
  event_type: "new_application" | "viewed" | "accepted" | "rejected";
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
): Promise<void> {
  await supabase.from("notification_logs").insert({
    application_id: applicationId,
    event_type: eventType,
    recipient_id: recipientId,
  });
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
  recipientName: string,
  recipientEmail: string,
  jobTitle: string,
  companyName: string,
  linkUrl: string,
  unsubscribeUrl: string,
): EmailTemplate {
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
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

// --- Main handler ---
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload: WebhookPayload = await req.json();
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

    // 3. Determine recipient and check opt-out
    let recipientId: string;
    let linkUrl: string;

    if (event_type === "new_application") {
      // Notify employer
      recipientId = company.owner_id;
      linkUrl = `${APP_URL}/dashboard/vacante/${job.id}/postulantes`;
    } else {
      // Notify candidate
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

    // 4. Get recipient email and name
    const recipientEmail = await getUserEmail(recipientId);
    if (!recipientEmail) {
      return new Response(JSON.stringify({ skipped: "no_email" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const recipientName = await getUserName(recipientId);
    const unsubscribeUrl = `${APP_URL}/mi-perfil?opt_out=1`;

    // 5. Build and send email
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

    // 6. Record for idempotency
    await recordSent(application_id, event_type, recipientId);

    return new Response(JSON.stringify({ sent: true, event_type }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
