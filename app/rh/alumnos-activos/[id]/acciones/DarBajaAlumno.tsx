"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type DarBajaAlumnoProps = {
  asignacionId: number;
  nombreAlumno: string;
};

export default function DarBajaAlumno({
  asignacionId,
  nombreAlumno,
}: DarBajaAlumnoProps) {
  const router = useRouter();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [folio, setFolio] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const abrirModal = () => {
    setMotivo("");
    setFolio("");
    setError("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (!cargando) {
      setModalAbierto(false);
    }
  };

  const darDeBaja = async () => {
    if (!motivo.trim()) {
      setError("Debes registrar el motivo de la baja.");
      return;
    }

    if (!folio.trim()) {
      setError("Debes registrar el folio del acta de baja.");
      return;
    }

    setCargando(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "dar_baja_asignacion",
      {
        p_asignacion_id: asignacionId,
        p_motivo_baja: motivo.trim(),
        p_folio_acta_baja: folio.trim(),
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
        className="w-full rounded-lg border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
      >
        🔴 Dar de baja
      </button>

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* ENCABEZADO */}
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl">
                  ⚠️
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#621132]">
                    Dar de baja al alumno
                  </h3>

                  <p className="text-sm text-gray-500">
                    Registro de baja de la prestación
                  </p>
                </div>

              </div>
            </div>

            {/* CONTENIDO */}
            <div className="space-y-5 px-6 py-6">

              <div className="rounded-lg border border-[#D4C29C] bg-[#D4C29C]/10 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Alumno
                </p>

                <p className="mt-1 font-semibold text-[#621132]">
                  {nombreAlumno || "Alumno"}
                </p>
              </div>

              {/* MOTIVO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Motivo de la baja *
                </label>

                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Escribe el motivo de la baja..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                />
              </div>

              {/* FOLIO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Folio del acta de baja *
                </label>

                <input
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="Ej. ACTA-2026-001"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                />
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm leading-5 text-yellow-800">
                  Al confirmar la baja, el alumno pasará a estado
                  <strong> Dada de baja</strong>. Se conservarán sus
                  horas acumuladas y el registro quedará en el historial.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

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
                onClick={darDeBaja}
                disabled={cargando}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando
                  ? "Registrando baja..."
                  : "✓ Confirmar baja"}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}