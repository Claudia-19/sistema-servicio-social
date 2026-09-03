"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DecisionAsignacionProps {
  asignacionId: number;
  correo: string;
  nombre: string;
  area: string;
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

  // Enviar correo al alumno
  const respuesta = await fetch("/api/enviar-correo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      correo,
      nombre,
      area,
    }),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    console.error(resultado);
    setError(
      resultado.error || "La asignación fue autorizada, pero no se pudo enviar el correo."
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
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={rechazar}
          disabled={procesando}
          className="rounded-lg border border-red-300 px-5 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? "Procesando..." : "Rechazar"}
        </button>

        <button
          type="button"
          onClick={autorizar}
          disabled={procesando}
          className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
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