"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type FinalizarAlumnoProps = {
  asignacionId: number;
  nombreAlumno: string;
};

export default function FinalizarAlumno({
  asignacionId,
  nombreAlumno,
}: FinalizarAlumnoProps) {
  const router = useRouter();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const abrirModal = () => {
    setError("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (!cargando) {
      setModalAbierto(false);
    }
  };

  const finalizarAlumno = async () => {
    setCargando(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "finalizar_asignacion",
      {
        p_asignacion_id: asignacionId,
      }
    );

    if (error) {
      setError(error.message);
      setCargando(false);
      return;
    }

    setModalAbierto(false);
    setCargando(false);

    router.refresh();
  };

  return (
    <>
      {/* BOTÓN */}
      <button
        type="button"
        onClick={abrirModal}
        className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        🟢 Finalizar alumno
      </button>

      {/* ERROR */}
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">
            No se pudo finalizar al alumno.
          </p>

          <p className="mt-1">
            {error}
          </p>
        </div>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            {/* ENCABEZADO */}
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">
                  ✓
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#621132]">
                    Finalizar alumno
                  </h3>

                  <p className="text-sm text-gray-500">
                    Finalización de la prestación
                  </p>
                </div>

              </div>
            </div>

            {/* CONTENIDO */}
            <div className="px-6 py-6">

              <p className="text-sm leading-6 text-gray-600">
                ¿Confirmas que deseas finalizar la prestación de:
              </p>

              <div className="mt-4 rounded-lg border border-[#D4C29C] bg-[#D4C29C]/10 p-4">
                <p className="font-semibold text-[#621132]">
                  {nombreAlumno || "Alumno"}
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm leading-5 text-blue-700">
                  Al finalizar, el alumno cambiará a estado
                  <strong> Finalizada</strong>, se registrará la fecha
                  de término y dejará de aparecer en la lista de
                  alumnos activos.
                </p>
              </div>

            </div>

            {/* BOTONES */}
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">

              <button
                type="button"
                onClick={cerrarModal}
                disabled={cargando}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={finalizarAlumno}
                disabled={cargando}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando
                  ? "Finalizando..."
                  : "✓ Sí, finalizar"}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}