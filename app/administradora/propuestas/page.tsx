import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import DecisionAsignacion from "@/components/DecisionAsignacion";
import CambiarNecesidadAsignacion from "@/components/CambiarNecesidadAsignacion";

export const instant = false;

export default async function PropuestasPage() {
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

  // Obtener únicamente propuestas pendientes
  const { data: asignaciones, error } = await supabase
    .from("asignaciones")
    .select(`
      id,
      necesidad_id,
      estado,
      observaciones,
      created_at,
      solicitudes (
        id,
        usuario_id,
        nombre,
        carrera,
        matricula,
        correo,
        tipo_proceso,
        fecha_inicio,
        horario_propuesto,
        informacion_adicional,
        fotografia_url,
        estado
      ),
      necesidades (
        id,
        perfil_requerido,
        carrera,
        carrera_otra,
        nivel_academico,
        actividad_1,
        actividad_2,
        actividad_3,
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
    .eq("estado", "Pendiente")
    .order("created_at", { ascending: false });

  // ============================================================
  // GENERAR URLS FIRMADAS DE LAS FOTOGRAFÍAS
  // ============================================================

  const fotosPorSolicitud: Record<string, string | null> = {};

  if (asignaciones) {
    for (const asignacion of asignaciones) {
      const solicitud = Array.isArray(asignacion.solicitudes)
        ? asignacion.solicitudes[0]
        : asignacion.solicitudes;

      if (!solicitud?.id || !solicitud?.fotografia_url) {
        if (solicitud?.id) {
          fotosPorSolicitud[solicitud.id] = null;
        }

        continue;
      }

      let rutaFotografia = solicitud.fotografia_url;

      /*
       * Compatibilidad con fotografías antiguas que guardaron
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

      if (!rutaFotografia) {
        fotosPorSolicitud[solicitud.id] = null;
        continue;
      }

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("fotos-alumnos")
          .createSignedUrl(rutaFotografia, 60 * 60);

      if (signedUrlError) {
        console.error(
          `Error al generar URL de fotografía para solicitud ${solicitud.id}:`,
          signedUrlError
        );

        fotosPorSolicitud[solicitud.id] = null;
      } else {
        fotosPorSolicitud[solicitud.id] =
          signedUrlData?.signedUrl ?? null;
      }
    }
  }

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

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {usuario.nombre} {usuario.apellido_paterno}
              </p>

              <p className="text-xs text-white/80">
                Administradora
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <a
          href="/administradora"
          className="text-sm text-[#621132] transition hover:text-[#9D2449]"
        >
          ← Regresar al panel
        </a>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#707272]">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Propuestas de asignación
          </h2>

          <p className="mt-2 text-gray-600">
            Revisa las propuestas generadas por Recursos Humanos antes de
            autorizar la asignación.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              No fue posible consultar las propuestas.
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error.message}
            </p>
          </div>
        )}

        {/* SIN PROPUESTAS */}
        {!error && (!asignaciones || asignaciones.length === 0) && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4C29C]/30">
              <span className="text-xl text-[#621132]">✓</span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              No hay propuestas pendientes
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Cuando Recursos Humanos genere una propuesta de asignación,
              aparecerá aquí para su revisión.
            </p>
          </div>
        )}

        {/* PROPUESTAS */}
        <div className="space-y-6">
          {asignaciones?.map((asignacion: any) => {
            const solicitud = Array.isArray(asignacion.solicitudes)
              ? asignacion.solicitudes[0]
              : asignacion.solicitudes;

            const necesidad = Array.isArray(asignacion.necesidades)
              ? asignacion.necesidades[0]
              : asignacion.necesidades;

            const area = necesidad?.areas
              ? Array.isArray(necesidad.areas)
                ? necesidad.areas[0]
                : necesidad.areas
              : null;

            const fotoUrl = solicitud?.id
              ? fotosPorSolicitud[solicitud.id] ?? null
              : null;

            return (
              <div
                key={asignacion.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {/* ENCABEZADO */}
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#707272]">
                        Propuesta #{asignacion.id}
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-[#621132]">
                        {solicitud?.nombre}
                      </h3>
                    </div>

                    <span className="w-fit rounded-full bg-[#D4C29C]/40 px-3 py-1 text-xs font-medium text-[#621132]">
                      Pendiente de autorización
                    </span>
                  </div>
                </div>

                {/* INFORMACIÓN */}
                <div className="grid gap-6 p-6 md:grid-cols-2">
                  {/* DATOS DEL ALUMNO */}
                  <div>
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#707272]">
                      Datos del alumno
                    </h4>

                    {/* FOTOGRAFÍA */}
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-[#B38E5D] bg-gray-50">
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={`Fotografía de ${solicitud?.nombre}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="px-2 text-center">
                            <div className="mb-1 text-3xl">
                              📷
                            </div>

                            <p className="text-xs text-gray-500">
                              Sin fotografía
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#707272]">
                          Fotografía
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          Fotografía proporcionada por el alumno para su
                          expediente y credencial.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Nombre:</strong>{" "}
                        {solicitud?.nombre}
                      </p>

                      <p>
                        <strong>Carrera:</strong>{" "}
                        {solicitud?.carrera}
                      </p>

                      <p>
                        <strong>Matrícula:</strong>{" "}
                        {solicitud?.matricula}
                      </p>

                      <p>
                        <strong>Tipo de proceso:</strong>{" "}
                        {solicitud?.tipo_proceso}
                      </p>

                      <p>
                        <strong>Correo:</strong>{" "}
                        {solicitud?.correo}
                      </p>

                      <p>
                        <strong>Fecha de inicio:</strong>{" "}
                        {solicitud?.fecha_inicio}
                      </p>

                      <p>
                        <strong>Horario propuesto:</strong>{" "}
                        {solicitud?.horario_propuesto}
                      </p>
                    </div>
                  </div>

                  {/* VACANTE */}
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[#707272]">
                        Vacante propuesta
                      </h4>

                      <span className="rounded-full bg-[#9D2449]/10 px-3 py-1 text-xs font-medium text-[#9D2449]">
                        Modificable
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Área de adscripción:</strong>{" "}
                        {area?.nombre ?? "Sin área"}
                      </p>

                      <p>
                        <strong>Área asignada:</strong>{" "}
                        {necesidad?.area_asignada ||
                          "Sin área asignada"}
                      </p>

                      <p>
                        <strong>Perfil requerido:</strong>{" "}
                        {necesidad?.perfil_requerido}
                      </p>

                      <p>
                        <strong>Carrera requerida:</strong>{" "}
                        {necesidad?.carrera_otra ||
                          necesidad?.carrera}
                      </p>

                      <p>
                        <strong>Nivel académico:</strong>{" "}
                        {necesidad?.nivel_academico}
                      </p>

                      <p>
                        <strong>Horario:</strong>{" "}
                        {necesidad?.horario}
                      </p>

                      <p>
                        <strong>Jefe inmediato:</strong>{" "}
                        {necesidad?.jefe_inmediato}
                      </p>

                      <p>
                        <strong>Vacantes disponibles:</strong>{" "}
                        {necesidad?.vacantes_disponibles}
                      </p>
                    </div>

                    {/* CAMBIO DE VACANTE */}
                    <CambiarNecesidadAsignacion
                      asignacionId={asignacion.id}
                      necesidadActualId={necesidad?.id}
                    />
                  </div>

                  {/* ACTIVIDADES */}
                  <div className="md:col-span-2">
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#707272]">
                      Actividades a realizar
                    </h4>

                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                      <ol className="list-decimal space-y-2 pl-5">
                        {necesidad?.actividad_1 && (
                          <li>{necesidad.actividad_1}</li>
                        )}

                        {necesidad?.actividad_2 && (
                          <li>{necesidad.actividad_2}</li>
                        )}

                        {necesidad?.actividad_3 && (
                          <li>{necesidad.actividad_3}</li>
                        )}
                      </ol>
                    </div>
                  </div>

                  {/* INFORMACIÓN ADICIONAL */}
                  {solicitud?.informacion_adicional && (
                    <div className="md:col-span-2">
                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#707272]">
                        Información adicional del alumno
                      </h4>

                      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                        {solicitud.informacion_adicional}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCIONES */}
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
                  <DecisionAsignacion
                    asignacionId={asignacion.id}
                    correo={solicitud?.correo}
                    nombre={solicitud?.nombre}
                    area={
                      area?.nombre ?? "Área asignada"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}