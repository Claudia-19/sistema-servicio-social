import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const instant = false;

export default async function CartaConfidencialidadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener la solicitud más reciente del alumno
  const { data: solicitud } = await supabase
    .from("solicitudes")
    .select(`
      id,
      nombre,
      apellido_paterno,
      apellido_materno,
      institucion_educativa,
      tipo_proceso
    `)
    .eq("usuario_id", user.id)
    .order("fecha_solicitud", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!solicitud) {
    redirect("/alumno");
  }

  // Obtener la asignación autorizada
  const { data: asignacion } = await supabase
    .from("asignaciones")
    .select("id, necesidad_id, estado")
    .eq("solicitud_id", solicitud.id)
    .eq("estado", "Autorizada")
    .maybeSingle();

  if (!asignacion) {
    redirect("/alumno");
  }

  // Obtener nivel académico de la vacante asignada
  const { data: necesidad } = await supabase
    .from("necesidades")
    .select("nivel_academico")
    .eq("id", asignacion.necesidad_id)
    .maybeSingle();

  const nivelAcademico =
    necesidad?.nivel_academico || "________________";

  // Obtener el área mediante la función segura para el alumno
  const { data: areaAsignada } = await supabase.rpc(
    "obtener_area_asignada"
  );

  const nombreArea =
    areaAsignada || "_______________________________";

  const nombreCompleto = [
    solicitud.nombre,
    solicitud.apellido_paterno,
    solicitud.apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");

  const institucion =
    solicitud.institucion_educativa ||
    "_______________________________";

  const tipoProceso =
    solicitud.tipo_proceso || "________________";

  return (
    <>
      <main className="min-h-screen bg-gray-200 py-8 print:min-h-0 print:bg-white print:py-0">
        <div className="mx-auto min-h-[11in] w-[8.5in] bg-white px-[0.75in] py-[0.55in] shadow-lg print:mx-0 print:w-[8.5in] print:min-h-[11in] print:px-[0.75in] print:py-[0.55in] print:shadow-none">

          {/* ENCABEZADO */}
          <header className="text-center">
            <div className="flex items-start justify-center">
              <img
                src="/logo-pachuca.png"
                alt="Pachuca Capital de la Transformación"
                className="h-[88px] w-auto object-contain"
              />
            </div>

            <div className="mt-3">
              <p className="text-[15px] font-bold leading-tight text-gray-800">
                DEPARTAMENTO DE PROFESIONALIZACIÓN
              </p>

              <p className="mt-1 text-[16px] font-bold leading-tight text-gray-800">
                CARTA DE CONFIDENCIALIDAD
              </p>
            </div>
          </header>

          {/* CONTENIDO */}
          <section className="mt-[52px] text-[14px] leading-[1.75] text-gray-800">

            <p className="text-justify">
              Por medio de la presente, el(la) que suscribe C.{" "}
              <span className="font-semibold">
                {nombreCompleto ||
                  "________________________________________"}
              </span>
              , en mi calidad de estudiante de{" "}
              <span className="font-semibold">
                {nivelAcademico}
              </span>{" "}
              en{" "}
              <span className="font-semibold">
                {institucion}
              </span>
              , realizando trámite de{" "}
              <span className="font-semibold">
                {tipoProceso}
              </span>{" "}
              en la Presidencia Municipal de Pachuca de Soto Hidalgo, en el
              área de{" "}
              <span className="font-semibold">
                {nombreArea}
              </span>
              , y con fundamento en la{" "}
              <strong>
                Ley Federal de Protección de Datos Personales en Posesión de
                los Particulares (LFPDPPP), artículos 2 fracción XVII, 6, 20
                y demás disposiciones aplicables,
              </strong>{" "}
              me comprometo a:
            </p>

            {/* PUNTO 1 */}
            <div className="mt-6 flex gap-3">
              <span className="font-semibold">
                1.
              </span>

              <p className="text-justify">
                <strong>
                  Observar los principios de protección de datos personales,
                </strong>{" "}
                incluyendo licitud, consentimiento, información, calidad,
                finalidad, lealtad, proporcionalidad y responsabilidad.
              </p>
            </div>

            {/* PUNTO 2 */}
            <div className="mt-3 flex gap-3">
              <span className="font-semibold">
                2.
              </span>

              <p className="text-justify">
                <strong>
                  Guardar confidencialidad
                </strong>{" "}
                de toda información de terceros a la que tenga acceso durante
                mi{" "}
                <span className="font-semibold">
                  {tipoProceso}
                </span>
                , y no divulgarla, transferirla ni usarla para fines distintos
                a los autorizados por la institución.
              </p>
            </div>

            {/* PUNTO 3 */}
            <div className="mt-3 flex gap-3">
              <span className="font-semibold">
                3.
              </span>

              <p className="text-justify">
                <strong>
                  Aplicar medidas de seguridad
                </strong>{" "}
                para proteger la información, evitando su pérdida, acceso no
                autorizado o uso indebido.
              </p>
            </div>

            {/* DECLARACIÓN */}
            <p className="mt-7 text-justify">
              Declaro conocer que el{" "}
              <strong>
                incumplimiento de lo antes descrito de confidencialidad
              </strong>{" "}
              podrá derivar en{" "}
              <strong>
                sanciones administrativas,
              </strong>{" "}
              además de las consecuencias legales que establezca la Ley
              Federal De Protección De Datos Personales En Posesión De Los
              Particulares, Capítulo II, Artículo 6.
            </p>
          </section>

          {/* FIRMA */}
          <section className="mt-[105px] text-center">
            <div className="mx-auto w-[5.1in] border-b border-dashed border-gray-700" />

            <p className="mt-3 text-[14px] text-gray-800">
              Nombre, fecha y firma del estudiante
            </p>
          </section>

          {/* DOMICILIO */}
          <footer className="mt-[42px] flex justify-end">
            <div className="text-right text-[10px] leading-[1.45] text-gray-700">
              <p>Calle Hidalgo #303</p>
              <p>Colonia Centro C.P. 42000;</p>
              <p>Pachuca de Soto; Hgo.</p>
            </div>
          </footer>
        </div>
      </main>

      {/* BOTONES */}
      <div className="fixed bottom-6 right-6 print:hidden">
        <div className="flex gap-3">
          <a
            href="/alumno"
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-lg transition hover:bg-gray-50"
          >
            Regresar
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-[#621132] px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#9D2449]"
          >
            Imprimir carta
          </button>
        </div>
      </div>

      {/* ESTILOS DE IMPRESIÓN */}
      <style>{`
        @page {
          size: Letter;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}