export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function RHPage() {
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
  // OBTENER SOLICITUDES
  // =========================================================

  const { data: solicitudes, error } =
    await supabase
      .from("solicitudes")
      .select(`
        id,
        nombre,
        institucion_educativa,
        carrera,
        semestre_cuatrimestre,
        matricula,
        telefono,
        correo,
        tipo_proceso,
        fecha_inicio,
        horario_propuesto,
        estado,
        fecha_solicitud
      `)
      .order("fecha_solicitud", {
        ascending: false,
      });

  // =========================================================
  // OBTENER ASIGNACIONES
  // =========================================================

  const { data: asignaciones } =
    await supabase
      .from("asignaciones")
      .select(`
        solicitud_id,
        estado,
        necesidades (
          area_asignada,
          areas (
            nombre
          )
        )
      `);

  // =========================================================
  // AGREGAR SECRETARÍA Y ÁREA ASIGNADA
  // =========================================================

  const solicitudesConUbicacion =
    (solicitudes ?? []).map(
      (solicitud) => {
        const asignacion =
          (asignaciones ?? []).find(
            (item) =>
              item.solicitud_id ===
                solicitud.id &&
              item.estado === "Autorizada"
          );

        const necesidad =
          asignacion?.necesidades
            ? Array.isArray(
                asignacion.necesidades
              )
              ? asignacion.necesidades[0]
              : asignacion.necesidades
            : null;

        const area =
          necesidad?.areas
            ? Array.isArray(
                necesidad.areas
              )
              ? necesidad.areas[0]
              : necesidad.areas
            : null;

        return {
          ...solicitud,
          secretaria:
            area?.nombre ?? null,
          area_asignada:
            necesidad?.area_asignada ??
            null,
        };
      }
    );

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  const total =
    solicitudesConUbicacion.length;

  const pendientes =
    solicitudesConUbicacion.filter(
      (solicitud) =>
        solicitud.estado === "Pendiente"
    ).length;

  const aceptadas =
    solicitudesConUbicacion.filter(
      (solicitud) =>
        solicitud.estado === "Aceptada"
    ).length;

  const asignadas =
    solicitudesConUbicacion.filter(
      (solicitud) =>
        solicitud.estado === "Asignada"
    ).length;

  const rechazadas =
    solicitudesConUbicacion.filter(
      (solicitud) =>
        solicitud.estado === "Rechazada"
    ).length;

  // =========================================================
  // ESTUDIANTES ACTIVOS
  // =========================================================

  const { count: alumnosActivos } =
    await supabase
      .from("asignaciones")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("estado", "Autorizada")
      .eq(
        "estado_prestacion",
        "Activa"
      );

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

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            DIRECCIÓN GENERAL DE RECURSOS HUMANOS
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Solicitudes
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta, revisa y gestiona las
            solicitudes recibidas.
          </p>

        </div>

        {error ? (

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

            <p className="font-medium">
              No fue posible consultar las
              solicitudes.
            </p>

            <p className="mt-1">
              {error.message}
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                BOTONES PRINCIPALES
            ================================================== */}

            <div className="mb-5 flex flex-wrap justify-end gap-3">

              {/* ESTUDIANTES ACTIVOS */}

              <Link
                href="/rh/alumnos-activos"
                className="inline-flex items-center gap-2 rounded-lg bg-[#9D2449] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#621132]"
              >
                👥 Estudiantes activos

                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {alumnosActivos ?? 0}
                </span>
              </Link>

              {/* CONSULTAR */}

              <Link
                href="/rh/consultas"
                className="inline-flex items-center gap-2 rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
              >
                🔎 Consultar
              </Link>

              <Link
  href="/rh/necesidades"
  className="inline-flex items-center gap-2 rounded-lg border border-[#621132] bg-white px-5 py-2.5 text-sm font-medium text-[#621132] transition hover:bg-[#D4C29C]/20"
>
  🏢 Vacantes
</Link>

            </div>

            {/* =================================================
                ESTADÍSTICAS
            ================================================== */}

            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">

              {/* TOTAL */}

              <div className="rounded-xl border border-[#D4C29C] bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-gray-500">
                  Total
                </p>

                <p className="mt-2 text-3xl font-bold text-[#621132]">
                  {total}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Solicitudes recibidas
                </p>

              </div>

              {/* PENDIENTES */}

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">

                <p className="text-sm font-medium text-yellow-700">
                  Pendientes
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-800">
                  {pendientes}
                </p>

                <p className="mt-1 text-xs text-yellow-600">
                  Por revisar
                </p>

              </div>

              {/* ACEPTADAS */}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">

                <p className="text-sm font-medium text-blue-700">
                  Aceptadas
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-800">
                  {aceptadas}
                </p>

                <p className="mt-1 text-xs text-blue-600">
                  Solicitudes aceptadas
                </p>

              </div>

              {/* ASIGNADAS */}

              <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">

                <p className="text-sm font-medium text-green-700">
                  Asignadas
                </p>

                <p className="mt-2 text-3xl font-bold text-green-800">
                  {asignadas}
                </p>

                <p className="mt-1 text-xs text-green-600">
                  Asignaciones autorizadas
                </p>

              </div>

              {/* RECHAZADAS */}

              <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">

                <p className="text-sm font-medium text-red-700">
                  Rechazadas
                </p>

                <p className="mt-2 text-3xl font-bold text-red-800">
                  {rechazadas}
                </p>

                <p className="mt-1 text-xs text-red-600">
                  Solicitudes rechazadas
                </p>

              </div>

            </div>

            {/* =================================================
                LISTA DE SOLICITUDES
            ================================================== */}

            <div className="rounded-xl border border-[#D4C29C] bg-white shadow-sm">

              <div className="border-b border-[#D4C29C] px-6 py-5">

                <h3 className="font-semibold text-[#621132]">
                  Solicitudes
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    solicitudesConUbicacion.length
                  }{" "}
                  solicitud(es)
                </p>

              </div>

              {solicitudesConUbicacion.length ===
              0 ? (

                <div className="p-10 text-center">

                  <p className="font-medium text-gray-700">
                    No se encontraron
                    solicitudes.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Actualmente no hay
                    solicitudes registradas.
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-gray-100">

                  {solicitudesConUbicacion.map(
                    (solicitud) => (

                      <div
                        key={solicitud.id}
                        className="p-6 transition hover:bg-[#D4C29C]/10"
                      >

                        <div className="flex items-center justify-between gap-5">

                          {/* INFORMACIÓN */}

                          <div className="min-w-0">

                            <h4 className="text-lg font-semibold text-[#621132]">
                              {solicitud.nombre}
                            </h4>

                            <p className="mt-1 text-sm font-medium text-[#9D2449]">
                              {solicitud.carrera}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {
                                solicitud.institucion_educativa
                              }
                            </p>

                            {solicitud.secretaria && (
                              <p className="mt-2 text-sm text-gray-600">

                                <span className="font-medium">
                                  Secretaría:
                                </span>{" "}

                                {
                                  solicitud.secretaria
                                }

                              </p>
                            )}

                            {solicitud.area_asignada && (
                              <p className="mt-1 text-sm text-gray-600">

                                <span className="font-medium">
                                  Área asignada:
                                </span>{" "}

                                {
                                  solicitud.area_asignada
                                }

                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">

                              <span className="rounded-full bg-[#D4C29C]/40 px-3 py-1 text-xs font-medium text-[#621132]">
                                {
                                  solicitud.tipo_proceso
                                }
                              </span>

                              <span className="rounded-full bg-[#707272]/10 px-3 py-1 text-xs text-[#707272]">
                                {
                                  solicitud.semestre_cuatrimestre
                                }
                              </span>

                              <span className="rounded-full bg-[#707272]/10 px-3 py-1 text-xs text-[#707272]">
                                Inicio:{" "}
                                {
                                  solicitud.fecha_inicio
                                }
                              </span>

                            </div>

                          </div>

                          {/* ESTADO */}

                          <div className="flex shrink-0 items-center gap-4">

                            <span
                              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                                solicitud.estado ===
                                "Pendiente"
                                  ? "border-yellow-200 bg-yellow-100 text-yellow-800"
                                  : solicitud.estado ===
                                    "Aceptada"
                                  ? "border-blue-200 bg-blue-100 text-blue-800"
                                  : solicitud.estado ===
                                    "Asignada"
                                  ? "border-green-200 bg-green-100 text-green-800"
                                  : solicitud.estado ===
                                    "Rechazada"
                                  ? "border-red-200 bg-red-100 text-red-800"
                                  : "border-gray-200 bg-gray-100 text-gray-700"
                              }`}
                            >
                              {
                                solicitud.estado
                              }
                            </span>

                            <Link
                              href={`/rh/solicitud/${solicitud.id}`}
                              className="rounded-lg bg-[#621132] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9D2449]"
                            >
                              Revisar
                            </Link>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </>

        )}

      </section>

    </main>
  );
}