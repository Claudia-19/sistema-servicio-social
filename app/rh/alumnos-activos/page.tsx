export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import CapturaHoras from "./CapturaHoras2";

type PageProps = {
  searchParams: Promise<{
    secretaria?: string;
    buscar?: string;
    mes?: string;
    anio?: string;
  }>;
};

type RegistroHora = {
  id: number;
  asignacion_id: number;
  anio: number;
  mes: number;
  horas: number;
  observaciones: string | null;
};

type Alumno = {
  asignacionId: number;
  nombre: string;
  matricula: string | null;
  institucion: string | null;
  carrera: string | null;
  secretaria: string;
  areaAsignada: string;
  jefeInmediato: string;
  fechaActivacion: string | null;
  horasRequeridas: number | null;
  horasAcumuladas: number;
  horasRestantes: number | null;
  porcentaje: number;
  horasDelMes: number | null;
  estadoHoras: string;
  registros: RegistroHora[];
};

export default async function AlumnosActivosPage({
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
    .select(
      "nombre, apellido_paterno, apellido_materno, rol_id"
    )
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

  const fechaActual = new Date();

  const mesSeleccionado = Number(
    filtros.mes || fechaActual.getMonth() + 1
  );

  const anioSeleccionado = Number(
    filtros.anio || fechaActual.getFullYear()
  );

  // =========================================================
  // OBTENER ESTUDIANTES ACTIVOS
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
      horas_requeridas
    `)
    .eq("estado", "Autorizada")
    .eq("estado_prestacion", "Activa")
    .order("fecha_activacion", {
      ascending: false,
    });

  // =========================================================
  // SOLICITUDES
  // =========================================================

  const solicitudIds =
    (asignaciones ?? []).map(
      (asignacion) =>
        asignacion.solicitud_id
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
  institucion_educativa,
  carrera,
  matricula,
  tipo_proceso,
  fecha_inicio
`)
          .in("id", solicitudIds)
      : { data: [], error: null };

  // =========================================================
  // NECESIDADES
  // =========================================================

  const necesidadIds =
    (asignaciones ?? []).map(
      (asignacion) =>
        asignacion.necesidad_id
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
            area_asignada,
            jefe_inmediato
          `)
          .in("id", necesidadIds)
      : { data: [], error: null };

  // =========================================================
  // ÁREAS / SECRETARÍAS
  // =========================================================

  const areaIds = (necesidades ?? [])
    .map(
      (necesidad) =>
        necesidad.area_id
    )
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

  // =========================================================
  // REGISTROS DE HORAS
  // =========================================================

  const asignacionIds =
    (asignaciones ?? []).map(
      (asignacion) =>
        asignacion.id
    );

  const {
    data: registrosHoras,
    error: errorHoras,
  } =
    asignacionIds.length > 0
      ? await supabase
          .from("registro_horas")
          .select(`
            id,
            asignacion_id,
            anio,
            mes,
            horas,
            observaciones
          `)
          .in(
            "asignacion_id",
            asignacionIds
          )
      : { data: [], error: null };

  // =========================================================
  // CONSTRUIR ALUMNOS
  // =========================================================

  const alumnos: Alumno[] =
    (asignaciones ?? [])
      .map(
        (asignacion): Alumno | null => {
          const solicitud =
            (solicitudes ?? []).find(
              (item) =>
                item.id ===
                asignacion.solicitud_id
            );

          const necesidad =
            (necesidades ?? []).find(
              (item) =>
                item.id ===
                asignacion.necesidad_id
            );

          const area =
            (areas ?? []).find(
              (item) =>
                item.id ===
                necesidad?.area_id
            );

          if (!solicitud) {
            return null;
          }

          const registrosAlumno =
            (registrosHoras ?? []).filter(
              (registro) =>
                registro.asignacion_id ===
                asignacion.id
            );

          // ===================================================
          // HORAS ACUMULADAS
          // ===================================================

          const horasAcumuladas =
            registrosAlumno.reduce(
              (total, registro) =>
                total +
                Number(
                  registro.horas ?? 0
                ),
              0
            );

          // ===================================================
          // HORAS DEL MES SELECCIONADO
          // ===================================================

          const registroMes =
            registrosAlumno.find(
              (registro) =>
                registro.anio ===
                  anioSeleccionado &&
                registro.mes ===
                  mesSeleccionado
            );

          const horasDelMes =
            registroMes
              ? Number(
                  registroMes.horas ?? 0
                )
              : null;

          // ===================================================
          // HORAS REQUERIDAS
          // ===================================================

          const horasRequeridas =
            asignacion.horas_requeridas !==
            null
              ? Number(
                  asignacion.horas_requeridas
                )
              : null;

          // ===================================================
          // HORAS RESTANTES
          // ===================================================

          const horasRestantes =
            horasRequeridas !== null
              ? Math.max(
                  horasRequeridas -
                    horasAcumuladas,
                  0
                )
              : null;

          // ===================================================
          // PORCENTAJE
          // ===================================================

          const porcentaje =
            horasRequeridas !== null &&
            horasRequeridas > 0
              ? Math.min(
                  (horasAcumuladas /
                    horasRequeridas) *
                    100,
                  100
                )
              : 0;

          // ===================================================
          // ESTADO DE HORAS
          // ===================================================

          let estadoHoras =
            "Sin definir";

          if (
            horasRequeridas !== null
          ) {
            if (
              horasAcumuladas >=
              horasRequeridas
            ) {
              estadoHoras =
                "Completadas";
            } else if (
              horasRestantes !== null &&
              horasRestantes <= 40
            ) {
              estadoHoras =
                "Próximo a finalizar";
            } else {
              estadoHoras =
                "En proceso";
            }
          }

          const nombreCompleto =
            solicitud.nombre || "Sin nombre";

          return {
            asignacionId:
              asignacion.id,

            nombre:
              nombreCompleto,

            matricula:
              solicitud.matricula,

            institucion:
              solicitud.institucion_educativa,

            carrera:
              solicitud.carrera,

            secretaria:
              area?.nombre ??
              "Sin Secretaría",

            areaAsignada:
              necesidad?.area_asignada ??
              "Sin área asignada",

            jefeInmediato:
              necesidad?.jefe_inmediato ??
              "Sin jefe inmediato",

            fechaActivacion:
              asignacion.fecha_activacion,

            horasRequeridas,

            horasAcumuladas,

            horasRestantes,

            porcentaje,

            horasDelMes,

            estadoHoras,

            registros:
              registrosAlumno,
          };
        }
      )
      .filter(
        (
          alumno
        ): alumno is Alumno =>
          alumno !== null
      );

  // =========================================================
  // SECRETARÍAS
  // =========================================================

  const secretarias =
    Array.from(
      new Set(
        alumnos
          .map(
            (alumno) =>
              alumno.secretaria
          )
          .filter(Boolean)
      )
    ).sort();

  // =========================================================
  // FILTRAR ALUMNOS
  // =========================================================

  const textoBusqueda =
    buscar.toLowerCase();

  const alumnosFiltrados =
    alumnos.filter(
      (alumno) => {
        const coincideSecretaria =
          secretariaSeleccionada ===
            "Todas" ||
          alumno.secretaria ===
            secretariaSeleccionada;

        const coincideBusqueda =
          !textoBusqueda ||
          alumno.nombre
            .toLowerCase()
            .includes(textoBusqueda) ||
          alumno.carrera
            ?.toLowerCase()
            .includes(
              textoBusqueda
            ) ||
          alumno.matricula
            ?.toLowerCase()
            .includes(
              textoBusqueda
            );

        return (
          coincideSecretaria &&
          coincideBusqueda
        );
      }
    );

  // =========================================================
  // MESES
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

  const nombreMes =
    nombresMeses[
      mesSeleccionado
    ] || "Mes seleccionado";

  // =========================================================
  // ERRORES
  // =========================================================

  const error =
    errorAsignaciones ||
    errorSolicitudes ||
    errorNecesidades ||
    errorAreas ||
    errorHoras;

  // =========================================================
  // RENDER
  // =========================================================

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
              alt="Pachuca Capital de la Transformación"
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
                DIRECCIÓN GENERAL DE RECURSOS HUMANOS
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
          ← Regresar a solicitudes
        </Link>

        {/* ===================================================
            TÍTULO
        ==================================================== */}

        <div className="mt-6 mb-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            DIRECCIÓN GENERAL DE RECURSOS HUMANOS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#621132]">
            Estudiantes activos
          </h1>

          <p className="mt-2 text-gray-600">
            Consulta y da seguimiento a los alumnos
            activos, incluyendo el registro mensual
            de horas.
          </p>

        </div>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error ? (

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

            <p className="font-medium">
              No fue posible consultar la
              información de los alumnos.
            </p>

            <p className="mt-1">
              {error.message}
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                RESUMEN
            ================================================== */}

            <div className="mb-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-xl border border-[#D4C29C] bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-gray-500">
                  Estudiantes activos
                </p>

                <p className="mt-2 text-3xl font-bold text-[#621132]">
                  {alumnos.length}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Estudiantes actualmente activos
                </p>

              </div>

              <div className="rounded-xl border border-[#D4C29C] bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-gray-500">
                  Registro mensual
                </p>

                <p className="mt-2 text-2xl font-bold text-[#621132]">
                  {nombreMes}{" "}
                  {anioSeleccionado}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Periodo seleccionado
                </p>

              </div>

            </div>

            {/* =================================================
                FILTROS
            ================================================== */}

            <form
              method="GET"
              className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm"
            >

              <div className="mb-5">

                <h2 className="font-semibold text-[#621132]">
                  Filtros
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Filtra por Secretaría, alumno,
                  mes o año.
                </p>

              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* SECRETARÍA */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Secretaría
                  </label>

                  <select
                    name="secretaria"
                    defaultValue={
                      secretariaSeleccionada
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                  >

                    <option value="Todas">
                      Todas las Secretarías
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

                {/* BUSCAR */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Buscar alumno
                  </label>

                  <input
                    type="text"
                    name="buscar"
                    defaultValue={
                      buscar
                    }
                    placeholder="Nombre, carrera o matrícula"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                  />

                </div>

                {/* MES */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Mes
                  </label>

                  <select
                    name="mes"
                    defaultValue={
                      mesSeleccionado
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                  >

                    {nombresMeses
                      .slice(1)
                      .map(
                        (
                          nombre,
                          index
                        ) => (
                          <option
                            key={
                              index + 1
                            }
                            value={
                              index + 1
                            }
                          >
                            {nombre}
                          </option>
                        )
                      )}

                  </select>

                </div>

                {/* AÑO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Año
                  </label>

                  <input
                    type="number"
                    name="anio"
                    min="2000"
                    max="2100"
                    defaultValue={
                      anioSeleccionado
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                  />

                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-3">

                <button
                  type="submit"
                  className="rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
                >
                  🔎 Aplicar filtros
                </button>

                <Link
                  href="/rh/alumnos-activos"
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Limpiar
                </Link>

              </div>

            </form>

            {/* =================================================
                REGISTRO MENSUAL
            ================================================== */}

            <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="text-sm font-semibold text-[#621132]">
                    Captura de horas
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Registra las horas de todos los
                    estudiantes activos para el mes
                    seleccionado.
                  </p>

                </div>

                <div className="rounded-lg bg-[#D4C29C]/30 px-4 py-2 text-sm font-medium text-[#621132]">
                  {nombreMes}{" "}
                  {anioSeleccionado}
                </div>

              </div>

            </div>

            {/* =================================================
                TABLA DE HORAS
            ================================================== */}

            <div className="mt-6 overflow-hidden rounded-xl border border-[#D4C29C] bg-white shadow-sm">

              {alumnosFiltrados.length ===
              0 ? (

                <div className="p-12 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                    🔎
                  </div>

                  <p className="mt-4 font-medium text-gray-700">
                    No se encontraron alumnos.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Prueba cambiando la Secretaría
                    o el criterio de búsqueda.
                  </p>

                </div>

              ) : (

                <CapturaHoras
                  alumnos={
                    alumnosFiltrados
                  }
                  mesSeleccionado={
                    mesSeleccionado
                  }
                  anioSeleccionado={
                    anioSeleccionado
                  }
                  nombreMes={nombreMes}
                />

              )}

            </div>

            {/* =================================================
                SEGUIMIENTO INDIVIDUAL
            ================================================== */}

            {alumnosFiltrados.length >
              0 && (

              <div className="mt-6 rounded-xl border border-[#D4C29C] bg-white shadow-sm">

                <div className="border-b border-[#D4C29C] px-6 py-5">

                  <h2 className="font-semibold text-[#621132]">
                    Seguimiento individual
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Consulta el expediente y
                    seguimiento completo de cada alumno.
                  </p>

                </div>

                <div className="divide-y divide-gray-100">

                  {alumnosFiltrados.map(
                    (alumno) => (

                      <div
                        key={
                          alumno.asignacionId
                        }
                        className="p-5 transition hover:bg-[#D4C29C]/10"
                      >

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                          <div>

                            <div className="flex flex-wrap items-center gap-3">

                              <h3 className="font-semibold text-[#621132]">
                                {alumno.nombre}
                              </h3>

                              <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                Activo
                              </span>

                            </div>

                            <p className="mt-1 text-sm text-[#9D2449]">
                              {
                                alumno.carrera
                              }
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {
                                alumno.institucion ||
                                "Sin institución"
                              }
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">

                              <span>
                                <strong>
                                  Secretaría:
                                </strong>{" "}
                                {
                                  alumno.secretaria
                                }
                              </span>

                              <span>
                                <strong>
                                  Área:
                                </strong>{" "}
                                {
                                  alumno.areaAsignada
                                }
                              </span>

                              <span>
                                <strong>
                                  Horas:
                                </strong>{" "}
                                {
                                  alumno.horasAcumuladas
                                }{" "}
                                h
                              </span>

                            </div>

                          </div>

                          <Link
                            href={`/rh/alumnos-activos/${alumno.asignacionId}`}
                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
                          >
                            Ver seguimiento
                          </Link>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {/* =================================================
                NOTA
            ================================================== */}

            <div className="mt-6 rounded-xl border border-[#D4C29C] bg-[#D4C29C]/10 p-5">

              <p className="text-sm font-medium text-[#621132]">
                💡 Importante
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                Las horas se registran por mes y por
                alumno. Puedes filtrar la lista para
                capturar únicamente los alumnos de una
                Secretaría o buscar un alumno específico.
                El historial conserva los registros
                anteriores.
              </p>

            </div>

          </>

        )}

      </section>

    </main>
  );
}