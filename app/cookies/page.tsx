import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

const TITLE = "Política de cookies · PorraBros";
const DESCRIPTION =
  "Qué cookies usamos en PorraBros, para qué, y cómo aceptarlas, rechazarlas o borrarlas.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <LegalLayout
      kicker="Cookies"
      title={<>POLÍTICA DE COOKIES</>}
      updated="22 de mayo de 2026"
    >
      <p>
        Una cookie es un fichero pequeño que un sitio web guarda en tu
        navegador. En <strong>PorraBros</strong> usamos las menos posibles
        y solo para que la plataforma funcione bien.
      </p>

      <h2>Tipos de cookies que usamos</h2>

      <h3>Estrictamente necesarias</h3>
      <p>
        Sin estas no podemos prestarte el servicio. Sirven, sobre todo, para
        mantener tu sesión iniciada.
      </p>
      <ul>
        <li>
          <strong>porra_session</strong> — cookie propia. Guarda un JWT
          firmado con tu identificador de usuario. Caduca a los 60 días o al
          cerrar sesión.
        </li>
      </ul>
      <p>
        Estas cookies <strong>no requieren consentimiento</strong> porque
        son imprescindibles para usar la web.
      </p>

      <h3>Analíticas (opcionales)</h3>
      <p>
        Si las aceptas, cargamos <strong>Google Analytics 4</strong> para
        entender de forma agregada qué partes de la plataforma se usan más.
        La información se trata de manera anonimizada y nunca se cruza con
        tu cuenta.
      </p>
      <ul>
        <li>
          <strong>_ga, _ga_*</strong> — cookies de Google. Identificador
          anónimo de usuario y sesión. Caducidad de hasta 2 años. Más
          información en{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer noopener"
          >
            policies.google.com/privacy
          </a>
          .
        </li>
      </ul>

      <h2>Cómo aceptarlas, rechazarlas o cambiar tu decisión</h2>
      <p>
        La primera vez que entras te mostramos un banner con dos opciones:
        <strong> Aceptar</strong> o <strong>Rechazar</strong> las cookies
        analíticas. Las estrictamente necesarias se cargan en cualquier
        caso porque sin ellas la web no funciona.
      </p>
      <p>
        Puedes cambiar de opinión en cualquier momento borrando las cookies
        de PorraBros desde la configuración de tu navegador — al volver a
        cargar la web te volveremos a preguntar. La mayoría de navegadores
        permiten gestionar y borrar cookies desde sus preferencias:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noreferrer noopener"
          >
            Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/es/kb/proteccion-mejorada-contra-rastreo-firefox-escritorio"
            target="_blank"
            rel="noreferrer noopener"
          >
            Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noreferrer noopener"
          >
            Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/es-es/microsoft-edge"
            target="_blank"
            rel="noreferrer noopener"
          >
            Edge
          </a>
        </li>
      </ul>

      <h2>Más información</h2>
      <p>
        Para entender mejor cómo tratamos los datos asociados, revisa
        nuestra <a href="/privacidad">Política de privacidad</a>. Si tienes
        dudas, escríbenos a{" "}
        <a href="mailto:hola@porrabros.com">hola@porrabros.com</a>.
      </p>
    </LegalLayout>
  );
}
