export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import FiltrosHistorico from "@/components/FiltrosHistorico";

type RegistroConsulta = {
  id: number;
  anio: number;
  mes: number | null;
  institucion_educativa: string | null;
  nombre_estudiante: string;
  carrera: string | null;
  secretaria: string | null;
  area_asignada: string | null;
  jefe_inmediato: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  total_horas: number | null;
  tipo_proceso: string | null;

  // Información actual del sistema
  estado_prestacion?: string | null;
  fecha_activacion?: string | null;
  fecha_baja?: string | null;
  motivo_baja?: string | null;
  folio_acta_baja?: string | null;
  horas_requeridas?: number | null;
  horas_acumuladas?: number;
};

export default async function ConsultasRHPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // VERIFICAR USUARIO RH
  // =========================================================

  const { data: usuario } = await supabase
    .from("usuarios")
    .select(
      "nombre, apellido_paterno, apellido_materno, rol_id"
    )
    .eq("id", user.id)
    .single();

  if (!usuario || usuario.rol_id !== 2) {
    redirect("/dashboard");
  }

  // =========================================================
  // HISTÓRICO DE EXCEL
  // =========================================================

  const {
    data: historico,
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
    .order("fecha_inicio", {
      ascending: false,
    });

  // =========================================================
  // ASIGNACIONES ACTUALES
  // =========================================================

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
      horas_requeridas
    `)
    .eq("estado", "Autorizada")
    .order("id", { ascending: false });

  // =========================================================
  // IDS
  // =========================================================

  const solicitudIds =
    (asignaciones ?? []).map(
      (asignacion) =>
        asignacion.solicitud_id
    );

  const necesidadIds =
    (asignaciones ?? []).map(
      (asignacion) =>
        asignacion.necesidad_id
    );

  // =========================================================
  // SOLICITUDES ACTUALES
  // =========================================================

  const {
    data: solicitudes,
    error: errorSolicitudes,
  } =
    solicitudIds.length > 0
      ? await supabase
          .from("solicitudes")
          .select(`
            id,
            nombre,
            matricula,
            institucion_educativa,
            carrera,
            tipo_proceso,
            fecha_inicio
          `)
          .in("id", solicitudIds)
      : {
          data: [],
          error: null,
        };

  // =========================================================
  // NECESIDADES ACTUALES
  // =========================================================

  const {
    data: necesidades,
    error: errorNecesidades,
  } =
    necesidadIds.length > 0
      ? await supabase
          .from("necesidades")
          .select(`
            id,
            area_id,
            area_asignada,
            jefe_inmediato
          `)
          .in("id", necesidadIds)
      : {
          data: [],
          error: null,
        };

  // =========================================================
  // ÁREAS / SECRETARÍAS
  // =========================================================

  const areaIds = (necesidades ?? [])
    .map(
      (necesidad) =>
        necesidad.area_id
    )
    .filter(Boolean);

  const {
    data: areas,
    error: errorAreas,
  } =
    areaIds.length > 0
      ? await supabase
          .from("areas")
          .select("id, nombre")
          .in("id", areaIds)
      : {
          data: [],
          error: null,
        };

  // =========================================================
  // REGISTROS DE HORAS
  // =========================================================

  const asignacionIds =
    (asignaciones ?? []).map(
      (asignacion) =>
        asignacion.id
    );

  const {
    data: registrosHoras,
    error: errorHoras,
  } =
    asignacionIds.length > 0
      ? await supabase
          .from("registro_horas")
          .select(`
            asignacion_id,
            anio,
            mes,
            horas
          `)
          .in(
            "asignacion_id",
            asignacionIds
          )
      : {
          data: [],
          error: null,
        };

  // =========================================================
  // CONVERTIR INFORMACIÓN ACTUAL
  // AL MISMO FORMATO DEL HISTÓRICO
  // =========================================================

  const registrosActuales: RegistroConsulta[] =
    (asignaciones ?? [])
      .map((asignacion) => {
        const solicitud =
          (solicitudes ?? []).find(
            (item) =>
              item.id === asignacion.solicitud_id
          );

        const necesidad =
          (necesidades ?? []).find(
            (item) =>
              item.id === asignacion.necesidad_id
          );

        const area =
          (areas ?? []).find(
            (item) =>
              item.id === necesidad?.area_id
          );

        if (!solicitud) {
          return null;
        }

        const registrosAlumno =
          (registrosHoras ?? []).filter(
            (registro) =>
              registro.asignacion_id ===
              asignacion.id
          );

        const horasAcumuladas =
          registrosAlumno.reduce(
            (total, registro) =>
              total +
              Number(registro.horas ?? 0),
            0
          );

        const fechaReferencia =
          asignacion.fecha_activacion ??
          solicitud.fecha_inicio;

        let anio = new Date().getFullYear();
        let mes: number | null = null;

        if (fechaReferencia) {
          const fecha = new Date(
            fechaReferencia
          );

          if (!isNaN(fecha.getTime())) {
            anio = fecha.getFullYear();
            mes = fecha.getMonth() + 1;
          }
        }

        const registro: RegistroConsulta = {
          id: 1000000 + asignacion.id,

          anio,
          mes,

          institucion_educativa:
            solicitud.institucion_educativa,

          nombre_estudiante:
            solicitud.nombre,

          carrera:
            solicitud.carrera,

          secretaria:
            area?.nombre ?? null,

          area_asignada:
            necesidad?.area_asignada ?? null,

          jefe_inmediato:
            necesidad?.jefe_inmediato ?? null,

          fecha_inicio:
            solicitud.fecha_inicio,

          fecha_fin:
            asignacion.fecha_termino,

          total_horas:
            horasAcumuladas,

          tipo_proceso:
            solicitud.tipo_proceso,

          estado_prestacion:
            asignacion.estado_prestacion,

          fecha_activacion:
            asignacion.fecha_activacion,

          fecha_baja:
            asignacion.fecha_baja,

          motivo_baja:
            asignacion.motivo_baja,

          folio_acta_baja:
            asignacion.folio_acta_baja,

          horas_requeridas:
            asignacion.horas_requeridas,

          horas_acumuladas:
            horasAcumuladas,
        };

        return registro;
      })
      .filter(
        (registro): registro is RegistroConsulta =>
          registro !== null
      );

  // =========================================================
  // CONVERTIR HISTÓRICO
  // =========================================================

  const registrosHistoricos: RegistroConsulta[] =
    (historico ?? []).map(
      (registro) => ({
        ...registro,

        estado_prestacion:
          "Histórico",

        fecha_activacion:
          registro.fecha_inicio,

        fecha_baja:
          null,

        motivo_baja:
          null,

        folio_acta_baja:
          null,

        horas_requeridas:
          null,

        horas_acumuladas:
          registro.total_horas ?? 0,
      })
    );

  // =========================================================
  // UNIFICAR
  // =========================================================

  const registros: RegistroConsulta[] = [
    ...registrosActuales,
    ...registrosHistoricos,
  ];

  // =========================================================
  // ERRORES
  // =========================================================

  const error =
    errorHistorico ||
    errorAsignaciones ||
    errorSolicitudes ||
    errorNecesidades ||
    errorAreas ||
    errorHoras;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

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
                DIRECCIÓN GENERAL DE RECURSOS HUMANOS
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/rh"
            className="text-sm font-medium text-[#9D2449] hover:underline"
          >
            ← Regresar a solicitudes
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
            DIRECCIÓN GENERAL DE RECURSOS HUMANOS
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#621132]">
            Consultar alumnos
          </h2>

          <p className="mt-2 text-gray-600">
            Consulta la información de alumnos
            históricos y actuales del sistema.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-medium">
              No fue posible consultar la
              información.
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