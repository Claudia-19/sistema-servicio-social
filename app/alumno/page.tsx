import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ActividadesAsignacion from "@/components/ActividadesAsignacion";

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
    .select(
      "nombre, apellido_paterno, apellido_materno, email, foto_url"
    )
    .eq("id", user.id)
    .single();

  // ============================================================
  // OBTENER LA SOLICITUD DEL ESTUDIANTE
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
      "Error al consultar la solicitud del estudiante:",
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
      .select(
        "id, necesidad_id, estado, fecha_autorizacion"
      )
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

    return new Date(
      `${fecha}T00:00:00`
    ).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ============================================================
  // ESTADO Y NOTIFICACIÓN
  // ============================================================
  const estadoSolicitud = solicitud?.estado ?? null;

  let textoEstado = "Generar solicitud";
  let textoNotificacion =
    "Aún no cuenta con una solicitud registrada. Puede generar su solicitud para iniciar su proceso.";

  if (estadoSolicitud === "Pendiente") {
    textoEstado = "Pendiente";
    textoNotificacion =
      "Su solicitud fue recibida correctamente y se encuentra en proceso de revisión. Le recomendamos estar pendiente de su correo electrónico.";
  }

  if (estadoSolicitud === "Aceptada") {
    textoEstado = "Aceptada";
    textoNotificacion =
      "Su solicitud ha sido aceptada. Le recomendamos estar pendiente de su correo electrónico para recibir información sobre el seguimiento de su proceso.";
  }

  if (estadoSolicitud === "Asignada") {
    textoEstado = "Asignada";
    textoNotificacion =
      "Su solicitud cuenta con una asignación autorizada. Le recomendamos consultar la información de su asignación y estar pendiente de su correo electrónico.";
  }

  if (estadoSolicitud === "Rechazada") {
    textoEstado = "Rechazada";
    textoNotificacion =
      "Su solicitud fue rechazada. Consulte las observaciones disponibles para conocer información relacionada con el resultado de su proceso.";
  }

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
                {nombreCompleto || "Estudiante"}
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
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Estudiante
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Bienvenido
            {alumno?.nombre
              ? `, ${alumno.nombre}`
              : ""}
          </h2>

          <p className="mt-2 text-[#707272]">
            Desde este panel podrá consultar y dar seguimiento
            a su proceso.
          </p>
        </div>

        {/* TARJETAS PRINCIPALES */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* MI SOLICITUD */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-[#621132]" />

            <h3 className="text-lg font-semibold text-[#621132]">
              Mi solicitud
            </h3>

            <p className="mt-2 text-sm text-[#707272]">
              {solicitud
                ? "Consulte la información registrada en su solicitud."
                : "Genere su solicitud para iniciar su proceso."}
            </p>

            {!solicitud ? (
              <a
                href="/alumno/solicitud"
                className="mt-5 inline-block rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
              >
                Generar solicitud
              </a>
            ) : (
              <a
                href="/alumno/solicitud"
                className="mt-5 inline-block rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
              >
                Ver solicitud
              </a>
            )}
          </div>

          {/* ESTADO */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-[#B38E5D]" />

            <h3 className="text-lg font-semibold text-[#621132]">
              Estado de solicitud
            </h3>

            <p className="mt-2 text-sm text-[#707272]">
              Consulte el avance actual de su proceso.
            </p>

            <span className="mt-5 inline-block rounded-lg bg-[#D4C29C] px-4 py-2 text-sm font-medium text-[#621132]">
              {textoEstado}
            </span>

            {areaAsignada && (
              <p className="mt-3 text-sm text-[#707272]">
                <strong className="text-[#621132]">
                  Área asignada:
                </strong>{" "}
                {areaAsignada}
              </p>
            )}
          </div>

          {/* NOTIFICACIONES */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-[#9D2449]" />

            <h3 className="text-lg font-semibold text-[#621132]">
              Notificaciones
            </h3>

            <p className="mt-2 text-sm text-[#707272]">
              Consulte las notificaciones relacionadas con su
              proceso.
            </p>

            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <p className="text-sm leading-6 text-[#707272]">
                {textoNotificacion}
              </p>
            </div>
          </div>
        </div>

        {/* INFORMACIÓN DE LA ASIGNACIÓN */}
        {asignacionAutorizada &&
          datosAsignacion && (
            <div className="mt-8 rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
              <div className="mb-6">
                <div className="mb-4 h-1 w-12 rounded-full bg-[#B38E5D]" />

                <h3 className="text-xl font-semibold text-[#621132]">
                  Información de mi asignación
                </h3>

                <p className="mt-1 text-sm text-[#707272]">
                  Información de la vacante a la que fue
                  asignado.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#707272]">
                    Área de adscripción
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#621132]">
                    {areaAsignada ||
                      "No disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#707272]">
                    Carrera requerida
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {datosAsignacion.carrera ||
                      "No disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#707272]">
                    Nivel académico
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {datosAsignacion.nivel_academico ||
                      "No disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#707272]">
                    Horario
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {datosAsignacion.horario ||
                      "No disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#707272]">
                    Jefe inmediato
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {datosAsignacion.jefe_inmediato ||
                      "No disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#707272]">
                    Perfil requerido
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {datosAsignacion.perfil_requerido ||
                      "No disponible"}
                  </p>
                </div>
              </div>

              <ActividadesAsignacion
                actividad1={datosAsignacion.actividad_1}
                actividad2={datosAsignacion.actividad_2}
                actividad3={datosAsignacion.actividad_3}
              />
            </div>
          )}

        {/* DOCUMENTOS */}
        {asignacionAutorizada && (
          <div className="mt-8 rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 h-1 w-12 rounded-full bg-[#621132]" />

              <h3 className="text-xl font-semibold text-[#621132]">
                Documentos
              </h3>

              <p className="mt-1 text-sm text-[#707272]">
                Consulte e imprima los documentos
                correspondientes a su asignación.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="/alumno/solicitud/imprimir"
                className="rounded-lg border border-[#621132] bg-white px-5 py-4 transition hover:border-[#9D2449] hover:bg-gray-50"
              >
                <p className="font-semibold text-[#621132]">
                  Formato oficial de solicitud
                </p>

                <p className="mt-1 text-sm text-[#707272]">
                  Consultar e imprimir el formato con sus datos.
                </p>
              </a>

              <a
                href="/alumno/carta-confidencialidad"
                className="rounded-lg border border-[#621132] bg-white px-5 py-4 transition hover:border-[#9D2449] hover:bg-gray-50"
              >
                <p className="font-semibold text-[#621132]">
                  Carta de confidencialidad
                </p>

                <p className="mt-1 text-sm text-[#707272]">
                  Consultar e imprimir la carta con sus datos.
                </p>
              </a>
            </div>

            <div className="mt-6 rounded-lg border border-[#D4C29C] bg-[#D4C29C]/30 p-4">
              <p className="text-sm leading-6 text-[#707272]">
                <strong className="text-[#621132]">
                  Importante:
                </strong>{" "}
                Deberá presentarse en el Departamento de
                Profesionalización con su carta de presentación
                y los documentos correspondientes para continuar
                con su proceso.
              </p>
            </div>
          </div>
        )}
              {/* CONTROL DE HORAS */}
      {asignacionAutorizada && (
        <div className="mt-8 rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-4 h-1 w-12 rounded-full bg-[#B38E5D]" />

            <h3 className="text-xl font-semibold text-[#621132]">
              Control de horas
            </h3>

            <p className="mt-1 text-sm text-[#707272]">
              Consulte el avance de las horas registradas durante su
              servicio social o prácticas profesionales.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-[#621132]">
                Consulta de horas
              </p>

              <p className="mt-1 text-sm text-[#707272]">
                Consulte las horas requeridas, realizadas, restantes y
                el registro mensual.
              </p>
            </div>

            <a
              href="/alumno/horas"
              className="inline-flex items-center justify-center rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
            >
              ⏱️ Consultar horas
            </a>
          </div>
        </div>
      )}
      </section>
    </main>
  );
}