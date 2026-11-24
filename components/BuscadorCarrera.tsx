"use client";

import { useMemo, useState } from "react";

export type CarreraCatalogo = {
  id: number;
  nombre: string;
  nivel_academico: string | null;
};

type BuscadorCarreraProps = {
  carreras: CarreraCatalogo[];
  valor: string;
  seleccionadaId: number | null;
  disabled?: boolean;
  cargando?: boolean;
  onCambio: (texto: string, carrera: CarreraCatalogo | null) => void;
};

function normalizar(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const claseCampo =
  "h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600";

export default function BuscadorCarrera({
  carreras,
  valor,
  seleccionadaId,
  disabled = false,
  cargando = false,
  onCambio,
}: BuscadorCarreraProps) {
  const [abierto, setAbierto] = useState(false);
  const consulta = normalizar(valor);

  const sugerencias = useMemo(() => {
    if (!consulta) return [];
    const vistas = new Set<string>();
    return carreras
      .filter((carrera) => {
        const clave = normalizar(carrera.nombre);
        if (!clave.includes(consulta) || vistas.has(clave)) return false;
        vistas.add(clave);
        return true;
      })
      .slice(0, 8);
  }, [carreras, consulta]);

  const seleccionada = carreras.find((carrera) => carrera.id === seleccionadaId);

  function publicar(texto: string) {
    const coincidencias = carreras.filter(
      (carrera) => normalizar(carrera.nombre) === normalizar(texto),
    );
    onCambio(texto, coincidencias.length === 1 ? coincidencias[0] : null);
  }

  return (
    <div className="relative min-w-0">
      <input
        id="carrera"
        name="carrera"
        type="text"
        value={valor}
        role="combobox"
        aria-expanded={abierto}
        aria-controls="sugerencias-carrera"
        aria-autocomplete="list"
        autoComplete="off"
        required
        disabled={disabled || cargando}
        placeholder={
          cargando ? "Cargando carreras..." : "Escriba para buscar, por ejemplo: software"
        }
        onChange={(evento) => {
          publicar(evento.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => {
          window.setTimeout(() => setAbierto(false), 150);
        }}
        className={claseCampo}
      />
      {abierto && !disabled && consulta && (
        <ul
          id="sugerencias-carrera"
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-dorado-claro bg-white py-1 shadow-lg"
        >
          {sugerencias.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gris-oscuro">
              No hay coincidencias en el catálogo. Elija una carrera existente; no se agregan carreras nuevas desde esta solicitud.
            </li>
          ) : (
            sugerencias.map((carrera) => (
              <li key={carrera.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={carrera.id === seleccionadaId}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => {
                    onCambio(carrera.nombre, carrera);
                    setAbierto(false);
                  }}
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-[#faf7f2]"
                >
                  <span className="text-sm text-gray-900">{carrera.nombre}</span>
                  {carrera.nivel_academico && (
                    <span className="text-xs text-gris-oscuro">
                      {carrera.nivel_academico}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {seleccionada && (
        <p className="mt-1 text-xs leading-4 text-gray-500">
          Carrera seleccionada: {seleccionada.nombre}
          {seleccionada.nivel_academico
            ? ` (${seleccionada.nivel_academico})`
            : ""}
          .
        </p>
      )}
    </div>
  );
}
