import { Resend } from "resend";

type Env = {
  apiKey: string;
  from: string;
  appUrl: string;
};

function readEnv(): Env {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (!apiKey || !from || !appUrl) {
    throw new Error(
      "Faltan variables de entorno (RESEND_API_KEY, EMAIL_FROM, APP_URL)"
    );
  }

  return { apiKey, from, appUrl };
}

let cachedClient: Resend | null = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const { apiKey } = readEnv();
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

const YELLOW = "#FFD23F";
const BLACK = "#1A1A1A";
const PAPER = "#FAFAF7";
const MUTED = "#6B7280";

function renderHtml(url: string, logoUrl: string, isReset: boolean): string {
  const heading = isReset ? "Restablece tu contraseña" : "Crea tu contraseña";
  const intro = isReset
    ? "Pulsa el botón para elegir una contraseña nueva. El enlace es de un solo uso y caduca en"
    : "Pulsa el botón para fijar tu contraseña en PorraBros. El enlace es de un solo uso y caduca en";
  const buttonLabel = isReset ? "Cambiar contraseña →" : "Crear contraseña →";
  const preheader = isReset
    ? "Restablece tu contraseña de PorraBros · caduca en 15 minutos"
    : "Crea tu contraseña de PorraBros · caduca en 15 minutos";
  // Email HTML usa tablas e inline styles para sobrevivir a clientes torpes
  // (Outlook desktop sobre todo). SVG no funciona — usamos PNG.
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${heading} · PorraBros</title>
</head>
<body style="margin:0;padding:0;background-color:${BLACK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BLACK};">
<!-- preheader: el texto que sale en el preview de la bandeja -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BLACK};opacity:0">
  ${preheader}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BLACK};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

        <!-- Logo header -->
        <tr>
          <td align="center" style="padding:8px 0 28px 0;">
            <img src="${logoUrl}" alt="PorraBros" height="48" style="display:block;height:48px;width:auto;border:0;outline:none;" />
          </td>
        </tr>

        <!-- Card principal (estilo cromo: papel + borde negro grueso) -->
        <tr>
          <td style="background-color:${PAPER};border:3px solid ${BLACK};border-radius:12px;padding:40px 32px;box-shadow:6px 6px 0 ${YELLOW};">

            <h1 style="margin:0 0 16px 0;font-size:32px;line-height:1.1;font-weight:900;letter-spacing:-0.5px;color:${BLACK};text-transform:uppercase;">
              ${heading.split(" ")[0]} <span style="color:${YELLOW};-webkit-text-stroke:1px ${BLACK};text-stroke:1px ${BLACK};">${heading.split(" ").slice(1).join(" ")}</span>
            </h1>

            <p style="margin:0 0 32px 0;font-size:16px;line-height:1.5;color:${BLACK};">
              ${intro} <strong>15 minutos</strong>.
            </p>

            <!-- Bulletproof button: tabla anidada para Outlook -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
              <tr>
                <td align="center" bgcolor="${YELLOW}" style="background-color:${YELLOW};border:3px solid ${BLACK};border-radius:8px;box-shadow:4px 4px 0 ${BLACK};">
                  <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:900;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BLACK};text-decoration:none;text-transform:uppercase;letter-spacing:1px;">
                    ${buttonLabel}
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:${MUTED};">
              ¿El botón no funciona? Copia y pega esta URL en tu navegador:
            </p>
            <p style="margin:0 0 24px 0;font-size:12px;line-height:1.4;word-break:break-all;font-family:'SF Mono',Menlo,Consolas,monospace;color:${MUTED};">
              <a href="${url}" target="_blank" style="color:${MUTED};text-decoration:underline;">${url}</a>
            </p>

            <hr style="border:0;border-top:1px solid #E5E5E5;margin:24px 0;" />

            <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">
              Si no has pedido entrar a PorraBros, puedes ignorar este correo. Nadie podrá usar el enlace si no lo pulsas tú.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 16px 8px 16px;">
            <p style="margin:0;font-size:11px;line-height:1.5;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;font-family:'SF Mono',Menlo,Consolas,monospace;">
              ⚽ PorraBros · Porras entre amigos
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

type LinkKind = "set" | "reset";

/**
 * Manda un email con un enlace para crear o resetear la contraseña.
 *
 * El enlace apunta a la página intermedia /auth/set-password (no al endpoint
 * de la API): los prefetchers de los clientes de correo (Outlook Safe Links,
 * antivirus corporativos…) hacen GET sobre el link automáticamente y nos
 * "consumirían" el token antes de que el usuario llegase a pulsarlo. La
 * página intermedia muestra un formulario que dispara el POST que sí consume.
 */
export async function sendSetPasswordLink(
  email: string,
  token: string,
  kind: LinkKind = "set"
) {
  const { from, appUrl } = readEnv();
  const url = `${appUrl}/auth/set-password?token=${encodeURIComponent(token)}`;
  const logoUrl = `${appUrl}/brand/porrabros-logo-horizontal-1200.png`;
  const resend = getClient();

  const isReset = kind === "reset";
  const subject = isReset
    ? "Restablece tu contraseña de PorraBros"
    : "Crea tu contraseña de PorraBros";
  const textBody = isReset
    ? `Restablece tu contraseña en PorraBros

Pulsa este enlace para elegir una nueva contraseña (caduca en 15 minutos):

${url}

Si no has pedido cambiar la contraseña, puedes ignorar este correo.`
    : `Crea tu contraseña en PorraBros

Pulsa este enlace para fijar tu contraseña (caduca en 15 minutos):

${url}

Si no has pedido entrar a PorraBros, puedes ignorar este correo.`;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject,
    text: textBody,
    html: renderHtml(url, logoUrl, isReset),
  });

  if (error) {
    throw new Error(`Resend: ${error.name} — ${error.message}`);
  }
}
