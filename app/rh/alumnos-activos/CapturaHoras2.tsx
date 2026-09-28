"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type RegistroHora = {
  id: number;
  asignacion_id: number;
  anio: number;
  mes: number;
  horas: number;
  observaciones: string | null;
};

type Alumno = {
  asignacionId: number;
  nombre: string;
  matricula: string | null;
  institucion: string | null;
  carrera: string | null;
  secretaria: string;
  areaAsignada: string;
  horasRequeridas: number | null;
  horasAcumuladas: number;
  horasRestantes: number | null;
  porcentaje: number;
  horasDelMes: number | null;
  estadoHoras: string;
  registros: RegistroHora[];
};

type CapturaHorasProps = {
  alumnos: Alumno[];
  mesSeleccionado: number;
  anioSeleccionado: number;
  nombreMes: string;
};

export default function CapturaHoras({
  alumnos,
  mesSeleccionado,
  anioSeleccionado,
  nombreMes,
}: CapturaHorasProps) {
  const router = useRouter();

  const [horas, setHoras] = useState<Record<number, string>>(() => {
    const inicial: Record<number, string> = {};

    alumnos.forEach((alumno) => {
      inicial[alumno.asignacionId] =
        alumno.horasDelMes !== null
          ? String(alumno.horasDelMes)
          : "";
    });

    return inicial;
  });

  const [historialAbierto, setHistorialAbierto] = useState<number | null>(
    null
  );

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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

  const cambiarHoras = (
    asignacionId: number,
    valor: string
  ) => {
    if (valor === "") {
      setHoras((actual) => ({
        ...actual,
        [asignacionId]: "",
      }));

      return;
    }

    if (!/^\d*\.?\d*$/.test(valor)) {
      return;
    }

    setHoras((actual) => ({
      ...actual,
      [asignacionId]: valor,
    }));
  };

  const guardarHoras = async () => {
    setGuardando(true);
    setMensaje("");
    setError("");

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Tu sesión ha expirado.");
      }

      const registros = alumnos
        .filter((alumno) => horas[alumno.asignacionId] !== "")
        .map((alumno) => {
          const valor = Number(
            horas[alumno.asignacionId]
          );

          if (!Number.isFinite(valor) || valor < 0) {
            throw new Error(
              `Las horas de ${alumno.nombre} no son válidas.`
            );
          }

          return {
            asignacion_id: alumno.asignacionId,
            anio: anioSeleccionado,
            mes: mesSeleccionado,
            horas: valor,
            registrado_por: user.id,
          };
        });

      if (registros.length === 0) {
        throw new Error(
          "No hay horas para guardar. Captura al menos un valor."
        );
      }

      const { error: errorGuardar } = await supabase
        .from("registro_horas")
        .upsert(registros, {
          onConflict: "asignacion_id,anio,mes",
        });

      if (errorGuardar) {
        throw new Error(errorGuardar.message);
      }

      setMensaje(
        `Se guardaron correctamente las horas de ${nombreMes} ${anioSeleccionado}.`
      );

      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Ocurrió un error al guardar las horas."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="overflow-hidden">

      {/* MENSAJES */}

      {mensaje && (
        <div className="mx-6 mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <p className="font-medium">
            ✓ Horas guardadas correctamente
          </p>

          <p className="mt-1">
            {mensaje}
          </p>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">
            No se pudieron guardar las horas
          </p>

          <p className="mt-1">
            {error}
          </p>
        </div>
      )}

      {/* TABLA */}

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1250px] text-left text-sm">

          <thead className="bg-gray-50 text-xs uppercase text-gray-500">

            <tr>

              <th className="px-5 py-4">
                Alumno
              </th>

              <th className="px-5 py-4">
                Secretaría
              </th>

              <th className="px-5 py-4">
                Área asignada
              </th>

              <th className="px-5 py-4 text-center">
                Requeridas
              </th>

              <th className="px-5 py-4 text-center">
                Acumuladas
              </th>

              <th className="px-5 py-4 text-center">
                Restantes
              </th>

              <th className="px-5 py-4">
                Progreso
              </th>

              <th className="px-5 py-4 text-center">
                {nombreMes} {anioSeleccionado}
              </th>

              <th className="px-5 py-4">
                Estado
              </th>

              <th className="px-5 py-4 text-center">
                Historial
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-100">

            {alumnos.map((alumno) => (

              <tr
                key={alumno.asignacionId}
                className="transition hover:bg-[#D4C29C]/10"
              >

                {/* ALUMNO */}

                <td className="px-5 py-4">

                  <p className="font-semibold text-[#621132]">
                    {alumno.nombre}
                  </p>

                  {alumno.carrera && (
                    <p className="mt-1 text-xs text-gray-500">
                      {alumno.carrera}
                    </p>
                  )}

                  {alumno.matricula && (
                    <p className="mt-1 text-xs text-gray-400">
                      Matrícula: {alumno.matricula}
                    </p>
                  )}

                </td>

                {/* SECRETARÍA */}

                <td className="px-5 py-4 text-gray-700">
                  {alumno.secretaria}
                </td>

                {/* ÁREA */}

                <td className="px-5 py-4 text-gray-700">
                  {alumno.areaAsignada}
                </td>

                {/* REQUERIDAS */}

                <td className="px-5 py-4 text-center font-medium">
                  {alumno.horasRequeridas !== null
                    ? `${alumno.horasRequeridas} h`
                    : "—"}
                </td>

                {/* ACUMULADAS */}

                <td className="px-5 py-4 text-center font-semibold text-[#621132]">
                  {alumno.horasAcumuladas} h
                </td>

                {/* RESTANTES */}

                <td className="px-5 py-4 text-center font-medium text-gray-700">
                  {alumno.horasRestantes !== null
                    ? `${alumno.horasRestantes} h`
                    : "—"}
                </td>

                {/* PROGRESO */}

                <td className="px-5 py-4">

                  {alumno.horasRequeridas !== null ? (
                    <div className="w-32">

                      <div className="mb-1 flex justify-between text-xs">

                        <span className="text-gray-500">
                          Avance
                        </span>

                        <span className="font-semibold text-[#621132]">
                          {alumno.porcentaje.toFixed(0)}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">

                        <div
                          className={`h-full rounded-full transition-all ${
                            alumno.estadoHoras === "Completadas"
                              ? "bg-green-600"
                              : alumno.estadoHoras ===
                                "Próximo a finalizar"
                              ? "bg-yellow-500"
                              : "bg-[#9D2449]"
                          }`}
                          style={{
                            width: `${alumno.porcentaje}%`,
                          }}
                        />

                      </div>

                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Sin definir
                    </span>
                  )}

                </td>

                {/* CAPTURA DEL MES */}

                <td className="px-5 py-4">

                  <div className="flex items-center justify-center gap-2">

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={horas[alumno.asignacionId] ?? ""}
                      onChange={(e) =>
                        cambiarHoras(
                          alumno.asignacionId,
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className="w-24 rounded-lg border border-[#D4C29C] px-3 py-2 text-center text-sm font-medium text-[#621132] outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
                    />

                    <span className="text-xs text-gray-500">
                      h
                    </span>

                  </div>

                </td>

                {/* ESTADO */}

                <td className="px-5 py-4">

                  {alumno.estadoHoras === "Completadas" ? (
                    <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      🟢 Completadas
                    </span>
                  ) : alumno.estadoHoras ===
                    "Próximo a finalizar" ? (
                    <span className="whitespace-nowrap rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                      🟡 Próximo a finalizar
                    </span>
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      🔵 En proceso
                    </span>
                  )}

                </td>

                {/* HISTORIAL */}

                <td className="px-5 py-4 text-center">

                  <button
                    type="button"
                    onClick={() =>
                      setHistorialAbierto(
                        historialAbierto === alumno.asignacionId
                          ? null
                          : alumno.asignacionId
                      )
                    }
                    className="rounded-lg border border-[#621132] px-3 py-2 text-xs font-medium text-[#621132] transition hover:bg-[#621132] hover:text-white"
                  >
                    📋 Ver historial
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* HISTORIALES */}

      {alumnos.map((alumno) => {

        if (historialAbierto !== alumno.asignacionId) {
          return null;
        }

        return (
          <div
            key={`historial-${alumno.asignacionId}`}
            className="border-t border-[#D4C29C] bg-gray-50 p-6"
          >

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm font-semibold text-[#621132]">
                  Historial de horas
                </p>

                <p className="text-sm text-gray-600">
                  {alumno.nombre}
                </p>
              </div>

              <p className="font-semibold text-[#621132]">
                Total acumulado: {alumno.horasAcumuladas} h
              </p>

            </div>

            {alumno.registros.length === 0 ? (

              <div className="mt-5 rounded-lg border border-gray-200 bg-white p-5 text-center text-sm text-gray-500">
                Este alumno todavía no tiene registros mensuales.
              </div>

            ) : (

              <div className="mt-5 overflow-x-auto rounded-lg border border-gray-200 bg-white">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                    <tr>

                      <th className="px-5 py-3">
                        Mes
                      </th>

                      <th className="px-5 py-3">
                        Año
                      </th>

                      <th className="px-5 py-3">
                        Horas
                      </th>

                      <th className="px-5 py-3">
                        Observaciones
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {alumno.registros
                      .slice()
                      .sort((a, b) => {
                        if (a.anio !== b.anio) {
                          return b.anio - a.anio;
                        }

                        return b.mes - a.mes;
                      })
                      .map((registro) => (

                        <tr key={registro.id}>

                          <td className="px-5 py-3">
                            {nombresMeses[registro.mes] ||
                              registro.mes}
                          </td>

                          <td className="px-5 py-3">
                            {registro.anio}
                          </td>

                          <td className="px-5 py-3 font-semibold text-[#621132]">
                            {Number(registro.horas)} h
                          </td>

                          <td className="px-5 py-3 text-gray-600">
                            {registro.observaciones ||
                              "Sin observaciones"}
                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>
        );
      })}

      {/* BOTÓN GUARDAR */}

      <div className="border-t border-[#D4C29C] bg-white px-6 py-5">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="font-semibold text-[#621132]">
              Registro de {nombreMes} {anioSeleccionado}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Captura las horas reportadas por la Secretaría y
              guarda los registros.
            </p>

          </div>

          <button
            type="button"
            onClick={guardarHoras}
            disabled={guardando}
            className="rounded-lg bg-[#621132] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando
              ? "Guardando..."
              : "💾 Guardar horas"}
          </button>

        </div>

      </div>

    </div>
  );
}