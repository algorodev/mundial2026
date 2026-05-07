import nodemailer from "nodemailer";

type Env = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  appUrl: string;
};

function readEnv(): Env {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (!host || !port || !user || !pass || !from || !appUrl) {
    throw new Error(
      "Faltan variables de entorno SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_URL)"
    );
  }

  return { host, port: Number(port), user, pass, from, appUrl };
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { host, port, user, pass } = readEnv();
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function sendMagicLink(email: string, token: string) {
  const { from, appUrl } = readEnv();
  // El endpoint vive en /api/auth/verify (route handler de Next, no una página).
  const url = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: email,
    subject: "Tu acceso a PorraBros",
    text: `Hola,

Para entrar en PorraBros pulsa este enlace (caduca en 15 minutos):

${url}

Si no has pedido entrar, puedes ignorar este correo.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#10b981">PorraBros</h2>
      <p>Pulsa el botón para entrar. El enlace caduca en 15 minutos.</p>
      <p>
        <a href="${url}" style="display:inline-block;background:#f97316;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Entrar a PorraBros
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">Si no has pedido entrar, ignora este correo.</p>
    </div>`,
  });
}
