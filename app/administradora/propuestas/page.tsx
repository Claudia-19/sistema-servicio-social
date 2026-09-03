import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import DecisionAsignacion from "@/components/DecisionAsignacion";

export default async function PropuestasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar Administradora
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, apellido_paterno, rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 4) {
    redirect("/dashboard");
  }

  // Obtener propuestas pendientes
  const { data: asignaciones, error } = await supabase
    .from("asignaciones")
    .select(`
      id,
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
        estado
      ),
      necesidades (
        id,
        perfil_requerido,
        carrera,
        nivel_academico,
        actividades_a_realizar,
        horario,
        jefe_inmediato,
        vacantes_disponibles,
        estado,
        areas (
          nombre
        )
      )
    `)
    .eq("estado", "Pendiente")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Sistema de Control de Servicio Social
            </h1>

            <p className="text-sm text-gray-500">
              Propuestas de asignación
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {usuario.nombre} {usuario.apellido_paterno}
              </p>

              <p className="text-xs text-gray-500">
                Administradora
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Contenido */}
      <section className="mx-auto max-w-7xl px-6 py-10">

        <a
          href="/administradora"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Regresar al panel
        </a>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Propuestas de asignación
          </h2>

          <p className="mt-2 text-gray-600">
            Revisa las propuestas generadas por el sistema antes de autorizar
            la asignación.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              No fue posible consultar las propuestas.
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error.message}
            </p>
          </div>
        )}

        {/* Propuestas */}
        {!error && (!asignaciones || asignaciones.length === 0) && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              No hay propuestas pendientes
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Cuando el sistema genere una propuesta de asignación,
              aparecerá aquí para su revisión.
            </p>
          </div>
        )}

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

            return (
              <div
                key={asignacion.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Encabezado de propuesta */}
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Propuesta #{asignacion.id}
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        {solicitud?.nombre}
                      </h3>
                    </div>

                    <span className="w-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                      Pendiente de autorización
                    </span>
                  </div>
                </div>

                {/* Información */}
                <div className="grid gap-6 p-6 md:grid-cols-2">

                  {/* Alumno */}
                  <div>
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Datos del alumno
                    </h4>

                    <div className="space-y-2 text-sm">
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

                  {/* Necesidad */}
                  <div>
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Vacante propuesta
                    </h4>

                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Área:</strong>{" "}
                        {area?.nombre ?? "Sin área"}
                      </p>

                      <p>
                        <strong>Perfil requerido:</strong>{" "}
                        {necesidad?.perfil_requerido}
                      </p>

                      <p>
                        <strong>Carrera requerida:</strong>{" "}
                        {necesidad?.carrera}
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
                  </div>

                  {/* Actividades */}
                  <div className="md:col-span-2">
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Actividades a realizar
                    </h4>

                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                      {necesidad?.actividades_a_realizar}
                    </div>
                  </div>

                  {/* Información adicional */}
                  {solicitud?.informacion_adicional && (
                    <div className="md:col-span-2">
                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Información adicional del alumno
                      </h4>

                      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                        {solicitud.informacion_adicional}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
<div className="border-t border-gray-100 px-6 py-5">
  <DecisionAsignacion
  asignacionId={asignacion.id}
  correo={solicitud?.correo}
  nombre={solicitud?.nombre}
  area={area?.nombre ?? "Área asignada"}
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