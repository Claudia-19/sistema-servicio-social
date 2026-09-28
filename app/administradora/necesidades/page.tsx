export const instant = false;
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
    .select("rol_id, nombre, apellido_paterno")
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
      area_asignada,
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

          <div className="text-right">
            <p className="text-sm font-medium text-white">
              {usuario.nombre} {usuario.apellido_paterno}
            </p>

            <p className="text-xs text-white/80">
              Administradora
            </p>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* TÍTULO */}
        <div className="mb-8">
          <Link
            href="/administradora"
            className="text-sm font-medium text-[#621132] transition hover:text-[#9D2449]"
          >
            ← Regresar al panel
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Necesidades de las áreas
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta las vacantes registradas por los coordinadores.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No fue posible cargar las necesidades.
          </div>
        )}

        {/* LISTA */}
        {!necesidades || necesidades.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4C29C]/30">
              <span className="text-xl text-[#621132]">
                ✓
              </span>
            </div>

            <p className="font-medium text-gray-900">
              No hay necesidades registradas
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Cuando los coordinadores registren necesidades, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {necesidades.map((necesidad) => {
              const nombreArea =
                areas?.find(
                  (area) => area.id === necesidad.area_id
                )?.nombre ?? "Área no disponible";

              return (
                <div
                  key={necesidad.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  {/* ENCABEZADO DE LA NECESIDAD */}
                  <div className="flex flex-col gap-4 border-b border-[#D4C29C] pb-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#707272]">
                        Área de adscripción
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-[#621132]">
                        {nombreArea}
                      </h3>

                      {necesidad.area_asignada && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-[#707272]">
                            Área asignada
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#9D2449]">
                            {necesidad.area_asignada}
                          </p>
                        </div>
                      )}
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                        necesidad.estado === "Disponible"
                          ? "bg-green-100 text-green-700"
                          : necesidad.estado === "Agotada"
                          ? "bg-red-100 text-red-700"
                          : "bg-[#D4C29C]/40 text-[#621132]"
                      }`}
                    >
                      {necesidad.estado}
                    </span>
                  </div>

                  {/* INFORMACIÓN */}
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-[#707272]">
                        Carrera requerida
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {necesidad.carrera === "Otra"
                          ? necesidad.carrera_otra || "No especificada"
                          : necesidad.carrera}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#707272]">
                        Nivel académico
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {necesidad.nivel_academico}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#707272]">
                        Perfil requerido
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {necesidad.perfil_requerido}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#707272]">
                        Vacantes disponibles
                      </p>

                      <p className="mt-1 font-medium text-[#621132]">
                        {necesidad.vacantes_disponibles}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#707272]">
                        Horario
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {necesidad.horario}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#707272]">
                        Jefe inmediato
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {necesidad.jefe_inmediato}
                      </p>
                    </div>
                  </div>

                  {/* ACTIVIDADES */}
                  <div className="mt-6 border-t border-[#D4C29C] pt-5">
                    <p className="text-sm font-medium text-[#707272]">
                      Actividades
                    </p>

                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
                      {necesidad.actividad_1 && (
                        <li>{necesidad.actividad_1}</li>
                      )}

                      {necesidad.actividad_2 && (
                        <li>{necesidad.actividad_2}</li>
                      )}

                      {necesidad.actividad_3 && (
                        <li>{necesidad.actividad_3}</li>
                      )}
                    </ol>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}