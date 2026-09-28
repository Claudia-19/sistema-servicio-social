"use client";

import { useMemo, useState } from "react";

type Solicitud = {
  id: number;
  nombre: string;
  institucion_educativa: string | null;
  carrera: string | null;
  semestre_cuatrimestre: string | null;
  matricula?: string | null;
  tipo_proceso: string | null;
  fecha_inicio: string | null;
  estado: string | null;
  fecha_solicitud: string | null;
  secretaria?: string | null;
  area_asignada?: string | null;
};

type Props = {
  solicitudes: Solicitud[];
  titulo?: string;
  textoBoton?: string;
  rutaRevision?: string;
};

export default function FiltrosSolicitudes({
  solicitudes,
  titulo = "Panel de filtros",
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [secretaria, setSecretaria] = useState("");
  const [areaAsignada, setAreaAsignada] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [carrera, setCarrera] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [tipoProceso, setTipoProceso] = useState("");
  const [estado, setEstado] = useState("");

  const opciones = useMemo(() => {
    const obtenerUnicos = (campo: keyof Solicitud) => {
      return Array.from(
        new Set(
          solicitudes
            .map((solicitud) => solicitud[campo])
            .filter(
              (valor): valor is string =>
                typeof valor === "string" && valor.trim() !== ""
            )
        )
      ).sort((a, b) => a.localeCompare(b, "es"));
    };

    return {
      secretarias: obtenerUnicos("secretaria"),
      areas: obtenerUnicos("area_asignada"),
      instituciones: obtenerUnicos("institucion_educativa"),
      carreras: obtenerUnicos("carrera"),
      tipos: obtenerUnicos("tipo_proceso"),
      estados: obtenerUnicos("estado"),
    };
  }, [solicitudes]);

  const anios = useMemo(() => {
    return Array.from(
      new Set(
        solicitudes
          .map((solicitud) => {
            if (!solicitud.fecha_inicio) return null;

            const fecha = new Date(
              `${solicitud.fecha_inicio}T00:00:00`
            );

            return Number.isNaN(fecha.getTime())
              ? null
              : fecha.getFullYear().toString();
          })
          .filter((anio): anio is string => Boolean(anio))
      )
    ).sort((a, b) => Number(b) - Number(a));
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return solicitudes.filter((solicitud) => {
      const coincideBusqueda =
        !texto ||
        solicitud.nombre?.toLowerCase().includes(texto) ||
        solicitud.matricula?.toLowerCase().includes(texto);

      const coincideSecretaria =
        !secretaria || solicitud.secretaria === secretaria;

      const coincideArea =
        !areaAsignada ||
        solicitud.area_asignada === areaAsignada;

      const coincideInstitucion =
        !institucion ||
        solicitud.institucion_educativa === institucion;

      const coincideCarrera =
        !carrera || solicitud.carrera === carrera;

      let coincideFecha = true;

      if (solicitud.fecha_inicio) {
        const fecha = new Date(
          `${solicitud.fecha_inicio}T00:00:00`
        );

        if (!Number.isNaN(fecha.getTime())) {
          const mesFecha = (fecha.getMonth() + 1).toString();
          const anioFecha = fecha.getFullYear().toString();

          if (mes && mesFecha !== mes) {
            coincideFecha = false;
          }

          if (anio && anioFecha !== anio) {
            coincideFecha = false;
          }
        }
      } else if (mes || anio) {
        coincideFecha = false;
      }

      const coincideTipo =
        !tipoProceso || solicitud.tipo_proceso === tipoProceso;

      const coincideEstado =
        !estado || solicitud.estado === estado;

      return (
        coincideBusqueda &&
        coincideSecretaria &&
        coincideArea &&
        coincideInstitucion &&
        coincideCarrera &&
        coincideFecha &&
        coincideTipo &&
        coincideEstado
      );
    });
  }, [
    solicitudes,
    busqueda,
    secretaria,
    areaAsignada,
    institucion,
    carrera,
    mes,
    anio,
    tipoProceso,
    estado,
  ]);

  const pendientes = solicitudesFiltradas.filter(
    (solicitud) => solicitud.estado === "Pendiente"
  ).length;

  const aceptadas = solicitudesFiltradas.filter(
    (solicitud) => solicitud.estado === "Aceptada"
  ).length;

  const asignadas = solicitudesFiltradas.filter(
    (solicitud) => solicitud.estado === "Asignada"
  ).length;

  const rechazadas = solicitudesFiltradas.filter(
    (solicitud) => solicitud.estado === "Rechazada"
  ).length;

  const limpiarFiltros = () => {
    setBusqueda("");
    setSecretaria("");
    setAreaAsignada("");
    setInstitucion("");
    setCarrera("");
    setMes("");
    setAnio("");
    setTipoProceso("");
    setEstado("");
  };

  const exportarExcel = async () => {
    if (solicitudesFiltradas.length === 0) {
      alert("No hay resultados para exportar.");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const datos = solicitudesFiltradas.map((solicitud) => ({
        "Nombre del estudiante": solicitud.nombre,
        Matrícula: solicitud.matricula ?? "",
        "Institución educativa":
          solicitud.institucion_educativa ?? "",
        Carrera: solicitud.carrera ?? "",
        "Semestre / Cuatrimestre":
          solicitud.semestre_cuatrimestre ?? "",
        "Tipo de proceso": solicitud.tipo_proceso ?? "",
        "Fecha de inicio": solicitud.fecha_inicio ?? "",
        Secretaría: solicitud.secretaria ?? "",
        "Área asignada": solicitud.area_asignada ?? "",
        Estado: solicitud.estado ?? "",
        "Fecha de solicitud":
          solicitud.fecha_solicitud ?? "",
      }));

      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Solicitudes"
      );

      XLSX.writeFile(
        libro,
        `solicitudes_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error al exportar Excel:", error);

      alert(
        "No fue posible exportar el archivo de Excel."
      );
    }
  };

  const hayFiltros =
    busqueda ||
    secretaria ||
    areaAsignada ||
    institucion ||
    carrera ||
    mes ||
    anio ||
    tipoProceso ||
    estado;

  return (
    <div className="rounded-xl border border-[#D4C29C] bg-white shadow-sm">
      {/* ENCABEZADO */}
      <div className="border-b border-[#D4C29C] bg-[#621132] px-6 py-4">
        <h3 className="font-semibold text-white">
          🔎 {titulo}
        </h3>

        <p className="mt-1 text-sm text-white/80">
          Utiliza los filtros para consultar las solicitudes.
        </p>
      </div>

      <div className="p-6">
        {/* FILTROS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* BUSCAR */}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Buscar estudiante o matrícula
            </label>

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o matrícula..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            />
          </div>

          {/* SECRETARÍA */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Secretaría
            </label>

            <select
              value={secretaria}
              onChange={(e) => setSecretaria(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todas</option>

              {opciones.secretarias.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
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
                setAreaAsignada(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todas</option>

              {opciones.areas.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
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
                setInstitucion(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todas</option>

              {opciones.instituciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>

          {/* CARRERA */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Carrera
            </label>

            <select
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todas</option>

              {opciones.carreras.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>

          {/* AÑO */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Año de inicio
            </label>

            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todos</option>

              {anios.map((opcion) => (
                <option key={opcion} value={opcion}>
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
              onChange={(e) => setMes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todos</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
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
                setTipoProceso(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todos</option>

              {opciones.tipos.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>

          {/* ESTADO */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#621132]">
              Estado
            </label>

            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            >
              <option value="">Todos</option>

              {opciones.estados.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="mt-6 grid gap-3 border-t border-gray-100 pt-5 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Resultados
            </p>

            <p className="mt-1 text-2xl font-bold text-[#621132]">
              {solicitudesFiltradas.length}
            </p>
          </div>

          <div className="rounded-lg bg-yellow-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Pendientes
            </p>

            <p className="mt-1 text-2xl font-bold text-yellow-700">
              {pendientes}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Aceptadas
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-700">
              {aceptadas}
            </p>
          </div>

          <div className="rounded-lg bg-green-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Asignadas
            </p>

            <p className="mt-1 text-2xl font-bold text-green-700">
              {asignadas}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Rechazadas
            </p>

            <p className="mt-1 text-2xl font-bold text-red-700">
              {rechazadas}
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
      </div>
    </div>
  );
}