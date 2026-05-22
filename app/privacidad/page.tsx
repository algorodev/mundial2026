import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

const TITLE = "Política de privacidad · PorraBros";
const DESCRIPTION =
  "Cómo tratamos tus datos personales en PorraBros: qué recopilamos, para qué, durante cuánto tiempo y cómo ejercer tus derechos.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/privacidad" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      kicker="Privacidad"
      title={<>POLÍTICA DE PRIVACIDAD</>}
      updated="22 de mayo de 2026"
    >
      <p>
        En <strong>PorraBros</strong> nos tomamos en serio tus datos. Esta
        política explica qué recopilamos cuando usas la plataforma, para qué
        lo usamos y qué derechos tienes. Está pensada para cumplir con el
        Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos es el equipo de
        PorraBros. Puedes ponerte en contacto con nosotros en{" "}
        <a href="mailto:admin@porrabros.com">admin@porrabros.com</a> para
        cualquier cuestión relacionada con tus datos personales.
      </p>

      <h2>Qué datos recopilamos</h2>
      <p>
        Solo guardamos lo imprescindible para que la porra funcione:
      </p>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, correo electrónico y una
          contraseña cifrada (mediante <em>bcrypt</em>).
        </li>
        <li>
          <strong>Actividad en la porra:</strong> grupos a los que perteneces
          y pronósticos que envías en cada partido.
        </li>
        <li>
          <strong>Datos técnicos:</strong> cookies estrictamente necesarias
          para mantener tu sesión iniciada. Si has dado consentimiento,
          también métricas anónimas de uso (ver{" "}
          <a href="/cookies">Política de cookies</a>).
        </li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Crear y mantener tu cuenta y tus porras.</li>
        <li>Calcular el ranking de tu grupo.</li>
        <li>Enviarte correos puntuales para crear o restablecer la contraseña.</li>
        <li>Detectar abusos y mantener la plataforma segura.</li>
        <li>Mejorar el servicio analizando uso agregado (solo si lo aceptas).</li>
      </ul>
      <p>
        <strong>No vendemos tus datos.</strong> No los cedemos a terceros con
        fines comerciales. No hacemos perfiles publicitarios.
      </p>

      <h2>Base legal</h2>
      <ul>
        <li>
          <strong>Ejecución del contrato:</strong> para darte el servicio que
          pides al registrarte.
        </li>
        <li>
          <strong>Consentimiento:</strong> para cookies no esenciales y
          analítica de uso. Puedes retirarlo cuando quieras.
        </li>
        <li>
          <strong>Interés legítimo:</strong> para mantener la seguridad de la
          plataforma y prevenir abusos.
        </li>
      </ul>

      <h2>Encargados del tratamiento</h2>
      <p>
        Para hacer funcionar la plataforma nos apoyamos en proveedores que
        actúan como encargados de tratamiento. Todos están sujetos a sus
        propias políticas de protección de datos:
      </p>
      <ul>
        <li>
          <strong>Vercel</strong> — hosting de la aplicación web.
        </li>
        <li>
          <strong>Neon</strong> — base de datos donde se guarda tu cuenta y
          tus pronósticos.
        </li>
        <li>
          <strong>Resend</strong> — envío de correos transaccionales (alta y
          recuperación de contraseña).
        </li>
        <li>
          <strong>Google Analytics</strong> — métricas anónimas de uso (solo
          si aceptas cookies analíticas).
        </li>
      </ul>

      <h2>Conservación</h2>
      <p>
        Guardamos tus datos mientras tu cuenta esté activa. Si quieres que
        borremos tu cuenta y tus datos asociados, escríbenos a{" "}
        <a href="mailto:admin@porrabros.com">admin@porrabros.com</a> y los
        eliminaremos en un plazo máximo de 30 días, salvo que tengamos
        obligación legal de conservarlos durante más tiempo.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Como usuario tienes derecho a acceder, rectificar, suprimir y
        portar tus datos, limitar u oponerte al tratamiento, y a no ser
        objeto de decisiones automatizadas. Para ejercerlos basta con
        escribirnos a{" "}
        <a href="mailto:admin@porrabros.com">admin@porrabros.com</a>.
      </p>
      <p>
        También tienes derecho a presentar una reclamación ante la Agencia
        Española de Protección de Datos (
        <a href="https://www.aepd.es" target="_blank" rel="noreferrer noopener">
          aepd.es
        </a>
        ) si consideras que no hemos atendido tu solicitud correctamente.
      </p>

      <h2>Cambios en esta política</h2>
      <p>
        Si modificamos esta política te avisaremos en la propia web. La
        versión vigente es siempre la que aparece publicada en esta página,
        con la fecha de última actualización indicada al inicio.
      </p>
    </LegalLayout>
  );
}
