"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DecisionAsignacionProps {
  asignacionId: number;
  correo: string;
  nombre: string;
  area: string;
}

interface CambioHistorial {
  id: number;
  necesidad_anterior_id: number;
  necesidad_nueva_id: number;
  cambiado_por: string;
  fecha_cambio: string;
  necesidad_anterior?: {
    carrera: string;
    areas?:
      | {
          nombre: string;
        }
      | {
          nombre: string;
        }[]
      | null;
  } | null;
  necesidad_nueva?: {
    carrera: string;
    areas?:
      | {
          nombre: string;
        }
      | {
          nombre: string;
        }[]
      | null;
  } | null;
}

export default function DecisionAsignacion({
  asignacionId,
  correo,
  nombre,
  area,
}: DecisionAsignacionProps) {
  const supabase = createClient();
  const router = useRouter();

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [areaActual, setAreaActual] = useState(area);

  const [historial, setHistorial] = useState<CambioHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  useEffect(() => {
    setAreaActual(area);
  }, [area]);

  useEffect(() => {
    cargarHistorial();
  }, [asignacionId]);

  const obtenerNombreAreaHistorial = (
    necesidad?: CambioHistorial["necesidad_anterior"]
  ) => {
    if (!necesidad) {
      return "Área no disponible";
    }

    if (Array.isArray(necesidad.areas)) {
      return necesidad.areas[0]?.nombre ?? "Área no disponible";
    }

    return necesidad.areas?.nombre ?? "Área no disponible";
  };

  const cargarHistorial = async () => {
    setCargandoHistorial(true);

    const { data, error } = await supabase
      .from("historial_cambios_asignacion")
      .select(`
        id,
        necesidad_anterior_id,
        necesidad_nueva_id,
        cambiado_por,
        fecha_cambio,
        necesidad_anterior:necesidades!historial_cambios_asignacion_necesidad_anterior_id_fkey (
          carrera,
          areas (
            nombre
          )
        ),
        necesidad_nueva:necesidades!historial_cambios_asignacion_necesidad_nueva_id_fkey (
          carrera,
          areas (
            nombre
          )
        )
      `)
      .eq("asignacion_id", asignacionId)
      .order("fecha_cambio", {
        ascending: true,
      });

    if (error) {
      console.error("Error al consultar historial:", error);
      setHistorial([]);
      setCargandoHistorial(false);
      return;
    }

    setHistorial((data ?? []) as unknown as CambioHistorial[]);
    setCargandoHistorial(false);
  };

  const autorizar = async () => {
    setProcesando(true);
    setError("");

    const { error } = await supabase.rpc("autorizar_asignacion", {
      p_asignacion_id: asignacionId,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      setProcesando(false);
      return;
    }

    // Enviar correo con el área final
    const respuesta = await fetch("/api/enviar-correo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo,
        nombre,
        area: areaActual,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      console.error(resultado);

      setError(
        resultado.error ||
          "La asignación fue autorizada, pero no se pudo enviar el correo."
      );

      setProcesando(false);
      return;
    }

    router.refresh();
  };

  const rechazar = async () => {
    setProcesando(true);
    setError("");

    const { error } = await supabase.rpc("rechazar_asignacion", {
      p_asignacion_id: asignacionId,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      setProcesando(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* ÁREA ACTUAL */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          Área actualmente propuesta
        </p>

        <p className="mt-1 font-semibold text-[#621132]">
          {areaActual}
        </p>
      </div>

      {/* HISTORIAL DE CAMBIOS */}
      {!cargandoHistorial && historial.length > 0 && (
        <div className="rounded-xl border border-[#D4C29C] bg-[#D4C29C]/10 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#621132]">
              Historial de cambios
            </h3>

            <p className="mt-1 text-xs text-gray-600">
              Registro de las modificaciones realizadas sobre la vacante
              propuesta antes de su autorización.
            </p>
          </div>

          <div className="space-y-3">
            {historial.map((cambio, index) => {
              const areaAnterior = obtenerNombreAreaHistorial(
                cambio.necesidad_anterior
              );

              const areaNueva = obtenerNombreAreaHistorial(
                cambio.necesidad_nueva
              );

              const fecha = new Date(
                cambio.fecha_cambio
              ).toLocaleString("es-MX", {
                dateStyle: "short",
                timeStyle: "short",
              });

              return (
                <div
                  key={cambio.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#621132] text-xs font-semibold text-white">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">
                        Cambio realizado
                      </p>

                      <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                        <span className="rounded-md bg-gray-100 px-3 py-2 font-medium text-gray-700">
                          {areaAnterior}
                        </span>

                        <span className="text-center text-[#9D2449]">
                          →
                        </span>

                        <span className="rounded-md bg-[#D4C29C]/30 px-3 py-2 font-semibold text-[#621132]">
                          {areaNueva}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {fecha}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTONES PRINCIPALES */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={rechazar}
          disabled={procesando}
          className="rounded-lg border border-red-300 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? "Procesando..." : "Rechazar"}
        </button>

        <button
          type="button"
          onClick={autorizar}
          disabled={procesando}
          className="rounded-lg bg-[#621132] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? "Procesando..." : "Autorizar asignación"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-right text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}