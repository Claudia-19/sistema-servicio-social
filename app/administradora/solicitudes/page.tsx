import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SolicitudesAdministradoraPage() {
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
    .select("rol_id, nombre, apellido_paterno")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 4) {
    redirect("/dashboard");
  }

  // Obtener todas las solicitudes
  const { data: solicitudes, error } = await supabase
    .from("solicitudes")
    .select(`
      id,
      nombre,
      institucion_educativa,
      carrera,
      semestre_cuatrimestre,
      tipo_proceso,
      fecha_inicio,
      horario_propuesto,
      estado,
      fecha_solicitud
    `)
    .order("fecha_solicitud", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">
            Sistema de Control de Servicio Social
          </h1>

          <p className="text-sm text-gray-500">
            Consulta de solicitudes
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Título */}
        <div className="mb-8">
          <Link
            href="/administradora"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Regresar al panel
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Solicitudes
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta las solicitudes realizadas por los alumnos.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No fue posible cargar las solicitudes.
          </div>
        )}

        {/* Solicitudes */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h3 className="font-semibold text-gray-900">
              Solicitudes registradas
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {solicitudes?.length ?? 0} solicitud(es) registrada(s)
            </p>
          </div>

          {!solicitudes || solicitudes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-gray-900">
                No hay solicitudes registradas
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Cuando un alumno registre una solicitud, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {solicitud.nombre}
                      </h4>

                      <p className="mt-1 text-sm text-gray-600">
                        {solicitud.carrera}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {solicitud.institucion_educativa}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {solicitud.tipo_proceso}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {solicitud.semestre_cuatrimestre}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          Inicio: {solicitud.fecha_inicio}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          solicitud.estado === "Aceptada"
                            ? "bg-green-100 text-green-700"
                            : solicitud.estado === "Rechazada"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {solicitud.estado}
                      </span>

                      <Link
                        href={`/rh/solicitud/${solicitud.id}`}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Ver solicitud
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}