"use client";

import { useMemo, useState } from "react";

type RegistroConsulta = {
  id: number;
  anio: number;
  mes: number | null;
  institucion_educativa: string | null;
  nombre_estudiante: string;
  carrera: string | null;
  secretaria: string | null;
  area_asignada: string | null;
  jefe_inmediato: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  total_horas: number | null;
  tipo_proceso: string | null;

  estado_prestacion?: string | null;
  fecha_activacion?: string | null;
  fecha_baja?: string | null;
  motivo_baja?: string | null;
  folio_acta_baja?: string | null;
  horas_requeridas?: number | null;
  horas_acumuladas?: number;
};

type Props = {
  registros: RegistroConsulta[];
};

const nombresMeses = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const estadosPrestacion = [
  "Pendiente de activación",
  "Activa",
  "Finalizada",
  "Dada de baja",
  "Histórico",
];

function formatearFecha(
  fecha: string | null | undefined
) {
  if (!fecha) {
    return "—";
  }

  const fechaObj = new Date(fecha);

  if (isNaN(fechaObj.getTime())) {
    return fecha;
  }

  return fechaObj.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function FiltrosHistorico({
  registros,
}: Props) {
  // =========================================================
  // FILTROS
  // =========================================================

  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState("");
  const [mes, setMes] = useState("");
  const [secretaria, setSecretaria] = useState("");
  const [areaAsignada, setAreaAsignada] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [carrera, setCarrera] = useState("");
  const [tipoProceso, setTipoProceso] = useState("");
  const [estadoPrestacion, setEstadoPrestacion] =
    useState("");

  // =========================================================
  // OPCIONES DE FILTROS
  // =========================================================

  const opciones = useMemo(() => {
    const unicos = (
      valores: (string | null | undefined)[]
    ): string[] => {
      return Array.from(
        new Set(
          valores.filter(
            (valor): valor is string =>
              typeof valor === "string" &&
              valor.trim() !== ""
          )
        )
      ).sort((a, b) =>
        a.localeCompare(b, "es")
      );
    };

    return {
      secretarias: unicos(
        registros.map(
          (registro) => registro.secretaria
        )
      ),

      areas: unicos(
        registros.map(
          (registro) => registro.area_asignada
        )
      ),

      instituciones: unicos(
        registros.map(
          (registro) =>
            registro.institucion_educativa
        )
      ),

      carreras: unicos(
        registros.map(
          (registro) => registro.carrera
        )
      ),

      tipos: unicos(
        registros.map(
          (registro) => registro.tipo_proceso
        )
      ),

      estados: unicos(
        registros.map(
          (registro) =>
            registro.estado_prestacion
        )
      ),
    };
  }, [registros]);

  const anios = useMemo(() => {
    return Array.from(
      new Set(
        registros
          .map((registro) => registro.anio)
          .filter(
            (anio): anio is number =>
              Boolean(anio)
          )
      )
    ).sort((a, b) => b - a);
  }, [registros]);

  // =========================================================
  // FILTRAR
  // =========================================================

  const registrosFiltrados = useMemo(() => {
    const texto =
      busqueda.trim().toLowerCase();

    return registros.filter((registro) => {
      const coincideBusqueda =
        !texto ||
        registro.nombre_estudiante
          ?.toLowerCase()
          .includes(texto) ||
        registro.institucion_educativa
          ?.toLowerCase()
          .includes(texto) ||
        registro.carrera
          ?.toLowerCase()
          .includes(texto) ||
        registro.jefe_inmediato
          ?.toLowerCase()
          .includes(texto);

      const coincideAnio =
        !anio ||
        registro.anio.toString() === anio;

      const coincideMes =
        !mes ||
        registro.mes?.toString() === mes;

      const coincideSecretaria =
        !secretaria ||
        registro.secretaria === secretaria;

      const coincideArea =
        !areaAsignada ||
        registro.area_asignada ===
          areaAsignada;

      const coincideInstitucion =
        !institucion ||
        registro.institucion_educativa ===
          institucion;

      const coincideCarrera =
        !carrera ||
        registro.carrera === carrera;

      const coincideTipo =
        !tipoProceso ||
        registro.tipo_proceso ===
          tipoProceso;

      const coincideEstado =
        !estadoPrestacion ||
        registro.estado_prestacion ===
          estadoPrestacion;

      return (
        coincideBusqueda &&
        coincideAnio &&
        coincideMes &&
        coincideSecretaria &&
        coincideArea &&
        coincideInstitucion &&
        coincideCarrera &&
        coincideTipo &&
        coincideEstado
      );
    });
  }, [
    registros,
    busqueda,
    anio,
    mes,
    secretaria,
    areaAsignada,
    institucion,
    carrera,
    tipoProceso,
    estadoPrestacion,
  ]);

  // =========================================================
  // LIMPIAR FILTROS
  // =========================================================

  const limpiarFiltros = () => {
    setBusqueda("");
    setAnio("");
    setMes("");
    setSecretaria("");
    setAreaAsignada("");
    setInstitucion("");
    setCarrera("");
    setTipoProceso("");
    setEstadoPrestacion("");
  };

  // =========================================================
  // EXPORTAR EXCEL
  // =========================================================

  const exportarExcel = async () => {
    if (registrosFiltrados.length === 0) {
      alert(
        "No hay resultados para exportar."
      );
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const datos = registrosFiltrados.map(
        (registro) => ({
          Año: registro.anio,

          Mes: registro.mes
            ? nombresMeses[registro.mes]
            : "",

          "Nombre del estudiante":
            registro.nombre_estudiante,

          "Institución educativa":
            registro.institucion_educativa ??
            "",

          Carrera:
            registro.carrera ?? "",

          Secretaría:
            registro.secretaria ?? "",

          "Área asignada":
            registro.area_asignada ?? "",

          "Jefe inmediato":
            registro.jefe_inmediato ?? "",

          "Tipo de proceso":
            registro.tipo_proceso ?? "",

          "Estado de la prestación":
            registro.estado_prestacion ??
            "",

          "Fecha de inicio":
            registro.fecha_inicio
              ? formatearFecha(
                  registro.fecha_inicio
                )
              : "",

          "Fecha de activación":
            registro.fecha_activacion
              ? formatearFecha(
                  registro.fecha_activacion
                )
              : "",

          "Fecha de término":
            registro.fecha_fin
              ? formatearFecha(
                  registro.fecha_fin
                )
              : "",

          "Fecha de baja":
            registro.fecha_baja
              ? formatearFecha(
                  registro.fecha_baja
                )
              : "",

          "Horas requeridas":
            registro.horas_requeridas ??
            "",

          "Horas acumuladas":
            registro.horas_acumuladas ??
            registro.total_horas ??
            "",

          "Motivo de baja":
            registro.motivo_baja ?? "",

          "Folio de acta de baja":
            registro.folio_acta_baja ?? "",
        })
      );

      const hoja =
        XLSX.utils.json_to_sheet(datos);

      const libro =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Consulta"
      );

      XLSX.writeFile(
        libro,
        `consulta_prestadores_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error(
        "Error al exportar Excel:",
        error
      );

      alert(
        "No fue posible exportar el archivo de Excel."
      );
    }
  };

  // =========================================================
  // ¿HAY FILTROS?
  // =========================================================

  const hayFiltros =
    Boolean(busqueda) ||
    Boolean(anio) ||
    Boolean(mes) ||
    Boolean(secretaria) ||
    Boolean(areaAsignada) ||
    Boolean(institucion) ||
    Boolean(carrera) ||
    Boolean(tipoProceso) ||
    Boolean(estadoPrestacion);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="rounded-xl border border-[#D4C29C] bg-white shadow-sm">
      <div className="p-6">

        {/* FILTROS */}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* BUSCAR */}

          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Buscar estudiante
            </label>

            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Nombre, institución, carrera o jefe inmediato..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            />
          </div>

          {/* AÑO */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Año
            </label>

            <select
              value={anio}
              onChange={(e) =>
                setAnio(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todos
              </option>

              {anios.map((opcion) => (
                <option
                  key={opcion}
                  value={opcion}
                >
                  {opcion}
                </option>
              ))}
            </select>
          </div>

          {/* MES */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Mes de inicio
            </label>

            <select
              value={mes}
              onChange={(e) =>
                setMes(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todos
              </option>

              {nombresMeses
                .slice(1)
                .map(
                  (
                    nombre,
                    indice
                  ) => (
                    <option
                      key={indice + 1}
                      value={indice + 1}
                    >
                      {nombre}
                    </option>
                  )
                )}
            </select>
          </div>

          {/* ESTADO */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Estado de la prestación
            </label>

            <select
              value={estadoPrestacion}
              onChange={(e) =>
                setEstadoPrestacion(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todos
              </option>

              {estadosPrestacion.map(
                (estado) => (
                  <option
                    key={estado}
                    value={estado}
                  >
                    {estado}
                  </option>
                )
              )}
            </select>
          </div>

          {/* SECRETARÍA */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Secretaría
            </label>

            <select
              value={secretaria}
              onChange={(e) =>
                setSecretaria(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todas
              </option>

              {opciones.secretarias.map(
                (opcion) => (
                  <option
                    key={opcion}
                    value={opcion}
                  >
                    {opcion}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ÁREA ASIGNADA */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Área asignada
            </label>

            <select
              value={areaAsignada}
              onChange={(e) =>
                setAreaAsignada(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todas
              </option>

              {opciones.areas.map(
                (opcion) => (
                  <option
                    key={opcion}
                    value={opcion}
                  >
                    {opcion}
                  </option>
                )
              )}
            </select>
          </div>

          {/* INSTITUCIÓN */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Institución educativa
            </label>

            <select
              value={institucion}
              onChange={(e) =>
                setInstitucion(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todas
              </option>

              {opciones.instituciones.map(
                (opcion) => (
                  <option
                    key={opcion}
                    value={opcion}
                  >
                    {opcion}
                  </option>
                )
              )}
            </select>
          </div>

          {/* CARRERA */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Carrera
            </label>

            <select
              value={carrera}
              onChange={(e) =>
                setCarrera(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todas
              </option>

              {opciones.carreras.map(
                (opcion) => (
                  <option
                    key={opcion}
                    value={opcion}
                  >
                    {opcion}
                  </option>
                )
              )}
            </select>
          </div>

          {/* TIPO DE PROCESO */}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Tipo de proceso
            </label>

            <select
              value={tipoProceso}
              onChange={(e) =>
                setTipoProceso(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">
                Todos
              </option>

              {opciones.tipos.map(
                (opcion) => (
                  <option
                    key={opcion}
                    value={opcion}
                  >
                    {opcion}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* RESULTADOS */}

        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="rounded-lg bg-gray-50 px-4 py-4">
            <p className="text-sm text-gray-500">
              Registros encontrados
            </p>

            <p className="mt-1 text-3xl font-bold text-[#621132]">
              {registrosFiltrados.length}
            </p>
          </div>
        </div>

        {/* BOTONES */}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-lg border border-[#B38E5D] bg-white px-5 py-2.5 text-sm font-medium text-[#621132] transition hover:bg-[#D4C29C]/20"
            >
              Limpiar filtros
            </button>
          )}

          <button
            type="button"
            onClick={exportarExcel}
            className="rounded-lg bg-[#621132] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9D2449]"
          >
            📥 Exportar a Excel
          </button>
        </div>

        {/* TABLA */}

        <div className="mt-8 overflow-x-auto">
          {registrosFiltrados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
              <p className="font-medium text-gray-600">
                No hay registros que coincidan
                con los filtros.
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Intenta cambiar o limpiar los
                filtros de búsqueda.
              </p>
            </div>
          ) : (
            <table className="min-w-[1800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#D4C29C] bg-[#621132] text-left text-white">

                  <th className="px-4 py-3">
                    Año
                  </th>

                  <th className="px-4 py-3">
                    Mes
                  </th>

                  <th className="px-4 py-3">
                    Estudiante
                  </th>

                  <th className="px-4 py-3">
                    Institución
                  </th>

                  <th className="px-4 py-3">
                    Carrera
                  </th>

                  <th className="px-4 py-3">
                    Secretaría
                  </th>

                  <th className="px-4 py-3">
                    Área asignada
                  </th>

                  <th className="px-4 py-3">
                    Jefe inmediato
                  </th>

                  <th className="px-4 py-3">
                    Tipo de proceso
                  </th>

                  <th className="px-4 py-3">
                    Estado
                  </th>

                  <th className="px-4 py-3">
                    Inicio
                  </th>

                  <th className="px-4 py-3">
                    Activación
                  </th>

                  <th className="px-4 py-3">
                    Término
                  </th>

                  <th className="px-4 py-3">
                    Baja
                  </th>

                  <th className="px-4 py-3">
                    Horas requeridas
                  </th>

                  <th className="px-4 py-3">
                    Horas acumuladas
                  </th>

                  <th className="px-4 py-3">
                    Motivo de baja
                  </th>

                  <th className="px-4 py-3">
                    Folio de baja
                  </th>

                </tr>
              </thead>

              <tbody>
                {registrosFiltrados.map(
                  (registro) => (
                    <tr
                      key={registro.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >

                      <td className="px-4 py-3">
                        {registro.anio}
                      </td>

                      <td className="px-4 py-3">
                        {registro.mes
                          ? nombresMeses[
                              registro.mes
                            ]
                          : "—"}
                      </td>

                      <td className="px-4 py-3 font-medium text-[#621132]">
                        {
                          registro.nombre_estudiante
                        }
                      </td>

                      <td className="px-4 py-3">
                        {registro.institucion_educativa ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {registro.carrera ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {registro.secretaria ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {registro.area_asignada ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {registro.jefe_inmediato ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {registro.tipo_proceso ??
                          "—"}
                      </td>

                      {/* ESTADO SIN ETIQUETA */}

                      <td className="px-4 py-3 font-medium text-gray-700">
                        {registro.estado_prestacion ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {formatearFecha(
                          registro.fecha_inicio
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatearFecha(
                          registro.fecha_activacion
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatearFecha(
                          registro.fecha_fin
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatearFecha(
                          registro.fecha_baja
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {registro.horas_requeridas ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {registro.horas_acumuladas ??
                          registro.total_horas ??
                          "—"}
                      </td>

                      <td className="max-w-xs px-4 py-3">
                        {registro.motivo_baja ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {registro.folio_acta_baja ??
                          "—"}
                      </td>

                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}