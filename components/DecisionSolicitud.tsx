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
  .eq("id", solicitudId);

if (error) {
  console.error("Error al aceptar solicitud:", error);
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
      .eq("id", solicitudId);

    if (error) {
      console.error(error);
      setError("No fue posible rechazar la solicitud.");
      setLoading(false);
      return;
    }

    router.push("/rh");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {mostrarRechazo && (
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
            onChange={(e) => setObservaciones(e.target.value)}
            rows={4}
            placeholder="Indica el motivo del rechazo..."
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
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
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={rechazarSolicitud}
              disabled={loading}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Confirmar rechazo"}
            </button>
          </div>
        </div>
      )}

      {estado === "Pendiente" && !mostrarRechazo && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setMostrarRechazo(true)}
            disabled={loading}
            className="rounded-lg border border-red-300 px-5 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Rechazar solicitud
          </button>

          <button
            type="button"
            onClick={aceptarSolicitud}
            disabled={loading}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Aceptar solicitud"}
          </button>
        </div>
      )}
      
      {estado === "Aceptada" && (
  <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
    Esta solicitud ya fue aceptada.
  </div>
)}

      {error && !mostrarRechazo && (
        <p className="text-right text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}