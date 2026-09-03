import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

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
    .select("nombre, apellido_paterno, apellido_materno, email")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Sistema de Control de Servicio Social
            </h1>

            <p className="text-sm text-gray-500">
              Panel del alumno
            </p>
          </div>

          <div className="flex items-center gap-4">
  <span className="text-sm text-gray-600">
    {alumno?.email ?? user.email}
  </span>

  <LogoutButton />
</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Alumno / Prestador
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Bienvenido{alumno?.nombre ? `, ${alumno.nombre}` : ""}
          </h2>

          <p className="mt-2 text-gray-600">
            Desde este panel podrás gestionar tu solicitud de servicio social.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Mi solicitud
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Registra y consulta tu solicitud de servicio social.
            </p>

            <a
              href="/alumno/solicitud"
              className="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Ver solicitud
            </a>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Estado de solicitud
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Consulta el avance de tu proceso.
            </p>

            <span className="mt-5 inline-block rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Pendiente
            </span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Consulta las notificaciones relacionadas con tu proceso.
            </p>

            <span className="mt-5 inline-block text-sm text-gray-500">
              Sin notificaciones
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}