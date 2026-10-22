import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BotonImprimir from "@/components/BotonImprimir";

export const instant = false;

export default async function ImprimirSolicitudAlumnoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: solicitud, error } = await supabase
    .from("solicitudes")
    .select(`
      id,
      nombre,
      domicilio,
      institucion_educativa,
      carrera,
      semestre_cuatrimestre,
      matricula,
      telefono,
      telefono_casa,
      correo,
      tipo_proceso,
      fecha_solicitud,
      fecha_inicio,
      horario_propuesto,
      informacion_adicional,
      estado,
      fotografia_url,
      nombre_papa,
      telefono_papa,
      nombre_mama,
      telefono_mama,
      nombre_tutor,
      telefono_tutor,
      emergencia_1_nombre,
      emergencia_1_parentesco,
      emergencia_1_telefono,
      emergencia_2_nombre,
      emergencia_2_parentesco,
      emergencia_2_telefono
    `)
    .eq("usuario_id", user.id)
    .order("fecha_solicitud", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !solicitud) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border border-dorado-claro bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-vino-oscuro">
            No se encontró la solicitud
          </h1>

          <p className="mt-2 text-sm text-gris-oscuro">
            No tienes una solicitud registrada para generar el formato oficial.
          </p>

          <a
            href="/alumno"
            className="mt-5 inline-block rounded-lg bg-vino-oscuro px-5 py-2.5 text-sm font-medium text-white transition hover:bg-vino-claro"
          >
            Regresar al panel
          </a>
        </div>
      </main>
    );
  }

  // ============================================================
  // OBTENER FOTO DEL ALUMNO
  // ============================================================

  let fotografiaUrl: string | null = null;

  if (solicitud.fotografia_url) {
    const fotografia = solicitud.fotografia_url;

    if (
      fotografia.startsWith("http://") ||
      fotografia.startsWith("https://")
    ) {
      fotografiaUrl = fotografia;
    } else {
      const { data: signedPhoto } = await supabase.storage
        .from("fotos-alumnos")
        .createSignedUrl(fotografia, 60 * 60);

      fotografiaUrl = signedPhoto?.signedUrl ?? null;
    }
  }

  // ============================================================
  // OBTENER ASIGNACIÓN AUTORIZADA
  // ============================================================

  const { data: asignacion } = await supabase
    .from("asignaciones")
    .select("id, necesidad_id, estado")
    .eq("solicitud_id", solicitud.id)
    .eq("estado", "Autorizada")
    .maybeSingle();

  // ============================================================
  // OBTENER ÁREA DE ADSCRIPCIÓN Y ÁREA ASIGNADA
  // ============================================================

  let area = "Área asignada";

  if (asignacion?.necesidad_id) {
    const { data: necesidad } = await supabase
      .from("necesidades")
      .select("area_id, area_asignada")
      .eq("id", asignacion.necesidad_id)
      .maybeSingle();

    if (necesidad?.area_id) {
      const { data: areaData } = await supabase
        .from("areas")
        .select("nombre")
        .eq("id", necesidad.area_id)
        .maybeSingle();

      const nombreArea = areaData?.nombre ?? "";
      const areaAsignada = necesidad.area_asignada?.trim() ?? "";

      if (nombreArea && areaAsignada) {
        area = `${nombreArea} — ${areaAsignada}`;
      } else if (nombreArea) {
        area = nombreArea;
      } else if (areaAsignada) {
        area = areaAsignada;
      }
    } else if (necesidad?.area_asignada?.trim()) {
      area = necesidad.area_asignada.trim();
    }
  }

  // ============================================================
  // FECHA DE INICIO
  // ============================================================

  const fechaInicio = solicitud.fecha_inicio
    ? new Date(
        solicitud.fecha_inicio + "T00:00:00"
      ).toLocaleDateString("es-MX")
    : "";

  // ============================================================
  // FECHA DE SOLICITUD
  // ============================================================

  const fechaSolicitud = solicitud.fecha_solicitud
    ? new Date(solicitud.fecha_solicitud).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // ============================================================
  // TIPO DE PROCESO
  // ============================================================

  const tipoProceso = solicitud.tipo_proceso?.toLowerCase();

  const esServicioSocial =
    tipoProceso === "servicio social";

  const esPracticas =
    tipoProceso === "prácticas profesionales";

  const esEstadia =
    tipoProceso === "estadia" ||
    tipoProceso === "estadía";

  return (
    <>
      {/* ========================================================
          BOTONES
      ========================================================= */}

      <div className="print:hidden mx-auto max-w-5xl px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <a
            href="/alumno"
            className="rounded-lg border border-[#707272]/40 bg-white px-5 py-3 text-sm font-medium text-gris-oscuro transition hover:bg-[#D4C29C]/20 hover:text-vino-oscuro"
          >
            ← Regresar al panel
          </a>

          <BotonImprimir />
        </div>
      </div>

      {/* ========================================================
          DOCUMENTO
      ========================================================= */}

      <main className="mx-auto w-full max-w-[21cm] bg-white px-[1.2cm] py-[0.8cm] text-[10px] text-black">

        {/* ======================================================
            ENCABEZADO
        ======================================================= */}

        <div className="relative min-h-[105px]">

          {/* LOGO PACHUCA */}

          <div className="absolute left-0 top-0">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la Transformación"
              className="h-[70px] w-auto object-contain"
            />
          </div>

          {/* FOTO DEL ALUMNO */}

          <div className="absolute right-0 top-0 flex h-[105px] w-[82px] items-start justify-center">
            {fotografiaUrl ? (
              <img
                src={fotografiaUrl}
                alt={`Fotografía de ${solicitud.nombre}`}
                className="h-[105px] w-[82px] rounded-none border border-black object-cover"
              />
            ) : (
              <div className="flex h-[105px] w-[82px] items-center justify-center border border-black text-center text-[8px] text-gray-500">
                Sin fotografía
              </div>
            )}
          </div>

          {/* FECHA */}

          <div className="flex justify-end pt-[72px] pr-[95px] text-[10px]">
            Pachuca de Soto, Hidalgo; a{" "}
            {fechaSolicitud || "____ de __________ del 20____"}
          </div>

          {/* TÍTULO */}

          <div className="pt-[8px]">
            <h1 className="text-[14px] font-bold uppercase">
              DATOS PERSONALES DE LOS PRESTATARIOS/AS
            </h1>

            {/* TIPO DE PROCESO */}

            <div className="mt-3 flex items-center gap-5 text-[10px]">

              <div className="flex items-center gap-1">
                <span className="inline-block h-[14px] w-[14px] border border-black">
                  {esServicioSocial ? "✓" : ""}
                </span>

                <span>Servicio Social</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="inline-block h-[14px] w-[14px] border border-black">
                  {esPracticas ? "✓" : ""}
                </span>

                <span>Prácticas Profesionales</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="inline-block h-[14px] w-[14px] border border-black">
                  {esEstadia ? "✓" : ""}
                </span>

                <span>Estadía</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="inline-block h-[14px] w-[14px] border border-black">
                </span>

                <span>Otro:</span>

                <span className="inline-block w-[70px] border-b border-black">
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* ======================================================
            DATOS GENERALES
        ======================================================= */}

        <table className="mt-3 w-full border-collapse border border-black">
          <thead>
            <tr>
              <th
                colSpan={2}
                className="border border-black bg-gray-200 py-1 text-center text-[11px] font-bold"
              >
                Datos Generales
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="w-[31%] border border-black px-2 py-[3px] font-bold">
                Nombre:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.nombre}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Domicilio Particular:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.domicilio}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Institución Educativa:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.institucion_educativa}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Carrera y semestre:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.carrera} — {solicitud.semestre_cuatrimestre}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                No. de control o matrícula:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.matricula}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Teléfono celular y de casa:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.telefono}
                {solicitud.telefono_casa
                  ? ` / ${solicitud.telefono_casa}`
                  : ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Correo Electrónico:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.correo}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Fecha de Inicio:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {fechaInicio}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Horario propuesto:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.horario_propuesto}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] align-top font-bold">
                Información Adicional:
              </td>

              <td className="h-[42px] border border-black px-2 py-[3px] align-top">
                {solicitud.informacion_adicional || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Área en la que fue asignado(a):
              </td>

              <td className="border border-black px-2 py-[3px]">
                {area}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ======================================================
            REFERENCIAS PERSONALES
        ======================================================= */}

        <table className="mt-2 w-full border-collapse border border-black">
          <thead>
            <tr>
              <th
                colSpan={2}
                className="border border-black bg-gray-200 py-1 text-center text-[11px] font-bold"
              >
                Referencias Personales
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="w-[31%] border border-black px-2 py-[3px] font-bold">
                Nombre del Papá
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.nombre_papa || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Teléfono donde se puede localizar:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.telefono_papa || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Nombre de la Mamá
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.nombre_mama || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Teléfono donde se puede localizar:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.telefono_mama || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Nombre del tutor en su caso:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.nombre_tutor || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Teléfono donde se puede localizar:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.telefono_tutor || ""}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ======================================================
            PERSONAS DE EMERGENCIA
        ======================================================= */}

        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th
                colSpan={2}
                className="border border-black bg-gray-200 py-1 text-center text-[11px] font-bold"
              >
                Personas a quien avisarles en caso de un accidente
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="w-[31%] border border-black px-2 py-[3px] font-bold">
                Nombre y parentesco:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.emergencia_1_nombre &&
                solicitud.emergencia_1_parentesco
                  ? `${solicitud.emergencia_1_nombre} — ${solicitud.emergencia_1_parentesco}`
                  : solicitud.emergencia_1_nombre || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Teléfono donde se puede localizar:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.emergencia_1_telefono || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Nombre y parentesco:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.emergencia_2_nombre &&
                solicitud.emergencia_2_parentesco
                  ? `${solicitud.emergencia_2_nombre} — ${solicitud.emergencia_2_parentesco}`
                  : solicitud.emergencia_2_nombre || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">
                Teléfono donde se puede localizar:
              </td>

              <td className="border border-black px-2 py-[3px]">
                {solicitud.emergencia_2_telefono || ""}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ======================================================
            RATIFICACIÓN
        ======================================================= */}

        <p className="mt-2 text-[10px]">
          Ratifico que los datos aquí asentados son verdaderos
        </p>

        {/* ======================================================
            FIRMA
        ======================================================= */}

        <div className="mt-5 text-center">
          <div className="mx-auto w-[270px] border-b border-black">
            &nbsp;
          </div>

          <p className="mt-1 text-[10px] font-bold">
            Nombre y Firma del Prestatorio/a
          </p>
        </div>

        {/* ======================================================
            AVISO DE PRIVACIDAD
        ======================================================= */}

        <section className="mt-4 text-center">
          <h3 className="text-[10px] font-bold">
            AVISO DE PRIVACIDAD
          </h3>

          <p className="mt-1 text-justify text-[7px] leading-[1.25]">
            De conformidad con lo dispuesto en el articulo 38 de la Ley de
            Protección de Datos Personales en Posesión de los Sujetos
            Obligados para el Estado de Hidalgo, el Departamento de
            Capacitación, dependiente de la Dirección de Recursos Humanos;
            será la responsable del uso, protección y tratamiento de sus
            datos personales, el uso de la información solicitada es para
            proveerle los servicios de localización del o la alumna, en caso
            de extravio, aclaraciones, omisiones o accidente. De requerirse
            hacer alguna transferencia de sus datos personales, para otro
            fin, se solicitará de su consentimiento y se le hará saber la
            finalidad del mismo, Asimismo usted podrá hacer valer sus
            derechos de acceso, rectificación, cancelación u oposición
            (ARCO) ante la Unidad de Transparencia, ubicada en Calle M.
            Vila 115. Primer piso, Colonia Centro de esta Cuidad, con
            correo electrónico uiap@pachuca.gob.mx; y número telefónico
            (771) 6.88.11.61 Usted podrá consultar el Aviso de Privacidad
            Integral en la página del municipio www.pachuca.gob.mx, así como
            en la Unidad de Transparencia.
          </p>
        </section>
      </main>

      {/* ========================================================
          ESTILOS DE IMPRESIÓN
      ========================================================= */}

      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.7cm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          main {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          table {
            page-break-inside: avoid;
          }

          section,
          div {
            page-break-inside: avoid;
          }

          img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}