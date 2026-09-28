export const instant = false;

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
      {/* ENCABEZADO INSTITUCIONAL */}
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la TransformaciÃ³n"
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
        {/* TÃTULO */}
        <div className="mb-8">
          <Link
            href="/administradora"
            className="text-sm font-medium text-[#621132] transition hover:text-[#9D2449]"
          >
            â† Regresar al panel
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            AdministraciÃ³n
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Solicitudes
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta las solicitudes realizadas por los alumnos.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No fue posible cargar las solicitudes.
          </div>
        )}

        {/* SOLICITUDES */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-[#D4C29C] bg-white px-6 py-5">
            <h3 className="font-semibold text-[#621132]">
              Solicitudes registradas
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {solicitudes?.length ?? 0} solicitud(es) registrada(s)
            </p>
          </div>

          {!solicitudes || solicitudes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4C29C]/30">
                <span className="text-xl text-[#621132]">
                  âœ“
                </span>
              </div>

              <p className="font-medium text-gray-900">
                No hay solicitudes registradas
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Cuando un alumno registre una solicitud, aparecerÃ¡ aquÃ­.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="px-6 py-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    {/* INFORMACIÃ“N */}
                    <div>
                      <h4 className="font-semibold text-[#621132]">
                        {solicitud.nombre}
                      </h4>

                      <p className="mt-1 text-sm text-gray-600">
                        {solicitud.carrera}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {solicitud.institucion_educativa}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#D4C29C]/40 px-3 py-1 text-xs font-medium text-[#621132]">
                          {solicitud.tipo_proceso}
                        </span>

                        <span className="rounded-full bg-[#707272]/10 px-3 py-1 text-xs text-[#707272]">
                          {solicitud.semestre_cuatrimestre}
                        </span>

                        <span className="rounded-full bg-[#707272]/10 px-3 py-1 text-xs text-[#707272]">
                          Inicio: {solicitud.fecha_inicio}
                        </span>
                      </div>
                    </div>

                    {/* ESTADO Y BOTÃ“N */}
                    <div className="flex flex-wrap items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          solicitud.estado === "Asignada"
                            ? "bg-green-100 text-green-700"
                            : solicitud.estado === "Aceptada"
                            ? "bg-[#D4C29C]/50 text-[#621132]"
                            : solicitud.estado === "Rechazada"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {solicitud.estado}
                      </span>

                      {/* AHORA APUNTA A ADMINISTRADORA */}
                      <Link
                        href={`/administradora/solicitudes/${solicitud.id}`}
                        className="rounded-lg bg-[#621132] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9D2449]"
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
