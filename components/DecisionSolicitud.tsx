"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DecisionSolicitudProps = {
  solicitudId: string;
  estado: string;
};

export default function DecisionSolicitud({
  solicitudId,
  estado,
}: DecisionSolicitudProps) {
  const router = useRouter();
  const supabase = createClient();

  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const aceptarSolicitud = async () => {
    if (estado !== "Pendiente") {
      setError("Esta solicitud ya no se encuentra pendiente.");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión ha expirado.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("solicitudes")
      .update({
        estado: "Aceptada",
        fecha_respuesta: new Date().toISOString(),
        revisado_por: user.id,
        observaciones: null,
      })
      .eq("id", solicitudId)
      .eq("estado", "Pendiente");

    if (error) {
      console.error("Error al aceptar solicitud:", error);
      setError("No fue posible aceptar la solicitud.");
      setLoading(false);
      return;
    }

    router.push("/rh");
    router.refresh();
  };

  const rechazarSolicitud = async () => {
    if (!observaciones.trim()) {
      setError("Debes indicar el motivo del rechazo.");
      return;
    }

    if (estado !== "Pendiente") {
      setError("Esta solicitud ya no se encuentra pendiente.");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión ha expirado.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("solicitudes")
      .update({
        estado: "Rechazada",
        fecha_respuesta: new Date().toISOString(),
        revisado_por: user.id,
        observaciones: observaciones.trim(),
      })
      .eq("id", solicitudId)
      .eq("estado", "Pendiente");

    if (error) {
      console.error("Error al rechazar solicitud:", error);
      setError("No fue posible rechazar la solicitud.");
      setLoading(false);
      return;
    }

    router.push("/rh");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* FORMULARIO DE RECHAZO */}
      {mostrarRechazo && estado === "Pendiente" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <label
            htmlFor="observaciones"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Motivo del rechazo
          </label>

          <textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => {
              setObservaciones(e.target.value);
              setError("");
            }}
            rows={4}
            placeholder="Indica el motivo del rechazo..."
            disabled={loading}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#9D2449] focus:ring-1 focus:ring-[#9D2449] disabled:bg-gray-100"
          />

          {error && (
            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setMostrarRechazo(false);
                setError("");
              }}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={rechazarSolicitud}
              disabled={loading}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Confirmar rechazo"}
            </button>
          </div>
        </div>
      )}

      {/* BOTONES DE DECISIÓN */}
      {estado === "Pendiente" && !mostrarRechazo && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setMostrarRechazo(true);
              setError("");
            }}
            disabled={loading}
            className="rounded-lg border border-red-300 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            Rechazar solicitud
          </button>

          <button
            type="button"
            onClick={aceptarSolicitud}
            disabled={loading}
            className="rounded-lg bg-[#621132] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#9D2449] disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Aceptar solicitud"}
          </button>
        </div>
      )}

      {/* SOLICITUD ACEPTADA */}
      {estado === "Aceptada" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          Esta solicitud ya fue aceptada. Ahora puedes seleccionar una
          vacante compatible para continuar con la asignación.
        </div>
      )}

      {/* SOLICITUD ASIGNADA */}
      {estado === "Asignada" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          Esta solicitud ya fue asignada a un área.
        </div>
      )}

      {/* SOLICITUD RECHAZADA */}
      {estado === "Rechazada" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Esta solicitud fue rechazada.
        </div>
      )}

      {/* ERROR GENERAL */}
      {error && !mostrarRechazo && (
        <p className="text-right text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}