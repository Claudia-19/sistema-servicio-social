import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function SolicitudAdministradoraPage({
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

  // Verificar que sea Administradora
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, apellido_paterno, rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 4) {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Obtener solicitud
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
          <h1 className="text-xl font-bold text-[#621132]">
            No se encontró la solicitud
          </h1>

          <p className="mt-2 text-gray-600">
            La solicitud que intentas consultar no existe.
          </p>

          <Link
            href="/administradora/solicitudes"
            className="mt-5 inline-block rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
          >
            Regresar a solicitudes
          </Link>
        </div>
      </main>
    );
  }

  // ============================================================
  // OBTENER FOTOGRAFÍA PRIVADA
  // ============================================================

  let fotoUrl: string | null = null;

  if (solicitud.fotografia_url) {
    let rutaFotografia = solicitud.fotografia_url;

    // Compatibilidad con URLs antiguas
    if (
      rutaFotografia.includes(
        "/storage/v1/object/public/fotos-alumnos/"
      )
    ) {
      rutaFotografia = rutaFotografia.split(
        "/storage/v1/object/public/fotos-alumnos/"
      )[1];
    }

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
  // OBTENER ASIGNACIÓN DEFINITIVA
  // ============================================================

  let asignacion: any = null;

  if (solicitud.estado === "Asignada") {
    const { data } = await supabase
      .from("asignaciones")
      .select(`
        id,
        estado,
        fecha_autorizacion,
        necesidad_id,
        necesidades (
          id,
          carrera,
          carrera_otra,
          nivel_academico,
          perfil_requerido,
          horario,
          jefe_inmediato,
          vacantes_disponibles,
          estado,
          area_asignada,
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

  const areaAdscripcion = necesidadAsignada?.areas
    ? Array.isArray(necesidadAsignada.areas)
      ? necesidadAsignada.areas[0]
      : necesidadAsignada.areas
    : null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ENCABEZADO INSTITUCIONAL */}
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
              {usuario.nombre} {usuario.apellido_paterno}
            </p>

            <p className="text-xs text-white/80">
              Administradora
            </p>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/administradora/solicitudes"
            className="text-sm font-medium text-[#621132] transition hover:text-[#9D2449]"
          >
            ← Regresar a solicitudes
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Detalle de solicitud
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta la información proporcionada por el alumno.
          </p>
        </div>

        <div className="space-y-6">

          {/* ESTADO */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#707272]">
                  Estado de la solicitud
                </p>

                <h3 className="mt-1 text-xl font-bold text-[#621132]">
                  {solicitud.estado}
                </h3>
              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${
                  solicitud.estado === "Asignada"
                    ? "bg-green-100 text-green-700"
                    : solicitud.estado === "Aceptada"
                    ? "bg-[#D4C29C]/40 text-[#621132]"
                    : solicitud.estado === "Rechazada"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {solicitud.estado}
              </span>
            </div>
          </div>

          {/* ASIGNACIÓN DEFINITIVA */}
          {solicitud.estado === "Asignada" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-green-900">
                Asignación autorizada
              </h3>

              <p className="mt-1 text-sm text-green-800">
                La Administradora autorizó esta asignación. Es la asignación
                definitiva del alumno.
              </p>

              {necesidadAsignada && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Área de adscripción
                    </p>

                    <p className="mt-1 font-semibold text-[#621132]">
                      {areaAdscripcion?.nombre ?? "Sin área"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Área asignada
                    </p>

                    <p className="mt-1 font-semibold text-[#621132]">
                      {necesidadAsignada.area_asignada ||
                        "Sin área asignada"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Carrera requerida
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidadAsignada.carrera_otra ||
                        necesidadAsignada.carrera ||
                        "Sin especificar"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Nivel académico
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidadAsignada.nivel_academico ||
                        "Sin especificar"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Horario
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidadAsignada.horario ||
                        "Sin especificar"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Jefe inmediato
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidadAsignada.jefe_inmediato ||
                        "Sin especificar"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-4 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Fecha de autorización
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {asignacion?.fecha_autorizacion
                        ? new Date(
                            asignacion.fecha_autorizacion
                          ).toLocaleString("es-MX")
                        : "Sin fecha registrada"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FOTOGRAFÍA */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#621132]">
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
                    <div className="mb-2 text-4xl">📷</div>

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

          {/* DATOS PERSONALES */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#621132]">
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

          {/* DATOS ACADÉMICOS */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#621132]">
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

          {/* DATOS DE LA SOLICITUD */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#621132]">
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

          {/* REGRESAR */}
          <div className="border-t border-gray-200 pt-6">
            <Link
              href="/administradora/solicitudes"
              className="inline-flex rounded-lg bg-[#621132] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#9D2449]"
            >
              ← Regresar a solicitudes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}