import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export const instant = false;

export default async function AlumnosActivosAdministradoraPage() {
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

  // Obtener asignaciones actualmente activas
  const { data: asignaciones } = await supabase
    .from("asignaciones")
    .select(`
      id,
      solicitud_id,
      necesidad_id,
      estado,
      estado_prestacion,
      fecha_activacion,
      fecha_termino,
      horas_requeridas,
      solicitudes (
        id,
        nombre,
        matricula,
        institucion_educativa,
        carrera,
        tipo_proceso
      ),
      necesidades (
        id,
        area_id,
        area_asignada,
        jefe_inmediato,
        areas (
          nombre
        )
      )
    `)
    .eq("estado", "Autorizada")
    .eq("estado_prestacion", "Activa")
    .order("fecha_activacion", { ascending: false });

  const asignacionesIds =
    asignaciones?.map((asignacion) => asignacion.id) ?? [];

  // Obtener registros mensuales de horas
  const { data: registrosHoras } =
    asignacionesIds.length > 0
      ? await supabase
          .from("registro_horas")
          .select("id, asignacion_id, anio, mes, horas, observaciones")
          .in("asignacion_id", asignacionesIds)
          .order("anio", { ascending: false })
          .order("mes", { ascending: false })
      : { data: [] };

  const alumnos =
    asignaciones?.map((asignacion: any) => {
      const solicitud = Array.isArray(asignacion.solicitudes)
        ? asignacion.solicitudes[0]
        : asignacion.solicitudes;

      const necesidad = Array.isArray(asignacion.necesidades)
        ? asignacion.necesidades[0]
        : asignacion.necesidades;

      const area = necesidad?.areas
        ? Array.isArray(necesidad.areas)
          ? necesidad.areas[0]
          : necesidad.areas
        : null;

      const registrosAlumno =
        registrosHoras?.filter(
          (registro) => registro.asignacion_id === asignacion.id
        ) ?? [];

      const horasAcumuladas = registrosAlumno.reduce(
        (total, registro) =>
          total + Number(registro.horas ?? 0),
        0
      );

      const horasRequeridas = Number(
        asignacion.horas_requeridas ?? 0
      );

      const horasRestantes = Math.max(
        horasRequeridas - horasAcumuladas,
        0
      );

      const porcentaje =
        horasRequeridas > 0
          ? Math.min(
              (horasAcumuladas / horasRequeridas) * 100,
              100
            )
          : 0;

      return {
        asignacionId: asignacion.id,
        nombre: solicitud?.nombre ?? "Sin nombre",
        matricula: solicitud?.matricula ?? "Sin matrícula",
        institucion:
          solicitud?.institucion_educativa ?? "Sin institución",
        carrera: solicitud?.carrera ?? "Sin carrera",
        tipoProceso:
          solicitud?.tipo_proceso ?? "Sin especificar",
        secretaria: area?.nombre ?? "Sin Secretaría",
        areaAsignada:
          necesidad?.area_asignada ?? "Sin área asignada",
        jefeInmediato:
          necesidad?.jefe_inmediato ?? "Sin jefe inmediato",
        fechaActivacion: asignacion.fecha_activacion,
        horasRequeridas,
        horasAcumuladas,
        horasRestantes,
        porcentaje,
        registros: registrosAlumno,
      };
    }) ?? [];

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
          <Link
            href="/administradora"
            className="text-sm font-medium text-[#9D2449] hover:underline"
          >
            ← Regresar al panel
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Seguimiento
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#621132]">
            Estudiantes activos
          </h1>

          <p className="mt-2 text-gray-600">
            Consulta la información y el seguimiento de los
            estudiantes actualmente activos.
          </p>
        </div>

        {/* RESUMEN */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Estudiantes activos
            </p>

            <p className="mt-2 text-3xl font-bold text-[#621132]">
              {alumnos.length}
            </p>
          </div>

          
        </div>

        {/* TABLA */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Estudiantes activos
            </h2>
          </div>

          {alumnos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                Actualmente no hay estudiantes activos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Alumno
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Carrera
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Institución
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Secretaría
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Área asignada
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Jefe inmediato
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Activación
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Horas
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {alumnos.map((alumno) => (
                    <tr
                      key={alumno.asignacionId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {alumno.nombre}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Matrícula: {alumno.matricula}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {alumno.tipoProceso}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {alumno.carrera}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {alumno.institucion}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {alumno.secretaria}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {alumno.areaAsignada}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {alumno.jefeInmediato}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {alumno.fechaActivacion
                          ? new Date(
                              alumno.fechaActivacion
                            ).toLocaleDateString("es-MX")
                          : "Sin fecha"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700">
                          {alumno.horasAcumuladas} /{" "}
                          {alumno.horasRequeridas} h
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Restantes: {alumno.horasRestantes} h
                        </div>

                        <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-[#9D2449]"
                            style={{
                              width: `${alumno.porcentaje}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}