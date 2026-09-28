"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ActivarAlumnoProps = {
  asignacionId: number;
};

export default function ActivarAlumno({
  asignacionId,
}: ActivarAlumnoProps) {
  const router = useRouter();

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  const activarAlumno = async () => {
    setCargando(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.rpc("activar_asignacion", {
      p_asignacion_id: asignacionId,
    });

    if (error) {
      setError(error.message);
      setCargando(false);
      return;
    }

    setMostrarModal(false);

    router.refresh();
  };

  const cancelar = () => {
    if (cargando) return;

    setMostrarModal(false);
    setError("");
  };

  return (
    <>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            setError("");
            setMostrarModal(true);
          }}
          disabled={cargando}
          className="w-full rounded-lg bg-[#621132] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? "Activando..." : "🟢 Activar alumno"}
        </button>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={cancelar}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="rounded-t-2xl bg-[#621132] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl">
                  🟢
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Activar alumno
                  </h2>

                  <p className="text-sm text-white/80">
                    Confirmación de activación
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 py-6">
              <p className="text-base font-medium text-gray-800">
                ¿Confirmas que deseas activar a este alumno?
              </p>

              <div className="mt-4 rounded-lg border border-[#D4C29C] bg-[#D4C29C]/15 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  Al realizar esta acción:
                </p>

                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-[#9D2449]">•</span>
                    <span>
                      Se registrará automáticamente la fecha de activación.
                    </span>
                  </li>

                  <li className="flex gap-2">
                    <span className="text-[#9D2449]">•</span>
                    <span>
                      El alumno pasará al estado <strong>Activo</strong>.
                    </span>
                  </li>

                  <li className="flex gap-2">
                    <span className="text-[#9D2449]">•</span>
                    <span>
                      A partir de la activación se dará seguimiento a sus
                      horas acumuladas.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Error dentro del modal */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={cancelar}
                disabled={cargando}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={activarAlumno}
                disabled={cargando}
                className="rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando ? "Activando..." : "🟢 Confirmar activación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}