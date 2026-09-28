export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

type PageProps = {
  searchParams: Promise<{
    buscar?: string;
    secretaria?: string;
    estado?: string;
    anio?: string;
  }>;
};

type RegistroHora = {
  asignacion_id: number;
  anio: number;
  mes: number;
  horas: number;
};

type HistorialAlumno = {
  asignacionId: number;
  nombre: string;
  matricula: string | null;
  institucion: string | null;
  carrera: string | null;
  tipoProceso: string | null;
  secretaria: string;
  areaAsignada: string;
  estadoPrestacion: string;
  fechaActivacion: string | null;
  fechaTermino: string | null;
  fechaBaja: string | null;
  motivoBaja: string | null;
  folioActaBaja: string | null;
  horasRequeridas: number | null;
  horasAcumuladas: number;
};

export default async function HistorialPrestadoresPage({
  searchParams,
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

  // =========================================================
  // FILTROS
  // =========================================================

  const filtros = await searchParams;

  const buscar = filtros.buscar?.trim() || "";

  const secretariaSeleccionada =
    filtros.secretaria || "Todas";

  const estadoSeleccionado =
    filtros.estado || "Todos";

  const anioSeleccionado =
    filtros.anio?.trim() || "";

  // =========================================================
  // ASIGNACIONES
  // =========================================================

  const {
    data: asignaciones,
    error: errorAsignaciones,
  } = await supabase
    .from("asignaciones")
    .select(`
      id,
      solicitud_id,
      necesidad_id,
      estado,
      estado_prestacion,
      fecha_activacion,
      fecha_termino,
      fecha_baja,
      motivo_baja,
      folio_acta_baja,
      horas_requeridas
    `)
    .eq("estado", "Autorizada")
    .order("id", { ascending: false });

  if (errorAsignaciones) {
    console.error(
      "Error al consultar asignaciones:",
      errorAsignaciones
    );
  }

  // =========================================================
  // SOLICITUDES
  // =========================================================

  const solicitudIds =
    (asignaciones ?? []).map(
      (asignacion) => asignacion.solicitud_id
    );

  const {
    data: solicitudes,
    error: errorSolicitudes,
  } =
    solicitudIds.length > 0
      ? await supabase
          .from("solicitudes")
          .select(`
            id,
            nombre,
            matricula,
            institucion_educativa,
            carrera,
            tipo_proceso
          `)
          .in("id", solicitudIds)
      : { data: [], error: null };

  if (errorSolicitudes) {
    console.error(
      "Error al consultar solicitudes:",
      errorSolicitudes
    );
  }

  // =========================================================
  // NECESIDADES
  // =========================================================

  const necesidadIds =
    (asignaciones ?? []).map(
      (asignacion) => asignacion.necesidad_id
    );

  const {
    data: necesidades,
    error: errorNecesidades,
  } =
    necesidadIds.length > 0
      ? await supabase
          .from("necesidades")
          .select(`
            id,
            area_id,
            area_asignada
          `)
          .in("id", necesidadIds)
      : { data: [], error: null };

  if (errorNecesidades) {
    console.error(
      "Error al consultar necesidades:",
      errorNecesidades
    );
  }

  // =========================================================
  // SECRETARÃAS
  // =========================================================

  const areaIds = (necesidades ?? [])
    .map((necesidad) => necesidad.area_id)
    .filter(Boolean);

  const {
    data: areas,
    error: errorAreas,
  } =
    areaIds.length > 0
      ? await supabase
          .from("areas")
          .select("id, nombre")
          .in("id", areaIds)
      : { data: [], error: null };

  if (errorAreas) {
    console.error(
      "Error al consultar Ã¡reas:",
      errorAreas
    );
  }

  // =========================================================
  // REGISTROS DE HORAS
  // =========================================================

  const asignacionIds =
    (asignaciones ?? []).map(
      (asignacion) => asignacion.id
    );

  const {
    data: registrosHoras,
    error: errorHoras,
  } =
    asignacionIds.length > 0
      ? await supabase
          .from("registro_horas")
          .select(`
            asignacion_id,
            anio,
            mes,
            horas
          `)
          .in("asignacion_id", asignacionIds)
      : { data: [], error: null };

  if (errorHoras) {
    console.error(
      "Error al consultar registros de horas:",
      errorHoras
    );
  }

  // =========================================================
  // CONSTRUIR HISTORIAL
  // =========================================================

  const historial: HistorialAlumno[] = (
    asignaciones ?? []
  )
    .map((asignacion): HistorialAlumno | null => {
      const solicitud = (solicitudes ?? []).find(
        (item) => item.id === asignacion.solicitud_id
      );

      const necesidad = (necesidades ?? []).find(
        (item) => item.id === asignacion.necesidad_id
      );

      const area = (areas ?? []).find(
        (item) => item.id === necesidad?.area_id
      );

      if (!solicitud) {
        return null;
      }

      const registrosAlumno = (
        registrosHoras ?? []
      ).filter(
        (registro) =>
          registro.asignacion_id === asignacion.id
      );

      const horasAcumuladas =
        registrosAlumno.reduce(
          (total, registro) =>
            total + Number(registro.horas ?? 0),
          0
        );

      return {
        asignacionId: asignacion.id,
        nombre: solicitud.nombre,
        matricula: solicitud.matricula,
        institucion:
          solicitud.institucion_educativa,
        carrera: solicitud.carrera,
        tipoProceso: solicitud.tipo_proceso,
        secretaria:
          area?.nombre ?? "Sin SecretarÃ­a",
        areaAsignada:
          necesidad?.area_asignada ??
          "Sin Ã¡rea asignada",
        estadoPrestacion:
          asignacion.estado_prestacion ??
          "Sin estado",
        fechaActivacion:
          asignacion.fecha_activacion,
        fechaTermino:
          asignacion.fecha_termino,
        fechaBaja:
          asignacion.fecha_baja,
        motivoBaja:
          asignacion.motivo_baja,
        folioActaBaja:
          asignacion.folio_acta_baja,
        horasRequeridas:
          asignacion.horas_requeridas !== null
            ? Number(asignacion.horas_requeridas)
            : null,
        horasAcumuladas,
      };
    })
    .filter(
      (
        alumno
      ): alumno is HistorialAlumno =>
        alumno !== null
    );

  // =========================================================
  // SECRETARÃAS PARA EL FILTRO
  // =========================================================

  const secretarias = Array.from(
    new Set(
      historial
        .map((alumno) => alumno.secretaria)
        .filter(Boolean)
    )
  ).sort();

  // =========================================================
  // AÃ‘OS DISPONIBLES
  // =========================================================

  const anios = Array.from(
    new Set(
      historial
        .map((alumno) => {
          const fecha =
            alumno.fechaActivacion ||
            alumno.fechaTermino ||
            alumno.fechaBaja;

          if (!fecha) {
            return null;
          }

          return new Date(fecha).getFullYear();
        })
        .filter(
          (anio): anio is number =>
            anio !== null
        )
    )
  ).sort((a, b) => b - a);

  // =========================================================
  // FILTRAR
  // =========================================================

  const textoBusqueda =
    buscar.toLowerCase();

  const historialFiltrado =
    historial.filter((alumno) => {
      const coincideSecretaria =
        secretariaSeleccionada === "Todas" ||
        alumno.secretaria ===
          secretariaSeleccionada;

      const coincideEstado =
        estadoSeleccionado === "Todos" ||
        alumno.estadoPrestacion ===
          estadoSeleccionado;

      const coincideBusqueda =
        !textoBusqueda ||
        alumno.nombre
          .toLowerCase()
          .includes(textoBusqueda) ||
        alumno.carrera
          ?.toLowerCase()
          .includes(textoBusqueda) ||
        alumno.matricula
          ?.toLowerCase()
          .includes(textoBusqueda);

      let coincideAnio = true;

      if (anioSeleccionado) {
        const anio =
          Number(anioSeleccionado);

        const fechas = [
          alumno.fechaActivacion,
          alumno.fechaTermino,
          alumno.fechaBaja,
        ].filter(Boolean);

        coincideAnio = fechas.some(
          (fecha) =>
            fecha &&
            new Date(fecha).getFullYear() ===
              anio
        );
      }

      return (
        coincideSecretaria &&
        coincideEstado &&
        coincideBusqueda &&
        coincideAnio
      );
    });

  // =========================================================
  // FORMATEAR FECHAS
  // =========================================================

  const formatearFecha = (
    fecha: string | null
  ) => {
    if (!fecha) {
      return "â€”";
    }

    return new Date(fecha).toLocaleDateString(
      "es-MX",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la TransformaciÃ³n"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {usuario.nombre}{" "}
                {usuario.apellido_paterno}
              </p>

              <p className="text-xs text-white/80">
                Recursos Humanos
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/rh"
          className="text-sm font-medium text-[#9D2449] hover:text-[#621132]"
        >
          â† Regresar a Recursos Humanos
        </Link>

        {/* TÃTULO */}

        <div className="mt-6 mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Recursos Humanos
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#621132]">
            Historial de prestadores
          </h1>

          <p className="mt-2 text-gray-600">
            Consulta los alumnos que han participado
            en el sistema y el estado de su prestaciÃ³n.
          </p>
        </div>

        {/* ===================================================
            FILTROS
        ==================================================== */}

        <form
          method="GET"
          className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="font-semibold text-[#621132]">
              Filtros
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Filtra el historial por alumno,
              SecretarÃ­a, estado o aÃ±o.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* BUSCAR */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Buscar alumno
              </label>

              <input
                type="text"
                name="buscar"
                defaultValue={buscar}
                placeholder="Nombre, carrera o matrÃ­cula"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
              />
            </div>

            {/* SECRETARÃA */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                SecretarÃ­a
              </label>

              <select
                name="secretaria"
                defaultValue={
                  secretariaSeleccionada
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
              >
                <option value="Todas">
                  Todas las SecretarÃ­as
                </option>

                {secretarias.map(
                  (secretaria) => (
                    <option
                      key={secretaria}
                      value={secretaria}
                    >
                      {secretaria}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ESTADO */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Estado de la prestaciÃ³n
              </label>

              <select
                name="estado"
                defaultValue={
                  estadoSeleccionado
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
              >
                <option value="Todos">
                  Todos los estados
                </option>

                <option value="Pendiente de activaciÃ³n">
                  Pendiente de activaciÃ³n
                </option>

                <option value="Activa">
                  Activa
                </option>

                <option value="Finalizada">
                  Finalizada
                </option>

                <option value="Dada de baja">
                  Dada de baja
                </option>
              </select>
            </div>

            {/* AÃ‘O */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                AÃ±o
              </label>

              <select
                name="anio"
                defaultValue={
                  anioSeleccionado
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
              >
                <option value="">
                  Todos los aÃ±os
                </option>

                {anios.map((anio) => (
                  <option
                    key={anio}
                    value={anio}
                  >
                    {anio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
            >
              ðŸ”Ž Aplicar filtros
            </button>

            <Link
              href="/rh/historial"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Limpiar
            </Link>
          </div>
        </form>

        {/* ===================================================
            RESUMEN
        ==================================================== */}

        <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#621132]">
                Registros encontrados
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {historialFiltrado.length} prestador(es)
              </p>
            </div>

            <div className="rounded-lg bg-[#D4C29C]/30 px-4 py-2 text-sm font-medium text-[#621132]">
              Historial completo
            </div>
          </div>
        </div>

        {/* ===================================================
            TABLA
        ==================================================== */}

        <div className="mt-6 overflow-hidden rounded-xl border border-[#D4C29C] bg-white shadow-sm">
          {historialFiltrado.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                ðŸ“‹
              </div>

              <p className="mt-4 font-medium text-gray-700">
                No se encontraron registros.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Prueba cambiando los filtros de bÃºsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="bg-[#621132] text-white">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Alumno
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Carrera
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      SecretarÃ­a
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Ãrea asignada
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Tipo
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Estado
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      ActivaciÃ³n
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      TÃ©rmino / Baja
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Horas
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {historialFiltrado.map(
                    (alumno) => (
                      <tr
                        key={alumno.asignacionId}
                        className="transition hover:bg-[#D4C29C]/10"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#621132]">
                            {alumno.nombre}
                          </p>

                          {alumno.matricula && (
                            <p className="mt-1 text-xs text-gray-500">
                              MatrÃ­cula:{" "}
                              {alumno.matricula}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-gray-500">
                            {alumno.institucion ??
                              "Sin instituciÃ³n"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium text-[#9D2449]">
                            {alumno.carrera ??
                              "Sin carrera"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {alumno.secretaria}
                        </td>

                        <td className="px-5 py-4">
                          {alumno.areaAsignada}
                        </td>

                        <td className="px-5 py-4">
                          {alumno.tipoProceso ??
                            "â€”"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              alumno.estadoPrestacion ===
                              "Activa"
                                ? "border-green-200 bg-green-100 text-green-800"
                                : alumno.estadoPrestacion ===
                                  "Finalizada"
                                ? "border-blue-200 bg-blue-100 text-blue-800"
                                : alumno.estadoPrestacion ===
                                  "Dada de baja"
                                ? "border-red-200 bg-red-100 text-red-800"
                                : "border-yellow-200 bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {alumno.estadoPrestacion}
                          </span>

                          {alumno.estadoPrestacion ===
                            "Dada de baja" &&
                            alumno.folioActaBaja && (
                              <p className="mt-2 text-xs text-red-700">
                                Folio:{" "}
                                {
                                  alumno.folioActaBaja
                                }
                              </p>
                            )}
                        </td>

                        <td className="px-5 py-4">
                          {formatearFecha(
                            alumno.fechaActivacion
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {alumno.estadoPrestacion ===
                          "Dada de baja"
                            ? formatearFecha(
                                alumno.fechaBaja
                              )
                            : formatearFecha(
                                alumno.fechaTermino
                              )}

                          {alumno.estadoPrestacion ===
                            "Dada de baja" &&
                            alumno.motivoBaja && (
                              <p className="mt-1 max-w-[220px] text-xs text-gray-500">
                                {alumno.motivoBaja}
                              </p>
                            )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#621132]">
                            {alumno.horasAcumuladas}
                          </p>

                          {alumno.horasRequeridas !==
                            null && (
                            <p className="text-xs text-gray-500">
                              de{" "}
                              {
                                alumno.horasRequeridas
                              }
                            </p>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===================================================
            NOTA
        ==================================================== */}

        <div className="mt-6 rounded-xl border border-[#D4C29C] bg-[#D4C29C]/10 p-5">
          <p className="text-sm font-medium text-[#621132]">
            ðŸ’¡ Historial
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            Los registros finalizados y dados de baja
            permanecen almacenados para conservar el
            historial de cada prestador. Las horas
            acumuladas se obtienen de los registros
            mensuales capturados por Recursos Humanos.
          </p>
        </div>
      </section>
    </main>
  );
}
