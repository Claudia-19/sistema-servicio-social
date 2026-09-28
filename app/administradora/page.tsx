import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export const instant = false;

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

  // Consultar vacantes
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

  const solicitudesPendientes =
    solicitudes?.filter(
      (solicitud) => solicitud.estado === "Pendiente"
    ).length ?? 0;

  const vacantesDisponibles =
    necesidades?.filter(
      (necesidad) =>
        necesidad.estado === "Disponible" &&
        necesidad.vacantes_disponibles > 0
    ).length ?? 0;

  const totalVacantes =
    necesidades?.reduce(
      (total, necesidad) =>
        total + necesidad.vacantes_disponibles,
      0
    ) ?? 0;

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
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Panel general
          </h2>

          <p className="mt-2 text-gray-600">
            Supervisa las solicitudes, vacantes y asignaciones del sistema.
          </p>
        </div>

        {/* CONSULTAR */}
        <div className="mb-5 flex justify-end">
          <Link
            href="/administradora/consultas"
            className="inline-flex items-center gap-2 rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
          >
            🔎 Consultar
          </Link>
        </div>

        {/* RESUMEN */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Solicitudes
            </p>

            <p className="mt-2 text-3xl font-bold text-[#621132]">
              {solicitudes?.length ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Solicitudes pendientes
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-700">
              {solicitudesPendientes}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Vacantes disponibles
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {vacantesDisponibles}
            </p>
          </div>

          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Espacios disponibles
            </p>

            <p className="mt-2 text-3xl font-bold text-[#621132]">
              {totalVacantes}
            </p>
          </div>
        </div>

        {/* ACCIONES PRINCIPALES */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* SOLICITUDES */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Solicitudes
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Consulta las solicitudes realizadas por los alumnos.
            </p>

            <Link
              href="/administradora/solicitudes"
              className="mt-5 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Consultar solicitudes
            </Link>
          </div>

          {/* VACANTES */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Vacantes de las áreas
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Consulta las vacantes registradas por los coordinadores.
            </p>

            <Link
              href="/administradora/necesidades"
              className="mt-5 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Consultar vacantes
            </Link>
          </div>

          {/* PROPUESTAS */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Propuestas de asignación
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Revisa las propuestas, cambia la vacante si es necesario y
              autoriza la asignación definitiva.
            </p>

            <Link
              href="/administradora/propuestas"
              className="mt-5 inline-block rounded-lg bg-[#621132] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9D2449]"
            >
              Revisar propuestas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}