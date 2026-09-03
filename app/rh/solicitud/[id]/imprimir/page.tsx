import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BotonImprimir from "@/components/BotonImprimir";

export default async function ImprimirSolicitudPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar que sea Recursos Humanos
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 2) {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Obtener solicitud
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
      correo,
      tipo_proceso,
      fecha_inicio,
      horario_propuesto,
      informacion_adicional,
      estado
    `)
    .eq("id", id)
    .single();

  if (error || !solicitud) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-red-700">
            No se encontró la solicitud
          </h1>
        </div>
      </main>
    );
  }

  // Obtener asignación autorizada
  const { data: asignacion } = await supabase
    .from("asignaciones")
    .select("id, necesidad_id, estado")
    .eq("solicitud_id", solicitud.id)
    .eq("estado", "Autorizada")
    .maybeSingle();

  // Obtener área asignada
  let area = "Área asignada";

  if (asignacion?.necesidad_id) {
    const { data: necesidad } = await supabase
      .from("necesidades")
      .select("area_id")
      .eq("id", asignacion.necesidad_id)
      .maybeSingle();

    if (necesidad?.area_id) {
      const { data: areaData } = await supabase
        .from("areas")
        .select("nombre")
        .eq("id", necesidad.area_id)
        .maybeSingle();

      area = areaData?.nombre ?? "Área asignada";
    }
  }

  // Formato de fecha día/mes/año
  const fechaInicio = solicitud.fecha_inicio
    ? new Date(
        solicitud.fecha_inicio + "T00:00:00"
      ).toLocaleDateString("es-MX")
    : "";

  // Determinar el tipo de proceso
  const tipoProceso = solicitud.tipo_proceso?.toLowerCase();

  const esServicioSocial = tipoProceso === "servicio social";
  const esPracticas = tipoProceso === "prácticas profesionales";
  const esEstadia = tipoProceso === "estadia" || tipoProceso === "estadía";

  return (
    <>
      {/* Botón */}
      <div className="print:hidden mx-auto max-w-5xl px-6 py-5">
        <BotonImprimir />
      </div>

      {/* DOCUMENTO */}
      <main className="mx-auto w-full max-w-[21cm] bg-white px-[1.2cm] py-[0.8cm] text-[10px] text-black">

        {/* =========================
            ENCABEZADO
        ========================== */}
        <div className="relative">

          {/* Logo institucional */}
          <div className="absolute left-0 top-0">
            <img
              src="/logo-pachuca.jpg"
              alt="Pachuca Capital de la Transformación"
              className="h-[55px] w-auto object-contain"
            />
          </div>

          {/* Fecha */}
          <div className="flex justify-end pt-[5px] text-[10px]">
            Pachuca de Soto, Hidalgo; a ____ de __________ del 20____
          </div>

          <div className="pt-[38px]">
            <h1 className="text-[14px] font-bold uppercase">
              DATOS PERSONALES DE LOS PRESTATARIOS/AS
            </h1>

            {/* Tipo de proceso */}
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

        {/* =========================
            DATOS GENERALES
        ========================== */}
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
              <td className="w-[31%] border border-black px-2 py-[3px]">
                Nombre:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.nombre}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Domicilio Particular:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.domicilio}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Institución Educativa:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.institucion_educativa}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Carrera y semestre:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.carrera} — {solicitud.semestre_cuatrimestre}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                No. de control o matrícula:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.matricula}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Teléfono celular y de casa:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.telefono}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Correo Electrónico:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.correo}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Fecha de Inicio:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {fechaInicio}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Horario propuesto:
              </td>
              <td className="border border-black px-2 py-[3px]">
                {solicitud.horario_propuesto}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] align-top">
                Información Adicional:
              </td>
              <td className="h-[42px] border border-black px-2 py-[3px] align-top">
                {solicitud.informacion_adicional || ""}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Área en la que fue asignado(a):
              </td>
              <td className="border border-black px-2 py-[3px]">
                {area}
              </td>
            </tr>

          </tbody>
        </table>

        {/* =========================
            REFERENCIAS PERSONALES
        ========================== */}
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
              <td className="w-[31%] border border-black px-2 py-[3px] italic">
                Nombre del Papá
              </td>
              <td className="border border-black px-2 py-[3px]">
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] italic">
                Teléfono donde se puede localizar:
              </td>
              <td className="border border-black">
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] italic">
                Nombre de la Mamá
              </td>
              <td className="border border-black">
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] italic">
                Teléfono donde se puede localizar:
              </td>
              <td className="border border-black">
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] italic">
                Nombre del tutor en su caso:
              </td>
              <td className="border border-black">
              </td>
            </tr>

          </tbody>
        </table>

        {/* =========================
            PERSONAS DE EMERGENCIA
        ========================== */}
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
              <td className="w-[31%] border border-black px-2 py-[3px]">
                Nombre y parentesco:
              </td>
              <td className="border border-black">
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] italic">
                Teléfono donde se puede localizar:
              </td>
              <td className="border border-black">
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px]">
                Nombre y parentesco:
              </td>
              <td className="border border-black">
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-[3px] italic">
                Teléfono donde se puede localizar:
              </td>
              <td className="border border-black">
              </td>
            </tr>

          </tbody>
        </table>

        {/* =========================
            RATIFICACIÓN
        ========================== */}
        <p className="mt-2 text-[10px]">
          Ratifico que los datos aquí asentados son verdaderos
        </p>

        {/* =========================
            FIRMA
        ========================== */}
        <div className="mt-5 text-center">
          <div className="mx-auto w-[270px] border-b border-black">
            &nbsp;
          </div>

          <p className="mt-1 text-[10px] font-bold">
            Nombre y Firma del Prestatorio/a
          </p>
        </div>

        {/* =========================
            AVISO DE PRIVACIDAD
        ========================== */}
        <section className="mt-4 text-center">

          <h3 className="text-[10px] font-bold">
            AVISO DE PRIVACIDAD
          </h3>

          <p className="mt-1 text-justify text-[7px] leading-[1.25]">
            De conformidad con lo dispuesto en el articulo 36 de la Ley de
            Protección de Datos Personales en Posesión de los Sujetos Obligados
            para el Estado de Hidalgo ei Departamento de Capacitación,
            dependiente de la Dirección de Recursos Humanos: será la responsable
            del uso, protección y tratamiento de sus datos personales. el uso de
            la información solicitada es para proveerle los servicios de
            localización del o la alumna, en caso de extravio, aclaraciones,
            omisiones o accidente. De requerinse hacer alguna transferencia de
            sus datos personales, para otro fin, se solicitară de su
            consentimiento y se le hará saber la fralidad del mano, Asimismo
          </p>

          <p className="mt-1 text-justify text-[7px] leading-[1.25]">
            usted podra hacer valer sus derechos de accese, rectificación,
            cancelación u oposición (ARCO) ante la Unidad de Tra ransparencia,
            ubicada en Calle M. Vila 115. Dodra Primer pleo, Colonia Centro de
            esta Cudad, con correo electrónico lappaстика дов, ми у поmero
            telefónico (771) 6.88.11.61
          </p>

          <p className="mt-1 text-justify text-[7px] leading-[1.25]">
            Usted podrá consultar el Aviso de Privacidad Integral en is página
            del municipio www.pachuca.gob.mx, asi como en la Unidad de
            Transparencia.
          </p>

        </section>

      </main>

      {/* =========================
          ESTILOS DE IMPRESIÓN
      ========================== */}
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
        }
      `}</style>
    </>
  );
}