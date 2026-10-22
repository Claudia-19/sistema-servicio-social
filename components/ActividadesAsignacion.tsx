"use client";

import { useState } from "react";

interface ActividadesAsignacionProps {
  actividad1: string | null;
  actividad2: string | null;
  actividad3: string | null;
}

export default function ActividadesAsignacion({
  actividad1,
  actividad2,
  actividad3,
}: ActividadesAsignacionProps) {
  const [abierto, setAbierto] = useState(false);

  const actividades = [
    actividad1,
    actividad2,
    actividad3,
  ].filter(Boolean) as string[];

  if (actividades.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[#D4C29C] bg-white">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#621132] text-white">
            ✓
          </div>

          <div>
            <p className="font-semibold text-[#621132]">
              Actividades a realizar
            </p>

            <p className="text-xs text-[#707272]">
              {abierto
                ? "Ocultar actividades"
                : "Consultar las actividades asignadas"}
            </p>
          </div>
        </div>

        <span
          className={`text-lg text-[#621132] transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {abierto && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
          <div className="space-y-4">
            {actividades.map((actividad, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9D2449]">
                  Actividad {index + 1}
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-800">
                  {actividad}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}