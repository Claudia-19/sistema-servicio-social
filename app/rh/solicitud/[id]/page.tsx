import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DecisionSolicitud from "@/components/DecisionSolicitud";
import PosiblesNecesidades from "@/components/PosiblesNecesidades";
import ActivarAlumno from "@/app/rh/alumnos-activos/[id]/acciones/ActivarAlumno";

export const instant = false;

export default async function RevisarSolicitudPage({
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

  // ============================================================
  // VERIFICAR QUE SEA RECURSOS HUMANOS
  // ============================================================

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 2) {
    redirect("/dashboard");
  }

  const { id } = await params;

  // ============================================================
  // OBTENER SOLICITUD
  // ============================================================

  const { data: solicitud, error } = await supabase
    .from("solicitudes")
    .select(`
      id,
      usuario_id,
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
      fotografia_url,
      estado,
      fecha_solicitud
    `)
    .eq("id", id)
    .single();

  if (error || !solicitud) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            No se encontró la solicitud
          </h1>

          <p className="mt-2 text-gray-600">
            La solicitud que intentas consultar no existe.
          </p>

          <Link
            href="/rh"
            className="mt-5 inline-block rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
          >
            Regresar a solicitudes
          </Link>
        </div>
      </main>
    );
  }

  // ============================================================
  // OBTENER FOTOGRAFÍA PRIVADA DEL ALUMNO
  // ============================================================

  let fotoUrl: string | null = null;

  if (solicitud.fotografia_url) {
    let rutaFotografia = solicitud.fotografia_url;

    /*
     * Compatibilidad con registros antiguos que guardaron
     * una URL pública completa.
     */
    if (
      rutaFotografia.includes(
        "/storage/v1/object/public/fotos-alumnos/"
      )
    ) {
      rutaFotografia = rutaFotografia.split(
        "/storage/v1/object/public/fotos-alumnos/"
      )[1];
    }

    /*
     * Si ya es una ruta interna, se utiliza directamente.
     */
    if (rutaFotografia) {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("fotos-alumnos")
          .createSignedUrl(rutaFotografia, 60 * 60);

      if (signedUrlError) {
        console.error(
          "Error al generar URL firmada de fotografía:",
          signedUrlError
        );
      } else {
        fotoUrl = signedUrlData?.signedUrl ?? null;
      }
    }
  }

  // ============================================================
  // OBTENER VACANTES DISPONIBLES
  // ============================================================

  const { data: necesidades } =
    solicitud.estado === "Aceptada"
      ? await supabase
          .from("necesidades")
          .select(`
            id,
            area_id,
            carrera,
            carrera_otra,
            nivel_academico,
            perfil_requerido,
            horario,
            vacantes_disponibles,
            estado,
            areas (
              nombre
            )
          `)
          .eq("estado", "Disponible")
          .gt("vacantes_disponibles", 0)
          .order("created_at", { ascending: true })
      : { data: [] };

  // ============================================================
  // OBTENER ASIGNACIÓN DEFINITIVA
  // ============================================================

  let asignacion: any = null;

  if (solicitud.estado === "Asignada") {
    const { data } = await supabase
      .from("asignaciones")
      .select(`
        id,
        estado,
        estado_prestacion,
        otra_vacante,
        fecha_autorizacion,
        fecha_activacion,
        fecha_termino,
        fecha_baja,
        motivo_baja,
        folio_acta_baja,
        necesidad_id,
        necesidades (
          id,
          carrera,
          carrera_otra,
          nivel_academico,
          perfil_requerido,
          horario,
          jefe_inmediato,
          area_asignada,
          vacantes_disponibles,
          estado,
          areas (
            nombre
          )
        )
      `)
      .eq("solicitud_id", solicitud.id)
      .eq("estado", "Autorizada")
      .order("fecha_autorizacion", { ascending: false })
      .limit(1)
      .maybeSingle();

    asignacion = data;
  }

  const necesidadAsignada = asignacion?.necesidades
    ? Array.isArray(asignacion.necesidades)
      ? asignacion.necesidades[0]
      : asignacion.necesidades
    : null;

  const areaAsignada = necesidadAsignada?.areas
    ? Array.isArray(necesidadAsignada.areas)
      ? necesidadAsignada.areas[0]
      : necesidadAsignada.areas
    : null;

  // ============================================================
  // INTERFAZ
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ======================================================
          ENCABEZADO
      ======================================================= */}

      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

          <div className="flex items-center">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la Transformación"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-white">
              Dirección General de Recursos Humanos
            </p>

            <p className="text-xs text-white/80">
              Revisión de solicitud
            </p>
          </div>

        </div>
      </header>

      {/* ======================================================
          CONTENIDO
      ======================================================= */}

      <section className="mx-auto max-w-5xl px-6 py-10">

        {/* REGRESAR ARRIBA */}

        <div className="mb-6">
          <Link
            href="/rh"
            className="inline-flex items-center text-sm font-medium text-[#9D2449] transition hover:text-[#621132]"
          >
            ← Regresar a solicitudes
          </Link>
        </div>

        {/* TÍTULO */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Dirección General de Recursos Humanos
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Revisar solicitud
          </h2>

          <p className="mt-2 text-gray-600">
            Revisa la información proporcionada por el alumno.
          </p>

        </div>

        <div className="space-y-6">

          {/* ==================================================
              ASIGNACIÓN DEFINITIVA
          =================================================== */}

          {solicitud.estado === "Asignada" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <span className="text-xl text-green-700">
                    ✓
                  </span>
                </div>

                <div className="flex-1">

                  <h3 className="text-lg font-bold text-green-900">
                    Asignación autorizada
                  </h3>

                  <p className="mt-1 text-sm text-green-800">
                    La Administradora autorizó la asignación de este alumno.
                    Esta es la asignación definitiva.
                  </p>

                  {asignacion ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">

                      {/* ÁREA / OTRA VACANTE */}

                      <div className="rounded-lg bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Área asignada
                        </p>

                        <p className="mt-1 font-semibold text-[#621132]">
                          {asignacion.otra_vacante
                            ? asignacion.otra_vacante
                            : areaAsignada?.nombre ?? "Sin área"}
                        </p>
                      </div>

                      {/* ESTADO */}

                      <div className="rounded-lg bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Estado de asignación
                        </p>

                        <p className="mt-1 font-semibold text-green-700">
                          {asignacion.estado ?? "Autorizada"}
                        </p>
                      </div>

                      {/* ESTADO DE PRESTACIÓN */}

                      <div className="rounded-lg bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Estado de prestación
                        </p>

                        <p
                          className={`mt-1 font-semibold ${
                            asignacion.estado_prestacion ===
                            "Pendiente de activación"
                              ? "text-yellow-700"
                              : asignacion.estado_prestacion === "Activa"
                              ? "text-green-700"
                              : asignacion.estado_prestacion === "Finalizada"
                              ? "text-blue-700"
                              : asignacion.estado_prestacion ===
                                "Dada de baja"
                              ? "text-red-700"
                              : "text-gray-700"
                          }`}
                        >
                          {asignacion.estado_prestacion ??
                            "Pendiente de activación"}
                        </p>
                      </div>

                      {/* CARRERA */}

                      {necesidadAsignada ? (
                        <>
                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Carrera requerida
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                              {necesidadAsignada.carrera === "Otra"
                                ? necesidadAsignada.carrera_otra ||
                                  "Sin especificar"
                                : necesidadAsignada.carrera ||
                                  "Sin especificar"}
                            </p>
                          </div>

                          {/* NIVEL */}

                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Nivel académico
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                              {necesidadAsignada.nivel_academico ||
                                "Sin especificar"}
                            </p>
                          </div>

                          {/* HORARIO */}

                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Horario
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                              {necesidadAsignada.horario ||
                                "Sin especificar"}
                            </p>
                          </div>

                          {/* JEFE */}

                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Jefe inmediato
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                              {necesidadAsignada.jefe_inmediato ||
                                "Sin especificar"}
                            </p>
                          </div>

                          {/* ÁREA ASIGNADA */}

                          <div className="rounded-lg bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Área de trabajo
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                              {necesidadAsignada.area_asignada ||
                                "Sin especificar"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg bg-white p-4 md:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Otra vacante
                          </p>

                          <p className="mt-1 font-medium text-[#621132]">
                            {asignacion.otra_vacante ||
                              "Sin especificar"}
                          </p>
                        </div>
                      )}

                      {/* FECHA DE AUTORIZACIÓN */}

                      <div className="rounded-lg bg-white p-4 md:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Fecha de autorización
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {asignacion.fecha_autorizacion
                            ? new Date(
                                asignacion.fecha_autorizacion
                              ).toLocaleString("es-MX")
                            : "Sin fecha registrada"}
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                      La solicitud aparece como asignada, pero no fue posible
                      consultar los datos de la asignación.
                    </div>
                  )}

                  {/* ==================================================
                      ACTIVAR ALUMNO
                  =================================================== */}

                  {asignacion?.estado_prestacion ===
                    "Pendiente de activación" && (
                    <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                      <p className="text-sm font-semibold text-yellow-900">
                        El alumno está pendiente de activación.
                      </p>

                      <p className="mt-1 text-sm text-yellow-800">
                        Una vez que Recursos Humanos haya recibido y
                        validado la documentación correspondiente, puede
                        activar al alumno.
                      </p>

                      <div className="mt-4">
                        <ActivarAlumno
                          asignacionId={asignacion.id}
                        />
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              FOTOGRAFÍA DEL ALUMNO
          =================================================== */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-gray-900">
              Fotografía del alumno
            </h3>

            <div className="mt-5 flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">

              <div className="flex h-48 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-[#B38E5D] bg-gray-50">

                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={`Fotografía de ${solicitud.nombre}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="px-4 text-center">

                    <div className="mb-2 text-4xl">
                      📷
                    </div>

                    <p className="text-sm text-gray-500">
                      Sin fotografía
                    </p>

                  </div>
                )}

              </div>

              <div className="mt-4 sm:mt-0">
                <p className="text-sm text-gray-600">
                  Fotografía proporcionada por el alumno para su expediente
                  y credencial.
                </p>
              </div>

            </div>
          </div>

          {/* ==================================================
              DATOS PERSONALES
          =================================================== */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-gray-900">
              Datos personales
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">
                  Nombre completo
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.nombre}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Domicilio
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.domicilio}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Teléfono celular
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.telefono}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Correo electrónico
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.correo}
                </p>
              </div>

            </div>
          </div>

          {/* ==================================================
              DATOS ACADÉMICOS
          =================================================== */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-gray-900">
              Datos académicos
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">
                  Institución educativa
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.institucion_educativa}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Carrera
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.carrera}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Semestre / Cuatrimestre
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.semestre_cuatrimestre}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Matrícula / Número de control
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.matricula}
                </p>
              </div>

            </div>
          </div>

          {/* ==================================================
              DATOS DE LA SOLICITUD
          =================================================== */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-semibold text-gray-900">
              Datos de la solicitud
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">
                  Tipo de proceso
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.tipo_proceso}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Estado
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.estado}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Fecha de inicio
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.fecha_inicio}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Horario propuesto
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.horario_propuesto}
                </p>
              </div>

            </div>

            <div className="mt-5">

              <p className="text-sm text-gray-500">
                Información adicional
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {solicitud.informacion_adicional ||
                  "Sin información adicional."}
              </p>

            </div>

          </div>

          {/* ==================================================
              ACCIONES
          =================================================== */}

          <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">

            <div />

            <div className="flex flex-wrap items-center gap-3">

              {solicitud.estado === "Asignada" && (
                <Link
                  href={`/rh/solicitud/${solicitud.id}/imprimir`}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  🖨️ Imprimir formato
                </Link>
              )}

              <DecisionSolicitud
                solicitudId={solicitud.id}
                estado={solicitud.estado}
              />

            </div>

          </div>

          {/* ==================================================
              POSIBLES VACANTES
          =================================================== */}

          {solicitud.estado === "Aceptada" && (
            <PosiblesNecesidades
              solicitudId={solicitud.id}
              carreraAlumno={solicitud.carrera}
              necesidades={necesidades ?? []}
            />
          )}

        </div>
      </section>
    </main>
  );
}