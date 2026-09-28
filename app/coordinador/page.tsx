export const instant = false;
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import LogoutButton from "@/components/LogoutButton";
import HeaderInstitucional from "@/components/HeaderInstitucional";

export default async function CoordinadorPage() {
  await connection();

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

  // Obtener las vacantes registradas por este coordinador
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
      area_asignada,
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
      {/* Encabezado institucional */}
      <HeaderInstitucional
        nombreUsuario={`${usuario.nombre} ${usuario.apellido_paterno}`}
        rol="Coordinador"
        logoutButton={<LogoutButton />}
      />

      {/* Contenido */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-vino-claro">
              Coordinador
            </p>

            <h2 className="mt-2 text-3xl font-bold text-vino-oscuro">
              Vacantes
            </h2>

            <p className="mt-2 text-gris-oscuro">
              Registra y consulta las vacantes de tu área.
            </p>
          </div>

          <a
            href="/coordinador/nueva"
            className="inline-flex w-fit rounded-lg bg-vino-oscuro px-5 py-3 text-sm font-medium text-white transition hover:bg-vino-claro"
          >
            + Registrar vacante
          </a>
        </div>

        {/* Resumen */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {/* Vacantes registradas */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

            <p className="text-sm text-gris-oscuro">
              Vacantes registradas
            </p>

            <p className="mt-2 text-3xl font-bold text-vino-oscuro">
              {necesidades?.length ?? 0}
            </p>
          </div>

          {/* Vacantes disponibles */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-dorado-oscuro" />

            <p className="text-sm text-gris-oscuro">
              Vacantes disponibles
            </p>

            <p className="mt-2 text-3xl font-bold text-vino-oscuro">
              {necesidades?.reduce(
                (total, necesidad) =>
                  total + (necesidad.vacantes_disponibles ?? 0),
                0
              ) ?? 0}
            </p>
          </div>

          {/* Vacantes activas */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-claro" />

            <p className="text-sm text-gris-oscuro">
              Vacantes activas
            </p>

            <p className="mt-2 text-3xl font-bold text-vino-oscuro">
              {necesidades?.filter(
                (necesidad) =>
                  necesidad.estado === "Disponible" &&
                  necesidad.vacantes_disponibles > 0
              ).length ?? 0}
            </p>
          </div>
        </div>

        {/* Lista */}
        <div className="rounded-xl border border-dorado-claro bg-white shadow-sm">
          <div className="border-b border-dorado-claro px-6 py-5">
            <h3 className="font-semibold text-vino-oscuro">
              Mis vacantes
            </h3>
          </div>

          {error ? (
            <div className="p-6">
              <p className="text-sm font-medium text-red-700">
                No fue posible consultar las vacantes.
              </p>

              <p className="mt-2 text-xs text-red-600">
                {error.message}
              </p>
            </div>
          ) : necesidades && necesidades.length > 0 ? (
            <div className="divide-y divide-dorado-claro">
              {necesidades.map((necesidad) => (
                <div
                  key={necesidad.id}
                  className="p-6 transition hover:bg-[#D4C29C]/10"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="w-full">
                      <h4 className="text-lg font-semibold text-vino-oscuro">
                        {Array.isArray(necesidad.areas)
                          ? (
                              necesidad.areas[0] as {
                                nombre?: string;
                              }
                            )?.nombre
                          : (
                              necesidad.areas as {
                                nombre?: string;
                              } | null
                            )?.nombre}
                      </h4>

                      {/* Área asignada */}
                      {necesidad.area_asignada && (
                        <p className="mt-1 text-sm font-medium text-[#9D2449]">
                          Área asignada: {necesidad.area_asignada}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-gris-oscuro">
                        <span className="font-medium">
                          Carrera:
                        </span>{" "}
                        {necesidad.carrera}
                      </p>

                      <p className="mt-1 text-sm text-gris-oscuro">
                        <span className="font-medium">
                          Nivel académico:
                        </span>{" "}
                        {necesidad.nivel_academico}
                      </p>

                      <p className="mt-2 text-sm text-gris-oscuro">
                        {necesidad.perfil_requerido}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-dorado-claro px-3 py-1 text-xs font-medium text-vino-oscuro">
                          Vacantes: {necesidad.vacantes_disponibles}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gris-oscuro">
                          {necesidad.horario}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            necesidad.estado === "Disponible"
                              ? "bg-[#D4C29C] text-[#621132]"
                              : necesidad.estado === "Agotada"
                              ? "bg-red-100 text-red-700"
                              : "bg-[#707272]/15 text-[#707272]"
                          }`}
                        >
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
              <p className="text-gris-oscuro">
                Aún no tienes vacantes registradas.
              </p>

              <a
                href="/coordinador/nueva"
                className="mt-4 inline-block text-sm font-medium text-vino-claro underline hover:text-vino-oscuro"
              >
                Registrar primera vacante
              </a>
            </div>
          )}
        </div>

        {/* Formatos y documentos */}
        <div className="mt-8 rounded-xl border border-dorado-claro bg-white shadow-sm">
          <div className="border-b border-dorado-claro px-6 py-5">
            <h3 className="font-semibold text-vino-oscuro">
              Formatos y documentos
            </h3>
          </div>

          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-medium text-vino-oscuro">
                Hoja de asistencia
              </h4>

              <p className="mt-1 text-sm text-gris-oscuro">
                Formato oficial para el registro de asistencia de los
                prestadores.
              </p>
            </div>

            <a
              href="/formatos/hoja-asistencia.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center rounded-lg bg-vino-oscuro px-5 py-3 text-sm font-medium text-white transition hover:bg-vino-claro"
            >
              Ver formato PDF
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}