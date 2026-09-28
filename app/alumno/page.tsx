import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export const instant = false;

export default async function AlumnoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: alumno } = await supabase
    .from("usuarios")
    .select("nombre, apellido_paterno, apellido_materno, email, foto_url")
    .eq("id", user.id)
    .single();

  // ============================================================
  // OBTENER LA SOLICITUD DEL ALUMNO
  // ============================================================
  const {
    data: solicitud,
    error: solicitudError,
  } = await supabase
    .from("solicitudes")
    .select(`
      id,
      estado,
      matricula,
      tipo_proceso,
      nombre,
      apellido_paterno,
      apellido_materno,
      domicilio,
      institucion_educativa,
      carrera,
      semestre_cuatrimestre,
      telefono,
      correo,
      fecha_inicio,
      horario_propuesto,
      informacion_adicional,
      fecha_solicitud
    `)
    .eq("usuario_id", user.id)
    .order("fecha_solicitud", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (solicitudError) {
    console.error(
      "Error al consultar la solicitud del alumno:",
      solicitudError
    );
  }

  let areaAsignada: string | null = null;
  let asignacionAutorizada = false;

  let datosAsignacion: {
    perfil_requerido: string | null;
    carrera: string | null;
    nivel_academico: string | null;
    actividad_1: string | null;
    actividad_2: string | null;
    actividad_3: string | null;
    horario: string | null;
    jefe_inmediato: string | null;
  } | null = null;

  // ============================================================
  // OBTENER INFORMACIÓN DE LA ASIGNACIÓN
  // ============================================================
  if (solicitud) {
    const { data: area } = await supabase.rpc(
      "obtener_area_asignada"
    );

    areaAsignada = area ?? null;

    const { data: asignacion } = await supabase
      .from("asignaciones")
      .select("id, necesidad_id, estado, fecha_autorizacion")
      .eq("solicitud_id", solicitud.id)
      .eq("estado", "Autorizada")
      .maybeSingle();

    if (asignacion) {
      asignacionAutorizada = true;

      if (asignacion.necesidad_id) {
        const { data: necesidad } = await supabase
          .from("necesidades")
          .select(`
            perfil_requerido,
            carrera,
            nivel_academico,
            actividad_1,
            actividad_2,
            actividad_3,
            horario,
            jefe_inmediato
          `)
          .eq("id", asignacion.necesidad_id)
          .maybeSingle();

        datosAsignacion = necesidad ?? null;
      }
    }
  }

  // ============================================================
  // NOMBRE COMPLETO
  // ============================================================
  const nombreCompleto =
    [
      solicitud?.nombre,
      solicitud?.apellido_paterno,
      solicitud?.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      alumno?.nombre,
      alumno?.apellido_paterno,
      alumno?.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ");

  // ============================================================
  // FORMATEAR FECHA
  // ============================================================
  const formatearFecha = (
    fecha: string | null | undefined
  ) => {
    if (!fecha) return "No disponible";

    return new Date(`${fecha}T00:00:00`).toLocaleDateString(
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
      {/* ENCABEZADO */}
      <header className="border-b border-vino-oscuro bg-vino-oscuro">
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
                {nombreCompleto || "Alumno"}
              </p>

              <p className="text-xs text-white/80">
                Alumno / Prestador
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-vino-claro">
            Alumno / Prestador
          </p>

          <h2 className="mt-2 text-3xl font-bold text-vino-oscuro">
            Bienvenido{alumno?.nombre ? `, ${alumno.nombre}` : ""}
          </h2>

          <p className="mt-2 text-gris-oscuro">
            Desde este panel podrás consultar y dar seguimiento a tu proceso.
          </p>
        </div>

        {/* TARJETAS PRINCIPALES */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* MI SOLICITUD */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Mi solicitud
            </h3>

            <p className="mt-2 text-sm text-gris-oscuro">
              Consulta la información registrada en tu solicitud.
            </p>

            <a
              href="/alumno/solicitud"
              className="mt-5 inline-block rounded-lg bg-vino-oscuro px-5 py-2.5 text-sm font-medium text-white transition hover:bg-vino-claro"
            >
              Ver solicitud
            </a>
          </div>

          {/* ESTADO */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-dorado-oscuro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Estado de solicitud
            </h3>

            <p className="mt-2 text-sm text-gris-oscuro">
              Consulta el avance actual de tu proceso.
            </p>

            <span className="mt-5 inline-block rounded-lg bg-dorado-claro px-4 py-2 text-sm font-medium text-vino-oscuro">
              {solicitud?.estado ?? "Sin solicitud"}
            </span>

            {areaAsignada && (
              <p className="mt-3 text-sm text-gris-oscuro">
                <strong className="text-vino-oscuro">
                  Área asignada:
                </strong>{" "}
                {areaAsignada}
              </p>
            )}
          </div>

          {/* NOTIFICACIONES */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-claro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Notificaciones
            </h3>

            <p className="mt-2 text-sm text-gris-oscuro">
              Consulta las notificaciones relacionadas con tu proceso.
            </p>

            <span className="mt-5 inline-block text-sm text-gris-oscuro">
              Sin notificaciones
            </span>
          </div>
        </div>

        {/* INFORMACIÓN COMPLETA DE LA SOLICITUD */}
        {solicitud && (
          <div className="mt-8 rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

              <h3 className="text-xl font-semibold text-vino-oscuro">
                Información de mi solicitud
              </h3>

              <p className="mt-1 text-sm text-gris-oscuro">
                Información registrada para tu proceso.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Nombre completo
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {nombreCompleto || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Matrícula
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.matricula || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Tipo de trámite
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.tipo_proceso || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Institución educativa
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.institucion_educativa || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Carrera
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.carrera || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Semestre / Cuatrimestre
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.semestre_cuatrimestre ||
                    "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Teléfono
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.telefono || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Correo electrónico
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.correo ||
                    alumno?.email ||
                    "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Fecha de solicitud
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {formatearFecha(solicitud.fecha_solicitud)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Fecha de inicio propuesta
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {formatearFecha(solicitud.fecha_inicio)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Horario
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.horario_propuesto ||
                    "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Área asignada
                </p>

                <p className="mt-1 text-sm font-medium text-vino-oscuro">
                  {areaAsignada || "Aún no asignada"}
                </p>
              </div>
            </div>

            {solicitud.domicilio && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Domicilio
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.domicilio}
                </p>
              </div>
            )}

            {solicitud.informacion_adicional && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Información adicional
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {solicitud.informacion_adicional}
                </p>
              </div>
            )}
          </div>
        )}

        {/* INFORMACIÓN DE LA ASIGNACIÓN */}
        {asignacionAutorizada && datosAsignacion && (
          <div className="mt-8 rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 h-1 w-12 rounded-full bg-dorado-oscuro" />

              <h3 className="text-xl font-semibold text-vino-oscuro">
                Información de mi asignación
              </h3>

              <p className="mt-1 text-sm text-gris-oscuro">
                Información de la vacante a la que fuiste asignado.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Área de adscripción
                </p>

                <p className="mt-1 text-sm font-medium text-vino-oscuro">
                  {areaAsignada || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Carrera requerida
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {datosAsignacion.carrera || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Nivel académico
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {datosAsignacion.nivel_academico ||
                    "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Horario
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {datosAsignacion.horario || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Jefe inmediato
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {datosAsignacion.jefe_inmediato ||
                    "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                  Perfil requerido
                </p>

                <p className="mt-1 text-sm text-gray-800">
                  {datosAsignacion.perfil_requerido ||
                    "No disponible"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gris-oscuro">
                Actividades a realizar
              </p>

              <div className="mt-3 space-y-3">
                {datosAsignacion.actividad_1 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-vino-oscuro">
                      Actividad 1
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {datosAsignacion.actividad_1}
                    </p>
                  </div>
                )}

                {datosAsignacion.actividad_2 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-vino-oscuro">
                      Actividad 2
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {datosAsignacion.actividad_2}
                    </p>
                  </div>
                )}

                {datosAsignacion.actividad_3 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-vino-oscuro">
                      Actividad 3
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {datosAsignacion.actividad_3}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTOS */}
        {asignacionAutorizada && (
          <div className="mt-8 rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

              <h3 className="text-xl font-semibold text-vino-oscuro">
                Documentos
              </h3>

              <p className="mt-1 text-sm text-gris-oscuro">
                Consulta e imprime los documentos correspondientes a tu
                asignación.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="/alumno/solicitud/imprimir"
                className="rounded-lg border border-vino-oscuro bg-white px-5 py-4 transition hover:border-vino-claro hover:bg-gray-50"
              >
                <p className="font-semibold text-vino-oscuro">
                  Formato oficial de solicitud
                </p>

                <p className="mt-1 text-sm text-gris-oscuro">
                  Consultar e imprimir el formato con tus datos.
                </p>
              </a>

              <a
                href="/alumno/carta-confidencialidad"
                className="rounded-lg border border-vino-oscuro bg-white px-5 py-4 transition hover:border-vino-claro hover:bg-gray-50"
              >
                <p className="font-semibold text-vino-oscuro">
                  Carta de confidencialidad
                </p>

                <p className="mt-1 text-sm text-gris-oscuro">
                  Consultar e imprimir la carta con tus datos.
                </p>
              </a>
            </div>

            <div className="mt-6 rounded-lg border border-dorado-claro bg-dorado-claro/30 p-4">
              <p className="text-sm leading-6 text-gris-oscuro">
                <strong className="text-vino-oscuro">
                  Importante:
                </strong>{" "}
                Deberás presentarte en el Departamento de Profesionalización
                con tu carta de presentación y los documentos correspondientes
                para continuar con tu proceso.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}