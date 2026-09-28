export const instant = false;
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import FiltrosHistorico from "@/components/FiltrosHistorico";

export default async function ConsultasAdministradoraPage() {
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

  // ============================================================
  // HISTÓRICO
  // ============================================================

  const {
    data: registrosHistoricos,
    error: errorHistorico,
  } = await supabase
    .from("historico_prestadores")
    .select(`
      id,
      anio,
      mes,
      institucion_educativa,
      nombre_estudiante,
      carrera,
      secretaria,
      area_asignada,
      jefe_inmediato,
      fecha_inicio,
      fecha_fin,
      total_horas,
      tipo_proceso
    `)
    .order("anio", { ascending: false })
    .order("fecha_inicio", { ascending: false });

  // ============================================================
  // ASIGNACIONES ACTUALES
  // ============================================================

  const {
    data: asignaciones,
    error: errorAsignaciones,
  } = await supabase
    .from("asignaciones")
    .select(`
      id,
      solicitud_id,
      necesidad_id,
      estado,
      estado_prestacion,
      fecha_activacion,
      fecha_termino,
      fecha_baja,
      motivo_baja,
      folio_acta_baja,
      horas_requeridas,
      solicitudes (
        id,
        nombre,
        matricula,
        institucion_educativa,
        carrera,
        tipo_proceso,
        fecha_inicio
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
    .order("created_at", { ascending: false });

  // ============================================================
  // HORAS
  // ============================================================

  const asignacionesIds =
    asignaciones?.map(
      (asignacion) => asignacion.id
    ) ?? [];

  const {
    data: registrosHoras,
    error: errorHoras,
  } =
    asignacionesIds.length > 0
      ? await supabase
          .from("registro_horas")
          .select(`
            id,
            asignacion_id,
            anio,
            mes,
            horas,
            observaciones
          `)
          .in(
            "asignacion_id",
            asignacionesIds
          )
          .order("anio", {
            ascending: false,
          })
          .order("mes", {
            ascending: false,
          })
      : {
          data: [],
          error: null,
        };

  // ============================================================
  // CONSTRUIR REGISTROS ACTUALES
  // ============================================================

  const registrosActuales =
    (asignaciones ?? []).map(
      (asignacion: any) => {
        const solicitud =
          Array.isArray(
            asignacion.solicitudes
          )
            ? asignacion.solicitudes[0]
            : asignacion.solicitudes;

        const necesidad =
          Array.isArray(
            asignacion.necesidades
          )
            ? asignacion.necesidades[0]
            : asignacion.necesidades;

        const area =
          necesidad?.areas
            ? Array.isArray(
                necesidad.areas
              )
              ? necesidad.areas[0]
              : necesidad.areas
            : null;

        const registrosAlumno =
          registrosHoras?.filter(
            (registro) =>
              registro.asignacion_id ===
              asignacion.id
          ) ?? [];

        const horasRequeridas =
          Number(
            asignacion.horas_requeridas ??
              0
          );

        const horasAcumuladas =
          registrosAlumno.reduce(
            (total, registro) =>
              total +
              Number(
                registro.horas ?? 0
              ),
            0
          );

        const anio =
          solicitud?.fecha_inicio
            ? new Date(
                solicitud.fecha_inicio
              ).getFullYear()
            : new Date().getFullYear();

        const mes =
          solicitud?.fecha_inicio
            ? new Date(
                solicitud.fecha_inicio
              ).getMonth() + 1
            : null;

        return {
          id: asignacion.id,
          anio,
          mes,

          institucion_educativa:
            solicitud?.institucion_educativa ??
            null,

          nombre_estudiante:
            solicitud?.nombre ??
            "Sin nombre",

          carrera:
            solicitud?.carrera ??
            null,

          secretaria:
            area?.nombre ??
            null,

          area_asignada:
            necesidad?.area_asignada ??
            null,

          jefe_inmediato:
            necesidad?.jefe_inmediato ??
            null,

          fecha_inicio:
            solicitud?.fecha_inicio ??
            null,

          fecha_fin:
            asignacion.fecha_termino ??
            null,

          total_horas:
            horasRequeridas,

          tipo_proceso:
            solicitud?.tipo_proceso ??
            null,

          estado_prestacion:
            asignacion.estado_prestacion ??
            "Pendiente de activación",

          fecha_activacion:
            asignacion.fecha_activacion ??
            null,

          fecha_baja:
            asignacion.fecha_baja ??
            null,

          motivo_baja:
            asignacion.motivo_baja ??
            null,

          folio_acta_baja:
            asignacion.folio_acta_baja ??
            null,

          horas_requeridas:
            horasRequeridas,

          horas_acumuladas:
            horasAcumuladas,
        };
      }
    );

  // ============================================================
  // CONVERTIR HISTÓRICOS AL MISMO FORMATO
  // ============================================================

  const registrosHistoricosFormateados =
    (registrosHistoricos ?? []).map(
      (registro) => ({
        ...registro,

        estado_prestacion:
          "Histórico",

        fecha_activacion:
          null,

        fecha_baja:
          null,

        motivo_baja:
          null,

        folio_acta_baja:
          null,

        horas_requeridas:
          registro.total_horas,

        horas_acumuladas:
          registro.total_horas ?? 0,
      })
    );

  // ============================================================
  // UNIFICAR ACTUALES + HISTÓRICOS
  // ============================================================

  const registros = [
    ...registrosActuales,
    ...registrosHistoricosFormateados,
  ];

  // ============================================================
  // ERRORES
  // ============================================================

  const error =
    errorHistorico ||
    errorAsignaciones ||
    errorHoras;

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
                {usuario.nombre}{" "}
                {usuario.apellido_paterno}
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
            ← Regresar al panel general
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            Administración
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Consultar prestadores
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta información de prestadores
            actuales e históricos.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-medium">
              No fue posible consultar la información.
            </p>

            <p className="mt-1">
              {error.message}
            </p>
          </div>
        ) : (
          <FiltrosHistorico
            registros={registros}
          />
        )}
      </section>
    </main>
  );
}