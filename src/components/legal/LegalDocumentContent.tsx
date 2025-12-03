import type { LucideIcon } from "lucide-react";
import { ScrollText, ShieldCheck } from "lucide-react";

export type LegalDocumentType = "terms" | "privacy";

interface LegalDocumentMeta {
  title: string;
  icon: LucideIcon;
}

const LEGAL_DOCUMENT_META: Record<LegalDocumentType, LegalDocumentMeta> = {
  terms: {
    title: "Términos y Condiciones",
    icon: ScrollText,
  },
  privacy: {
    title: "Política de Privacidad",
    icon: ShieldCheck,
  },
};

export const getLegalDocumentMeta = (type: LegalDocumentType) =>
  LEGAL_DOCUMENT_META[type];

function TermsContent() {
  return (
    <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          1. Introducción
        </h3>
        <p>
          Bienvenido a Paulownia Game. Al acceder a nuestro sitio web y utilizar
          nuestros servicios, aceptas cumplir con estos términos y condiciones.
          Si no estás de acuerdo con alguna parte de estos términos, no podrás
          acceder al servicio.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          2. Uso del Servicio
        </h3>
        <p>
          Te comprometes a utilizar nuestros servicios solo para fines legales y
          de una manera que no infrinja los derechos de, ni restrinja o inhiba
          el uso y disfrute del servicio por parte de cualquier tercero.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>No debes usar el servicio para actividades fraudulentas.</li>
          <li>
            No debes intentar acceder sin autorización a nuestros sistemas.
          </li>
          <li>
            Respetarás a otros usuarios y no participarás en acoso o abuso.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          3. Propiedad Intelectual
        </h3>
        <p>
          El servicio y su contenido original, características y funcionalidad
          son y seguirán siendo propiedad exclusiva de Paulownia Game y sus
          licenciantes. El servicio está protegido por derechos de autor, marcas
          registradas y otras leyes.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          4. Cuentas de Usuario
        </h3>
        <p>
          Cuando creas una cuenta con nosotros, debes proporcionarnos
          información precisa, completa y actual. El incumplimiento de hacerlo
          constituye una violación de los términos, que puede resultar en la
          terminación inmediata de tu cuenta en nuestro servicio.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          5. Limitación de Responsabilidad
        </h3>
        <p>
          En ningún caso Paulownia Game, ni sus directores, empleados, socios,
          agentes, proveedores o afiliados, serán responsables por cualquier
          daño indirecto, incidental, especial, consecuente o punitivo,
          incluyendo sin limitación, pérdida de beneficios, datos, uso, buena
          voluntad, u otras pérdidas intangibles.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          6. Cambios en los Términos
        </h3>
        <p>
          Nos reservamos el derecho, a nuestra sola discreción, de modificar o
          reemplazar estos términos en cualquier momento. Si una revisión es
          material, intentaremos proporcionar un aviso de al menos 30 días antes
          de que entren en vigor los nuevos términos.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-border/50">
        <p>
          Si tienes alguna pregunta sobre estos Términos, por favor contáctanos
          a través de nuestro soporte.
        </p>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          1. Recopilación de Información
        </h3>
        <p>
          Recopilamos información que nos proporcionas directamente cuando te
          registras en nuestra plataforma, actualizas tu perfil o te comunicas
          con nosotros. Esta información puede incluir tu nombre, dirección de
          correo electrónico y otros datos de contacto.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          2. Uso de la Información
        </h3>
        <p>Utilizamos la información que recopilamos para:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
          <li>Procesar transacciones y enviar notificaciones relacionadas.</li>
          <li>
            Responder a tus comentarios, preguntas y solicitudes de servicio al
            cliente.
          </li>
          <li>Comunicarnos contigo sobre noticias, ofertas y eventos.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          3. Protección de Datos
        </h3>
        <p>
          Tomamos medidas razonables para proteger tu información personal
          contra pérdida, robo, uso indebido y acceso no autorizado,
          divulgación, alteración y destrucción. Sin embargo, ninguna
          transmisión por Internet o almacenamiento electrónico es 100% seguro.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          4. Cookies y Tecnologías Similares
        </h3>
        <p>
          Utilizamos cookies y tecnologías similares para rastrear la actividad
          en nuestro servicio y mantener cierta información. Las cookies son
          archivos con una pequeña cantidad de datos que pueden incluir un
          identificador único anónimo.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          5. Compartir Información
        </h3>
        <p>
          No vendemos ni alquilamos tu información personal a terceros. Podemos
          compartir información genérica agregada no vinculada a ninguna
          información de identificación personal con nuestros socios comerciales
          y anunciantes de confianza.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          6. Tus Derechos
        </h3>
        <p>
          Tienes derecho a acceder, corregir o eliminar tu información personal.
          También puedes oponerte al procesamiento de tus datos, solicitar la
          limitación del procesamiento o solicitar la portabilidad de tus datos.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-border/50">
        <p>
          Si tienes alguna pregunta sobre esta Política de Privacidad, por favor
          contáctanos a través de nuestro soporte.
        </p>
      </section>
    </div>
  );
}

export function LegalDocumentContent({ type }: { type: LegalDocumentType }) {
  if (type === "terms") {
    return <TermsContent />;
  }
  return <PrivacyContent />;
}
