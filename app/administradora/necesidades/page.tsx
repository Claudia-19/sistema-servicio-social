import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NecesidadesAdministradoraPage() {
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
    .select("rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 4) {
    redirect("/dashboard");
  }

  // Obtener las necesidades registradas por todos los coordinadores
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
  created_at
`)

    .order("created_at", { ascending: false });
 const { data: areas } = await supabase
  .from("areas")
  .select("id, nombre")
  .order("nombre");
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">
            Sistema de Control de Servicio Social
          </h1>

          <p className="text-sm text-gray-500">
            Consulta de necesidades de las áreas
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
            Necesidades de las áreas
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta las vacantes registradas por los coordinadores.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No fue posible cargar las necesidades.
          </div>
        )}

        {/* Lista */}
        {!necesidades || necesidades.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="font-medium text-gray-900">
              No hay necesidades registradas
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Cuando los coordinadores registren necesidades, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {necesidades.map((necesidad) => (
              <div
                key={necesidad.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                {/* Encabezado de la necesidad */}
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Área de adscripción
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-gray-900">
  {areas?.find((area) => area.id === necesidad.area_id)?.nombre ??
    "Área no disponible"}
</h3>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                      necesidad.estado === "Disponible"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {necesidad.estado}
                  </span>
                </div>

                {/* Información */}
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">
                      Carrera requerida
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidad.carrera === "Otra"
                        ? necesidad.carrera_otra || "No especificada"
                        : necesidad.carrera}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Nivel académico
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidad.nivel_academico}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Perfil requerido
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidad.perfil_requerido}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Vacantes disponibles
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidad.vacantes_disponibles}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Horario
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidad.horario}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Jefe inmediato
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {necesidad.jefe_inmediato}
                    </p>
                  </div>
                </div>

                {/* Actividades */}
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-sm font-medium text-gray-500">
                    Actividades
                  </p>

                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
                    <li>{necesidad.actividad_1}</li>
                    <li>{necesidad.actividad_2}</li>
                    <li>{necesidad.actividad_3}</li>
                  </ol>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}