import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

const TITLE = "Términos y condiciones · PorraBros";
const DESCRIPTION =
  "Condiciones de uso de PorraBros: qué puedes hacer en la plataforma, qué te pedimos y dónde están los límites.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/terminos" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalLayout
      kicker="Términos"
      title={<>TÉRMINOS Y CONDICIONES</>}
      updated="22 de mayo de 2026"
    >
      <p>
        Estos términos regulan el uso de <strong>PorraBros</strong>, una
        plataforma online para crear porras de deportes entre amigos. Al
        registrarte o usar la web aceptas lo que pone aquí abajo.
      </p>

      <h2>Qué es PorraBros</h2>
      <p>
        PorraBros es un servicio gratuito que te permite crear grupos
        privados, invitar a otras personas y enviar pronósticos sobre
        partidos de torneos deportivos. La plataforma calcula
        automáticamente el ranking de cada grupo en función de los
        resultados oficiales.
      </p>
      <p>
        <strong>PorraBros no es una plataforma de apuestas.</strong> No
        gestionamos dinero, no hay premios económicos ni intercambios
        monetarios entre usuarios. Cualquier acuerdo paralelo entre
        miembros de un grupo es responsabilidad exclusiva de las personas
        implicadas.
      </p>

      <h2>Cuenta de usuario</h2>
      <ul>
        <li>
          Debes ser mayor de 14 años para registrarte. Si eres menor,
          necesitarás permiso de tus padres o tutores.
        </li>
        <li>
          Eres responsable de mantener tu contraseña segura. Si crees que
          alguien ha accedido a tu cuenta, avísanos cuanto antes.
        </li>
        <li>
          La información que nos das (nombre, email) debe ser veraz. No
          puedes registrarte suplantando a otra persona.
        </li>
        <li>
          Solo puedes tener una cuenta. Crear cuentas duplicadas para hacer
          trampas en una porra es motivo de expulsión.
        </li>
      </ul>

      <h2>Uso aceptable</h2>
      <p>
        Al usar PorraBros te comprometes a no:
      </p>
      <ul>
        <li>Publicar contenido ilegal, ofensivo, discriminatorio o que infrinja derechos de terceros.</li>
        <li>Suplantar a otros usuarios o intentar acceder a porras ajenas sin invitación.</li>
        <li>Usar bots, scrapers o cualquier sistema automatizado para interactuar con la web.</li>
        <li>Intentar romper la seguridad de la plataforma o explotar vulnerabilidades.</li>
        <li>Usar el servicio para apuestas con dinero o cualquier finalidad ilícita.</li>
      </ul>

      <h2>Contenido del usuario</h2>
      <p>
        Los pronósticos, nombres de grupos y demás información que
        introduces son tuyos. Al subirlos a PorraBros nos das una licencia
        no exclusiva para mostrarlos a los demás miembros de tu grupo y
        almacenarlos el tiempo que la cuenta esté activa, con el único fin
        de prestarte el servicio.
      </p>

      <h2>Disponibilidad y limitación de responsabilidad</h2>
      <p>
        PorraBros se ofrece <em>tal cual</em> y <em>según disponibilidad</em>.
        Hacemos lo razonable para que funcione bien, pero no podemos
        garantizar disponibilidad continua, ausencia de errores ni que los
        resultados deportivos cargados sean siempre exactos al minuto.
      </p>
      <p>
        En la medida que permita la ley, no nos hacemos responsables de
        daños indirectos, pérdida de datos o lucro cesante derivados del
        uso de la plataforma. Esto no afecta a los derechos que la
        normativa de consumo te reconoce como usuario.
      </p>

      <h2>Cambios y cancelación</h2>
      <p>
        Podemos actualizar estos términos si cambia la plataforma o la
        normativa aplicable. Si los cambios son sustanciales te lo
        avisaremos en la web. Tu uso continuado tras una actualización
        implica que aceptas la nueva versión.
      </p>
      <p>
        Puedes dejar de usar PorraBros y solicitar el borrado de tu cuenta
        cuando quieras escribiendo a{" "}
        <a href="mailto:hola@porrabros.com">hola@porrabros.com</a>.
        Nos reservamos el derecho a suspender cuentas que incumplan
        gravemente estos términos.
      </p>

      <h2>Ley aplicable</h2>
      <p>
        Estas condiciones se rigen por la ley española. Para cualquier
        controversia, las partes se someten a los Juzgados y Tribunales
        del domicilio del usuario consumidor, conforme a la normativa
        aplicable de defensa de los consumidores y usuarios.
      </p>
    </LegalLayout>
  );
}
