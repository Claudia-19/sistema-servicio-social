import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export const instant = false;

export default async function ControlHorasAlumnoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // 1. DATOS DEL USUARIO
  // =========================================================

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, apellido_paterno, apellido_materno, rol_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!usuario) {
    redirect("/dashboard");
  }

  // =========================================================
  // 2. SOLICITUD DEL ALUMNO
  // =========================================================

  const { data: solicitud } = await supabase
    .from("solicitudes")
    .select(`
      id,
      nombre,
      matricula,
      carrera,
      institucion_educativa,
      tipo_proceso,
      estado
    `)
    .eq("usuario_id", user.id)
    .order("fecha_solicitud", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!solicitud) {
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
                  Estudiante
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-6 py-10">
          <Link
            href="/alumno"
            className="text-sm font-medium text-[#9D2449] hover:text-[#621132]"
          >
            ← Regresar al panel
          </Link>

          <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#621132]">
              No hay una solicitud registrada
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Primero debes registrar una solicitud para consultar el
              control de horas.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // 3. BUSCAR ASIGNACIÓN AUTORIZADA
  // =========================================================

  const { data: asignacion } = await supabase
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
      horas_requeridas
    `)
    .eq("solicitud_id", solicitud.id)
    .eq("estado", "Autorizada")
    .order("fecha_autorizacion", { ascending: false })
    .limit(1)
    .maybeSingle();

  // =========================================================
  // 4. SI TODAVÍA NO TIENE ASIGNACIÓN
  // =========================================================

  if (!asignacion) {
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
                  Estudiante
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-6 py-10">
          <Link
            href="/alumno"
            className="text-sm font-medium text-[#9D2449] hover:text-[#621132]"
          >
            ← Regresar al panel
          </Link>

          <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#D4C29C]/30 text-xl">
                ⏱️
              </div>

              <div>
                <h1 className="text-xl font-bold text-[#621132]">
                  Control de horas
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Aún no tienes una asignación autorizada. El control
                  de horas estará disponible cuando Recursos Humanos
                  registre y autorice tu asignación.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // 5. NECESIDAD / ÁREA ASIGNADA
  // =========================================================

  const { data: necesidad } = await supabase
    .from("necesidades")
    .select(`
      id,
      area_id,
      area_asignada,
      horario,
      jefe_inmediato
    `)
    .eq("id", asignacion.necesidad_id)
    .maybeSingle();

  // =========================================================
  // 6. SECRETARÍA
  // =========================================================

  let secretaria: string | null = null;

  if (necesidad?.area_id) {
    const { data: area } = await supabase
      .from("areas")
      .select("nombre")
      .eq("id", necesidad.area_id)
      .maybeSingle();

    secretaria = area?.nombre ?? null;
  }

  // =========================================================
  // 7. REGISTROS DE HORAS
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

  // =========================================================
  // 8. CÁLCULOS
  // =========================================================

  const horasAcumuladas = (registrosHoras ?? []).reduce(
    (total, registro) => total + Number(registro.horas ?? 0),
    0
  );

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
      ? Math.min((horasAcumuladas / horasRequeridas) * 100, 100)
      : 0;

  const horasCompletadas =
    horasRequeridas !== null &&
    horasAcumuladas >= horasRequeridas;

  // =========================================================
  // 9. MESES
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
  // 10. FECHA
  // =========================================================

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) {
      return "No registrada";
    }

    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // =========================================================
  // 11. ESTADO DE HORAS
  // =========================================================

  const obtenerEstadoHoras = () => {
    if (horasCompletadas) {
      return "Completadas";
    }

    if (
      horasRequeridas !== null &&
      horasRequeridas > 0 &&
      porcentajeProgreso >= 80
    ) {
      return "Próximo a finalizar";
    }

    return "En proceso";
  };

  const estadoHoras = obtenerEstadoHoras();

  // =========================================================
  // 12. INTERFAZ
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
                Estudiante
              </p>
            </div>

            <LogoutButton />
          </div>

        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-6xl px-6 py-10">

        {/* REGRESAR */}
        <Link
          href="/alumno"
          className="text-sm font-medium text-[#9D2449] hover:text-[#621132]"
        >
          ← Regresar al panel
        </Link>

        {/* TÍTULO */}
        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Estudiante
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#621132]">
            Control de horas
          </h1>

          <p className="mt-2 text-gray-600">
            Consulta el avance de las horas registradas por Recursos
            Humanos.
          </p>
        </div>

        {/* INFORMACIÓN DEL ALUMNO */}
        <div className="mt-8 rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Nombre
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {solicitud.nombre}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Matrícula
              </p>

              <p className="mt-1 text-gray-800">
                {solicitud.matricula || "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Carrera
              </p>

              <p className="mt-1 text-gray-800">
                {solicitud.carrera || "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Tipo de proceso
              </p>

              <p className="mt-1 text-gray-800">
                {solicitud.tipo_proceso || "No registrado"}
              </p>
            </div>

          </div>

        </div>

        {/* ASIGNACIÓN */}
        <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">

          <h2 className="border-b border-gray-100 pb-4 text-lg font-semibold text-[#621132]">
            Información de la asignación
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Secretaría
              </p>

              <p className="mt-1 text-gray-800">
                {secretaria || "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Área asignada
              </p>

              <p className="mt-1 text-gray-800">
                {necesidad?.area_asignada || "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Jefe inmediato
              </p>

              <p className="mt-1 text-gray-800">
                {necesidad?.jefe_inmediato || "No registrado"}
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

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Estado de la prestación
              </p>

              <p className="mt-1 font-medium text-[#621132]">
                {asignacion.estado_prestacion}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Fecha de activación
              </p>

              <p className="mt-1 text-gray-800">
                {formatearFecha(asignacion.fecha_activacion)}
              </p>
            </div>

          </div>

        </div>

        {/* RESUMEN DE HORAS */}
        <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-[#621132]">
                Resumen de horas
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Avance acumulado de tu prestación.
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-xs font-medium ${
                estadoHoras === "Completadas"
                  ? "border-green-200 bg-green-100 text-green-800"
                  : estadoHoras === "Próximo a finalizar"
                    ? "border-yellow-200 bg-yellow-100 text-yellow-800"
                    : "border-blue-200 bg-blue-100 text-blue-800"
              }`}
            >
              {estadoHoras}
            </span>

          </div>

          {/* TARJETAS */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-gray-50 p-5 text-center">
              <p className="text-xs font-medium uppercase text-[#707272]">
                Horas requeridas
              </p>

              <p className="mt-2 text-2xl font-bold text-[#621132]">
                {horasRequeridas !== null
                  ? `${horasRequeridas} h`
                  : "No definidas"}
              </p>
            </div>

            <div className="rounded-xl bg-[#D4C29C]/30 p-5 text-center">
              <p className="text-xs font-medium uppercase text-[#707272]">
                Horas realizadas
              </p>

              <p className="mt-2 text-2xl font-bold text-[#621132]">
                {horasAcumuladas} h
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-5 text-center">
              <p className="text-xs font-medium uppercase text-[#707272]">
                Horas restantes
              </p>

              <p className="mt-2 text-2xl font-bold text-[#621132]">
                {horasRestantes !== null
                  ? `${horasRestantes} h`
                  : "No definidas"}
              </p>
            </div>

          </div>

          {/* PROGRESO */}
          {horasRequeridas !== null && horasRequeridas > 0 && (
            <div className="mt-8">

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
                  {horasAcumuladas} h realizadas
                </span>

                <span>
                  {horasRequeridas} h requeridas
                </span>
              </div>

            </div>
          )}

          {/* MENSAJE DE FINALIZACIÓN */}
          {horasCompletadas && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-700">
                🟢 Has completado las horas requeridas.
              </p>

              <p className="mt-1 text-sm text-green-700">
                Recursos Humanos podrá continuar con el proceso de
                finalización correspondiente.
              </p>
            </div>
          )}

        </div>

        {/* HISTORIAL */}
        <div className="mt-6 overflow-hidden rounded-xl border border-[#D4C29C] bg-white shadow-sm">

          <div className="border-b border-[#D4C29C] px-6 py-5">

            <h2 className="text-lg font-semibold text-[#621132]">
              Registro mensual
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Horas registradas mensualmente por Recursos Humanos.
            </p>

          </div>

          {(registrosHoras ?? []).length === 0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                ⏱️
              </div>

              <p className="mt-4 font-medium text-gray-700">
                Aún no hay horas registradas.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Las horas aparecerán aquí cuando Recursos Humanos
                realice el registro mensual.
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
                    <tr
                      key={registro.id}
                      className="transition hover:bg-[#D4C29C]/10"
                    >

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

        {/* NOTA */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs leading-5 text-gray-500">
            <span className="font-semibold text-[#621132]">
              Nota:
            </span>{" "}
            Las horas mostradas en este apartado corresponden a los
            registros realizados por Recursos Humanos. Esta sección
            es únicamente informativa y no permite modificar los
            registros.
          </p>
        </div>

        {/* REGRESAR */}
        <div className="mt-8 flex justify-end">
          <Link
            href="/alumno"
            className="rounded-lg border border-[#621132] px-5 py-2.5 text-sm font-medium text-[#621132] transition hover:bg-[#621132] hover:text-white"
          >
            Regresar al panel
          </Link>
        </div>

      </section>
    </main>
  );
}