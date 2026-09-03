import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default async function RHPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar que el usuario sea Recursos Humanos
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, apellido_paterno, apellido_materno, rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 2) {
    redirect("/dashboard");
  }

  // Obtener solicitudes
  const { data: solicitudes, error } = await supabase
    .from("solicitudes")
    .select(
      `
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
      `
    )
    .order("fecha_solicitud", { ascending: false });

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
            Panel de Recursos Humanos
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {usuario.nombre} {usuario.apellido_paterno}
            </p>

            <p className="text-xs text-gray-500">
              Recursos Humanos
            </p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>

      {/* Contenido */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Recursos Humanos
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Solicitudes
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta y revisa las solicitudes recibidas.
          </p>
        </div>

        {/* Resumen */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total de solicitudes
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {solicitudes?.length ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Pendientes
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {solicitudes?.filter(
                (solicitud) => solicitud.estado === "Pendiente"
              ).length ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Aceptadas
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {solicitudes?.filter(
                (solicitud) => solicitud.estado === "Aceptada"
              ).length ?? 0}
            </p>
          </div>
        </div>

        {/* Solicitudes */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h3 className="font-semibold text-gray-900">
              Solicitudes recibidas
            </h3>
          </div>

          {error ? (
            <div className="p-6 text-sm text-red-700">
              No fue posible consultar las solicitudes.
            </div>
          ) : solicitudes && solicitudes.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="p-6 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
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
                      <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800">
                        {solicitud.estado}
                      </span>

                      <a
  href={`/rh/solicitud/${solicitud.id}`}
  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
>
  Revisar
</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="text-gray-500">
                No hay solicitudes registradas.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}