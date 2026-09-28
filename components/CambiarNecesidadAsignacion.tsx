"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Necesidad = {
  id: number;
  carrera: string | null;
  nivel_academico: string | null;
  perfil_requerido: string | null;
  horario: string | null;
  jefe_inmediato: string | null;
  vacantes_disponibles: number | null;
  estado: string | null;
  areas:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

interface Props {
  asignacionId: number;
  necesidadActualId: number;
}

export default function CambiarNecesidadAsignacion({
  asignacionId,
  necesidadActualId,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [necesidadSeleccionada, setNecesidadSeleccionada] =
    useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarNecesidades = async () => {
      setCargando(true);
      setError("");

      const { data, error } = await supabase
        .from("necesidades")
        .select(`
          id,
          carrera,
          nivel_academico,
          perfil_requerido,
          horario,
          jefe_inmediato,
          vacantes_disponibles,
          estado,
          areas (
            nombre
          )
        `)
        .eq("estado", "Disponible")
        .gt("vacantes_disponibles", 0)
        .order("id", { ascending: true });

      if (error) {
        setError("No fue posible consultar las vacantes disponibles.");
        setNecesidades([]);
      } else {
        setNecesidades((data ?? []) as Necesidad[]);
      }

      setCargando(false);
    };

    cargarNecesidades();
  }, []);

  const cambiarNecesidad = async () => {
    if (!necesidadSeleccionada) {
      setError("Selecciona una vacante.");
      return;
    }

    const nuevaNecesidadId = Number(necesidadSeleccionada);

    if (nuevaNecesidadId === necesidadActualId) {
      setError("La vacante seleccionada ya es la propuesta actual.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    const { error } = await supabase.rpc("cambiar_necesidad_asignacion", {
      p_asignacion_id: asignacionId,
      p_necesidad_nueva_id: nuevaNecesidadId,
    });

    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }

    setMensaje("La vacante fue cambiada correctamente.");

    setGuardando(false);
    setNecesidadSeleccionada("");

    router.refresh();
  };

  return (
    <div className="mt-6 rounded-xl border border-[#D4C29C] bg-[#D4C29C]/10 p-5">
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-[#621132]">
          Cambiar vacante propuesta
        </h5>

        <p className="mt-1 text-xs text-gray-600">
          Puedes cambiar la vacante antes de autorizar la asignación.
          El cambio quedará registrado en el historial y no descontará
          ninguna vacante hasta la autorización definitiva.
        </p>
      </div>

      {cargando ? (
        <p className="text-sm text-gray-500">
          Consultando vacantes disponibles...
        </p>
      ) : (
        <div className="space-y-3">
          <select
            value={necesidadSeleccionada}
            onChange={(e) => setNecesidadSeleccionada(e.target.value)}
            disabled={guardando}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#621132] focus:ring-1 focus:ring-[#621132]"
          >
            <option value="">Seleccionar otra vacante...</option>

            {necesidades.map((necesidad) => {
              const area = Array.isArray(necesidad.areas)
                ? necesidad.areas[0]
                : necesidad.areas;

              const esActual = necesidad.id === necesidadActualId;

              return (
                <option
                  key={necesidad.id}
                  value={necesidad.id}
                  disabled={esActual}
                >
                  {area?.nombre ?? "Sin área"} —{" "}
                  {necesidad.carrera ?? "Sin carrera"} —{" "}
                  {necesidad.nivel_academico ?? "Sin nivel"} —{" "}
                  {necesidad.vacantes_disponibles ?? 0} vacante(s)
                  {esActual ? " (actual)" : ""}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={cambiarNecesidad}
            disabled={guardando || !necesidadSeleccionada}
            className="rounded-lg bg-[#621132] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Cambiar vacante"}
          </button>

          {mensaje && (
            <p className="text-sm font-medium text-green-700">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {!error && necesidades.length === 0 && (
            <p className="text-sm text-gray-500">
              No hay otras vacantes disponibles para seleccionar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}