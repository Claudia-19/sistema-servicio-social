import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default async function AdministradoraPage() {
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
    .select("nombre, apellido_paterno, apellido_materno, rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 4) {
    redirect("/dashboard");
  }

  // Consultar solicitudes
  const { data: solicitudes } = await supabase
    .from("solicitudes")
    .select("id, nombre, carrera, tipo_proceso, estado")
    .order("fecha_solicitud", { ascending: false });

  // Consultar necesidades
  const { data: necesidades } = await supabase
    .from("necesidades")
    .select(`
      id,
      perfil_requerido,
      carrera,
      vacantes_disponibles,
      estado,
      areas (
        nombre
      )
    `)
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
              Panel de Administradora
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
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Panel general
          </h2>

          <p className="mt-2 text-gray-600">
            Supervisa las solicitudes, necesidades y asignaciones del sistema.
          </p>
        </div>

        {/* Resumen */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Solicitudes
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
              Necesidades
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {necesidades?.filter(
  (necesidad) =>
    necesidad.estado === "Disponible" &&
    necesidad.vacantes_disponibles > 0
).length ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Vacantes disponibles
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {necesidades?.reduce(
                (total, necesidad) =>
                  total + necesidad.vacantes_disponibles,
                0
              ) ?? 0}
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Solicitudes
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Consulta las solicitudes realizadas por los alumnos.
            </p>

            <Link
  href="/administradora/solicitudes"
  className="mt-5 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
>
  Consultar solicitudes
</Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Necesidades de las áreas
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Consulta las vacantes registradas por los coordinadores.
            </p>

            <Link
  href="/administradora/necesidades"
  className="mt-5 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
>
  Consultar necesidades
</Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Propuestas de asignación
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Revisa y autoriza las propuestas generadas por el sistema.
            </p>

            <Link
  href="/administradora/propuestas"
  className="mt-5 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
>
  Revisar propuestas
</Link>
          </div>
        </div>
      </section>
    </main>
  );
}