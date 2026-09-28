"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type RegistrarHorasProps = {
  asignacionId: number;
};

export default function RegistrarHoras({
  asignacionId,
}: RegistrarHorasProps) {
  const router = useRouter();

  const fechaActual = new Date();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [mes, setMes] = useState(fechaActual.getMonth() + 1);
  const [anio, setAnio] = useState(fechaActual.getFullYear());
  const [horas, setHoras] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const meses = [
    { valor: 1, nombre: "Enero" },
    { valor: 2, nombre: "Febrero" },
    { valor: 3, nombre: "Marzo" },
    { valor: 4, nombre: "Abril" },
    { valor: 5, nombre: "Mayo" },
    { valor: 6, nombre: "Junio" },
    { valor: 7, nombre: "Julio" },
    { valor: 8, nombre: "Agosto" },
    { valor: 9, nombre: "Septiembre" },
    { valor: 10, nombre: "Octubre" },
    { valor: 11, nombre: "Noviembre" },
    { valor: 12, nombre: "Diciembre" },
  ];

  const abrirModal = () => {
    setError("");
    setHoras("");
    setObservaciones("");
    setMes(fechaActual.getMonth() + 1);
    setAnio(fechaActual.getFullYear());
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    if (cargando) return;

    setMostrarModal(false);
    setError("");
  };

  const guardarHoras = async () => {
    setError("");

    const horasNumericas = Number(horas);

    if (!horas.trim()) {
      setError("Ingresa la cantidad de horas.");
      return;
    }

    if (!Number.isFinite(horasNumericas) || horasNumericas < 0) {
      setError("La cantidad de horas debe ser un número válido mayor o igual a 0.");
      return;
    }

    if (horasNumericas > 1000) {
      setError("La cantidad de horas parece demasiado alta. Verifica el valor.");
      return;
    }

    setCargando(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
      setCargando(false);
      return;
    }

    const { error: errorRegistro } = await supabase
      .from("registro_horas")
      .insert({
        asignacion_id: asignacionId,
        anio,
        mes,
        horas: horasNumericas,
        observaciones: observaciones.trim() || null,
        registrado_por: user.id,
      });

    if (errorRegistro) {
      if (errorRegistro.code === "23505") {
        setError(
          "Ya existe un registro de horas para este alumno en el mes y año seleccionados."
        );
      } else {
        setError(errorRegistro.message);
      }

      setCargando(false);
      return;
    }

    setMostrarModal(false);
    setCargando(false);

    router.refresh();
  };

  return (
    <>
      {/* BOTÓN */}
      <button
        type="button"
        onClick={abrirModal}
        className="rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
      >
        + Registrar horas
      </button>

      {/* MODAL */}
      {mostrarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={cerrarModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ENCABEZADO */}
            <div className="bg-[#621132] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl">
                  🕐
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Registrar horas
                  </h2>

                  <p className="text-sm text-white/80">
                    Registro mensual de horas
                  </p>
                </div>
              </div>
            </div>

            {/* CONTENIDO */}
            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mes
                </label>

                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  disabled={cargando}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                >
                  {meses.map((item) => (
                    <option key={item.valor} value={item.valor}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Año
                </label>

                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  disabled={cargando}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Horas acumuladas del mes
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  disabled={cargando}
                  placeholder="Ej. 80"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Ingresa el total de horas reportadas por la Secretaría durante ese mes.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Observaciones
                  <span className="font-normal text-gray-400">
                    {" "}
                    (opcional)
                  </span>
                </label>

                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  disabled={cargando}
                  rows={3}
                  placeholder="Ej. Reporte mensual recibido de la Secretaría."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                />
              </div>

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
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarHoras}
                disabled={cargando}
                className="rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando ? "Guardando..." : "Guardar registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}