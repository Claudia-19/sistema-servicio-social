import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DecisionSolicitud from "@/components/DecisionSolicitud";
import PosiblesNecesidades from "@/components/PosiblesNecesidades";

export default async function RevisarSolicitudPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar que sea Recursos Humanos
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol_id")
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 2) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const { data: solicitud, error } = await supabase
    .from("solicitudes")
    .select(`
      id,
      nombre,
      domicilio,
      institucion_educativa,
      carrera,
      semestre_cuatrimestre,
      matricula,
      telefono,
      correo,
      tipo_proceso,
      fecha_inicio,
      horario_propuesto,
      informacion_adicional,
      estado,
      fecha_solicitud
    `)
    .eq("id", id)
    .single();

  if (error || !solicitud) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            No se encontró la solicitud
          </h1>

          <p className="mt-2 text-gray-600">
            La solicitud que intentas consultar no existe.
          </p>
        </div>
      </main>
    );
  }
  const { data: necesidades } = await supabase
  .from("necesidades")
  .select(`
    id,
    area_id,
    carrera,
    carrera_otra,
    nivel_academico,
    perfil_requerido,
    horario,
    vacantes_disponibles,
    estado,
    areas (
      nombre
    )
  `)
  .eq("estado", "Disponible")
  .gt("vacantes_disponibles", 0)
  .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">
            Sistema de Control de Servicio Social
          </h1>

          <p className="text-sm text-gray-500">
            Revisión de solicitud
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Recursos Humanos
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Revisar solicitud
          </h2>

          <p className="mt-2 text-gray-600">
            Revisa la información proporcionada por el alumno.
          </p>
        </div>

        <div className="space-y-6">
          {/* Datos personales */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Datos personales
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">
                  Nombre completo
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.nombre}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Domicilio
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.domicilio}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Teléfono celular
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.telefono}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Correo electrónico
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.correo}
                </p>
              </div>
            </div>
          </div>

          {/* Datos académicos */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Datos académicos
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">
                  Institución educativa
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.institucion_educativa}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Carrera
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.carrera}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Semestre / Cuatrimestre
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.semestre_cuatrimestre}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Matrícula / Número de control
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.matricula}
                </p>
              </div>
            </div>
          </div>

          {/* Datos de la solicitud */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Datos de la solicitud
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">
                  Tipo de proceso
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.tipo_proceso}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Estado
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.estado}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Fecha de inicio
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.fecha_inicio}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Horario propuesto
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {solicitud.horario_propuesto}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm text-gray-500">
                Información adicional
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {solicitud.informacion_adicional || "Sin información adicional."}
              </p>
            </div>
          </div>

          {/* Acciones */}
<div className="flex items-center justify-between">
  <a
    href="/rh"
    className="text-sm text-gray-500 hover:text-gray-900"
  >
    ← Regresar a solicitudes
  </a>

  <div className="flex items-center gap-3">
    {solicitud.estado === "Asignada" && (
      <Link
        href={`/rh/solicitud/${solicitud.id}/imprimir`}
        className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        🖨️ Imprimir formato
      </Link>
    )}

    <DecisionSolicitud
      solicitudId={solicitud.id}
      estado={solicitud.estado}
    />
  </div>
</div>

{/* Posibles necesidades */}
{solicitud.estado === "Aceptada" && (
  <PosiblesNecesidades
    solicitudId={solicitud.id}
    carreraAlumno={solicitud.carrera}
    necesidades={necesidades ?? []}
  />
)}
        </div>
      </section>
    </main>
  );
}