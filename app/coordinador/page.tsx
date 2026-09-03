import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import HeaderInstitucional from "@/components/HeaderInstitucional";
export default async function CoordinadorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar que el usuario sea Coordinador
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, apellido_paterno, apellido_materno, rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 3) {
    redirect("/dashboard");
  }

  // Obtener las necesidades registradas por este coordinador
  const { data: necesidades, error } = await supabase
  .from("necesidades")
  .select(`
    id,
    area_id,
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
    created_at,
    areas (
      nombre
    )
  `)
    .eq("coordinador_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <HeaderInstitucional
  nombreUsuario={`${usuario.nombre} ${usuario.apellido_paterno}`}
  rol="Coordinador"
  logoutButton={<LogoutButton />}
/>

      {/* Contenido */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Coordinador
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Necesidades y vacantes
            </h2>

            <p className="mt-2 text-gray-600">
              Registra y consulta las necesidades de tu área.
            </p>
          </div>

          <a
            href="/coordinador/nueva"
            className="inline-flex w-fit rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700"
          >
            + Registrar necesidad
          </a>
        </div>

        {/* Resumen */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Necesidades registradas
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {necesidades?.length ?? 0}
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

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Necesidades activas
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {necesidades?.filter(
  (necesidad) =>
    necesidad.estado === "Disponible" &&
    necesidad.vacantes_disponibles > 0
).length ?? 0}
            </p>
          </div>
        </div>

        {/* Lista */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h3 className="font-semibold text-gray-900">
              Mis necesidades
            </h3>
          </div>

          {error ? (
            <div className="p-6 text-sm text-red-700">
              No fue posible consultar las necesidades.
            </div>
          ) : necesidades && necesidades.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {necesidades.map((necesidad) => (
                <div
                  key={necesidad.id}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
  {Array.isArray(necesidad.areas)
    ? (necesidad.areas[0] as { nombre?: string })?.nombre
    : (necesidad.areas as { nombre?: string } | null)?.nombre}
</h4>

                      <p className="mt-1 text-sm text-gray-600">
                        {necesidad.carrera}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {necesidad.perfil_requerido}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          Vacantes: {necesidad.vacantes_disponibles}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {necesidad.horario}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {necesidad.estado}
                        </span>
                      </div>
                    </div>

                    
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="text-gray-500">
                Aún no tienes necesidades registradas.
              </p>

              <a
                href="/coordinador/nueva"
                className="mt-4 inline-block text-sm font-medium text-gray-900 underline"
              >
                Registrar primera necesidad
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}