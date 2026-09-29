export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ActivarAlumno from "./acciones/ActivarAlumno";
import RegistrarHoras from "./acciones/RegistrarHoras";
import FinalizarAlumno from "./acciones/FinalizarAlumno";
import DarBajaAlumno from "./acciones/DarBajaAlumno";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SeguimientoAlumnoPage({
  params,
}: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // VERIFICAR USUARIO RH
  // =========================================================

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, apellido_paterno, apellido_materno, rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 2) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const asignacionId = Number(id);

  if (!Number.isInteger(asignacionId)) {
    redirect("/rh/alumnos-activos");
  }

  // =========================================================
  // 1. ASIGNACIÓN
  // =========================================================

  const { data: asignacion, error: errorAsignacion } =
    await supabase
      .from("asignaciones")
      .select(`
        id,
        solicitud_id,
        necesidad_id,
        estado,
        estado_prestacion,
        fecha_autorizacion,
        fecha_activacion,
        fecha_termino,
        fecha_baja,
        motivo_baja,
        folio_acta_baja,
        observaciones,
        horas_requeridas
      `)
      .eq("id", asignacionId)
      .maybeSingle();

  if (errorAsignacion || !asignacion) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b border-[#621132] bg-[#621132]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la Transformación"
              className="h-16 w-auto object-contain"
            />

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {usuario.nombre} {usuario.apellido_paterno}
                </p>

                <p className="text-xs text-white/80">
                  DIRECCIÓN GENERAL DE RECURSOS HUMANOS
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/rh/alumnos-activos"
            className="text-sm font-medium text-[#9D2449] hover:text-[#621132]"
          >
            ← Regresar a estudiantes activos
          </Link>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              No se encontró la asignación.
            </p>

            <p className="mt-1 text-sm">
              La asignación solicitada no existe o ya no está disponible.
            </p>

            {errorAsignacion && (
              <p className="mt-3 text-xs">
                {errorAsignacion.message}
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // 2. SOLICITUD
  // =========================================================

  const { data: solicitud } = await supabase
    .from("solicitudes")
    .select(`
      id,
      nombre,
      matricula,
      domicilio,
      institucion_educativa,
      carrera,
      semestre_cuatrimestre,
      telefono,
      correo,
      tipo_proceso,
      fecha_inicio,
      horario_propuesto,
      informacion_adicional
    `)
    .eq("id", asignacion.solicitud_id)
    .maybeSingle();

  // =========================================================
  // 3. NECESIDAD
  // =========================================================

  const { data: necesidad } = await supabase
    .from("necesidades")
    .select(`
      id,
      area_id,
      perfil_requerido,
      actividad_1,
      actividad_2,
      actividad_3,
      horario,
      jefe_inmediato,
      area_asignada
    `)
    .eq("id", asignacion.necesidad_id)
    .maybeSingle();

  // =========================================================
  // 4. SECRETARÍA
  // =========================================================

  let area: { nombre: string } | null = null;

  if (necesidad?.area_id) {
    const { data: areaData } = await supabase
      .from("areas")
      .select("nombre")
      .eq("id", necesidad.area_id)
      .maybeSingle();

    area = areaData;
  }

  // =========================================================
  // 5. NOMBRE DEL ESTUDIANTE
  // =========================================================

  const nombreCompleto =
    solicitud?.nombre || "No registrado";

  // =========================================================
  // 6. HORAS
  // =========================================================

  const { data: registrosHoras } = await supabase
    .from("registro_horas")
    .select(`
      id,
      anio,
      mes,
      horas,
      observaciones,
      created_at
    `)
    .eq("asignacion_id", asignacion.id)
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  const horasAcumuladas = (registrosHoras ?? []).reduce(
    (total, registro) =>
      total + Number(registro.horas ?? 0),
    0
  );

  // =========================================================
  // 7. PROGRESO
  // =========================================================

  const horasRequeridas =
    asignacion.horas_requeridas !== null
      ? Number(asignacion.horas_requeridas)
      : null;

  const horasRestantes =
    horasRequeridas !== null
      ? Math.max(horasRequeridas - horasAcumuladas, 0)
      : null;

  const porcentajeProgreso =
    horasRequeridas !== null && horasRequeridas > 0
      ? Math.min(
          (horasAcumuladas / horasRequeridas) * 100,
          100
        )
      : 0;

  const horasCompletadas =
    horasRequeridas !== null &&
    horasAcumuladas >= horasRequeridas;

  // =========================================================
  // 8. MESES
  // =========================================================

  const nombresMeses = [
    "",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  // =========================================================
  // 9. FORMATEAR FECHAS
  // =========================================================

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "No registrada";

    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // =========================================================
  // 10. INTERFAZ
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ENCABEZADO */}
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

          <div className="flex items-center">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la Transformación"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {usuario.nombre} {usuario.apellido_paterno}
              </p>

              <p className="text-xs text-white/80">
                DIRECCIÓN GENERAL DE RECURSOS HUMANOS
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-7xl px-6 py-10">

        <Link
          href="/rh/alumnos-activos"
          className="text-sm font-medium text-[#9D2449] hover:text-[#621132]"
        >
          ← Regresar a estudiantes activos
        </Link>

        {/* TÍTULO */}
        <div className="mt-6 mb-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Recursos Humanos
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#621132]">
            Seguimiento del alumno
          </h1>

          <p className="mt-2 text-gray-600">
            Consulta la información de la asignación, estado de la
            prestación y horas acumuladas.
          </p>

        </div>

        {/* INFORMACIÓN PRINCIPAL */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ESTUDIANTE */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm lg:col-span-2">

            <h2 className="border-b border-gray-100 pb-4 text-lg font-semibold text-[#621132]">
              Información del estudiante
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Nombre completo
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {nombreCompleto}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Matrícula
                </p>

                <p className="mt-1 text-gray-800">
                  {solicitud?.matricula || "No registrada"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Institución educativa
                </p>

                <p className="mt-1 text-gray-800">
                  {solicitud?.institucion_educativa ||
                    "No registrada"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Carrera
                </p>

                <p className="mt-1 text-gray-800">
                  {solicitud?.carrera || "No registrada"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Semestre / Cuatrimestre
                </p>

                <p className="mt-1 text-gray-800">
                  {solicitud?.semestre_cuatrimestre ||
                    "No registrado"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Tipo de proceso
                </p>

                <p className="mt-1 text-gray-800">
                  {solicitud?.tipo_proceso || "No registrado"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Teléfono
                </p>

                <p className="mt-1 text-gray-800">
                  {solicitud?.telefono || "No registrado"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Correo electrónico
                </p>

                <p className="mt-1 break-all text-gray-800">
                  {solicitud?.correo || "No registrado"}
                </p>
              </div>

            </div>
          </div>

          {/* ESTADO */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">

            <h2 className="border-b border-gray-100 pb-4 text-lg font-semibold text-[#621132]">
              Estado de la prestación
            </h2>

            <div className="mt-5">

              <span
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${
                  asignacion.estado_prestacion ===
                  "Pendiente de activación"
                    ? "border-yellow-200 bg-yellow-100 text-yellow-800"
                    : asignacion.estado_prestacion === "Activa"
                    ? "border-green-200 bg-green-100 text-green-800"
                    : asignacion.estado_prestacion === "Finalizada"
                    ? "border-blue-200 bg-blue-100 text-blue-800"
                    : asignacion.estado_prestacion === "Dada de baja"
                    ? "border-red-200 bg-red-100 text-red-800"
                    : "border-gray-200 bg-gray-100 text-gray-700"
                }`}
              >
                {asignacion.estado_prestacion}
              </span>

              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Fecha de activación
                  </p>

                  <p className="mt-1 text-gray-800">
                    {formatearFecha(
                      asignacion.fecha_activacion
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Fecha de término
                  </p>

                  <p className="mt-1 text-gray-800">
                    {formatearFecha(
                      asignacion.fecha_termino
                    )}
                  </p>
                </div>

                {asignacion.estado_prestacion === "Dada de baja" && (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">
                        Fecha de baja
                      </p>

                      <p className="mt-1 text-gray-800">
                        {formatearFecha(
                          asignacion.fecha_baja
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">
                        Motivo de baja
                      </p>

                      <p className="mt-1 text-gray-800">
                        {asignacion.motivo_baja ||
                          "No registrado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">
                        Número de oficio de baja de la dependencia
                      </p>

                      <p className="mt-1 font-medium text-[#621132]">
                        {asignacion.folio_acta_baja ||
                          "No registrado"}
                      </p>
                    </div>
                  </>
                )}

              </div>

              {/* ACTIVAR */}
              {asignacion.estado_prestacion ===
                "Pendiente de activación" && (
                <ActivarAlumno
                  asignacionId={asignacion.id}
                />
              )}

              {/* DAR DE BAJA */}
              {asignacion.estado_prestacion === "Activa" && (
                <div className="mt-5 border-t border-gray-100 pt-5">

                  <p className="mb-3 text-xs font-medium uppercase text-gray-400">
                    Acciones del estado
                  </p>

                  <DarBajaAlumno
                    asignacionId={asignacion.id}
                    nombreAlumno={nombreCompleto}
                  />

                </div>
              )}

            </div>
          </div>

        </div>

        {/* ASIGNACIÓN */}
        <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">

          <h2 className="border-b border-gray-100 pb-4 text-lg font-semibold text-[#621132]">
            Información de la asignación
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Secretaría
              </p>

              <p className="mt-1 text-gray-800">
                {area?.nombre || "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Área asignada
              </p>

              <p className="mt-1 text-gray-800">
                {necesidad?.area_asignada ||
                  "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Jefe inmediato
              </p>

              <p className="mt-1 text-gray-800">
                {necesidad?.jefe_inmediato ||
                  "No registrado"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Horario
              </p>

              <p className="mt-1 text-gray-800">
                {necesidad?.horario || "No registrado"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase text-gray-400">
                Perfil requerido
              </p>

              <p className="mt-1 text-gray-800">
                {necesidad?.perfil_requerido ||
                  "No registrado"}
              </p>
            </div>

          </div>
        </div>

        {/* HORAS */}
        <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white shadow-sm">

          <div className="border-b border-[#D4C29C] px-6 py-5">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="font-semibold text-[#621132]">
                  Control de horas
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Registro mensual de horas reportadas por la Secretaría.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">

                <div className="rounded-lg bg-gray-50 px-5 py-3 text-center">
                  <p className="text-xs font-medium text-[#707272]">
                    Requeridas
                  </p>

                  <p className="text-xl font-bold text-[#621132]">
                    {horasRequeridas !== null
                      ? `${horasRequeridas} h`
                      : "No definidas"}
                  </p>
                </div>

                <div className="rounded-lg bg-[#D4C29C]/30 px-5 py-3 text-center">
                  <p className="text-xs font-medium text-[#707272]">
                    Acumuladas
                  </p>

                  <p className="text-xl font-bold text-[#621132]">
                    {horasAcumuladas} h
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 px-5 py-3 text-center">
                  <p className="text-xs font-medium text-[#707272]">
                    Restantes
                  </p>

                  <p className="text-xl font-bold text-[#621132]">
                    {horasRestantes !== null
                      ? `${horasRestantes} h`
                      : "No definidas"}
                  </p>
                </div>

                {asignacion.estado_prestacion === "Activa" && (
                  <RegistrarHoras
                    asignacionId={asignacion.id}
                  />
                )}

              </div>

            </div>

            {/* PROGRESO */}
            {horasRequeridas !== null &&
              horasRequeridas > 0 && (
                <div className="mt-6">

                  <div className="mb-2 flex items-center justify-between">

                    <p className="text-sm font-medium text-gray-700">
                      Progreso de horas
                    </p>

                    <p className="text-sm font-semibold text-[#621132]">
                      {porcentajeProgreso.toFixed(1)}%
                    </p>

                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">

                    <div
                      className={`h-full rounded-full transition-all ${
                        horasCompletadas
                          ? "bg-green-600"
                          : "bg-[#9D2449]"
                      }`}
                      style={{
                        width: `${porcentajeProgreso}%`,
                      }}
                    />

                  </div>

                  <div className="mt-2 flex justify-between text-xs text-gray-500">

                    <span>
                      {horasAcumuladas} h acumuladas
                    </span>

                    <span>
                      {horasRequeridas} h requeridas
                    </span>

                  </div>

                  {horasCompletadas && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">

                      <p className="text-sm font-semibold text-green-700">
                        🟢 El alumno ya completó las horas requeridas.
                      </p>

                      {asignacion.estado_prestacion === "Activa" && (
                        <div className="mt-4">
                          <FinalizarAlumno
                            asignacionId={asignacion.id}
                            nombreAlumno={nombreCompleto}
                          />
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

          </div>

          {/* HISTORIAL DE HORAS */}
          {(registrosHoras ?? []).length === 0 ? (

            <div className="p-10 text-center">

              <p className="font-medium text-gray-700">
                No hay horas registradas.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Las horas mensuales aparecerán aquí cuando RH las
                capture.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                  <tr>

                    <th className="px-6 py-4">
                      Mes
                    </th>

                    <th className="px-6 py-4">
                      Año
                    </th>

                    <th className="px-6 py-4">
                      Horas
                    </th>

                    <th className="px-6 py-4">
                      Observaciones
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {(registrosHoras ?? []).map((registro) => (

                    <tr key={registro.id}>

                      <td className="px-6 py-4 font-medium text-gray-800">
                        {nombresMeses[registro.mes] ||
                          registro.mes}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {registro.anio}
                      </td>

                      <td className="px-6 py-4 font-semibold text-[#621132]">
                        {Number(registro.horas)} h
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {registro.observaciones ||
                          "Sin observaciones"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* REGRESAR */}
        <div className="mt-8 flex justify-end">

          <Link
            href="/rh/alumnos-activos"
            className="rounded-lg border border-[#621132] px-5 py-2.5 text-sm font-medium text-[#621132] transition hover:bg-[#621132] hover:text-white"
          >
            Regresar
          </Link>

        </div>

      </section>
    </main>
  );
}