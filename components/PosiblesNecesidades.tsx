"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Necesidad = {
  id: number;
  area_id: number;
  carrera: string;
  carrera_otra?: string | null;
  nivel_academico: string;
  perfil_requerido: string;
  horario: string;
  vacantes_disponibles: number;
  estado: string;
  areas?:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

type Carrera = {
  nombre: string;
  familia_id: number;
};

type PosiblesNecesidadesProps = {
  solicitudId: number;
  carreraAlumno: string;
  necesidades: Necesidad[];
  nombreAlumno?: string;
  tipoProceso?: string;
};

export default function PosiblesNecesidades({
  solicitudId,
  carreraAlumno,
  necesidades,
  nombreAlumno = "",
  tipoProceso = "",
}: PosiblesNecesidadesProps) {
  const router = useRouter();
  const supabase = createClient();

  const [necesidadesDisponibles, setNecesidadesDisponibles] = useState<
    Necesidad[]
  >([]);

  const [compatibilidades, setCompatibilidades] = useState<
    Record<number, boolean | null>
  >({});

  const [seleccionada, setSeleccionada] = useState<number | null>(null);

  const [otraVacanteSeleccionada, setOtraVacanteSeleccionada] =
    useState(false);

  const [otraVacante, setOtraVacante] = useState("");

  const [loading, setLoading] = useState(false);
  const [cargandoCompatibilidad, setCargandoCompatibilidad] =
    useState(true);

  const [error, setError] = useState("");

  // =========================================================
  // MOSTRAR TODAS LAS VACANTES Y CALCULAR COMPATIBILIDAD
  // =========================================================

  useEffect(() => {
    const obtenerCompatibilidad = async () => {
      setCargandoCompatibilidad(true);
      setError("");

      const { data: carreras, error: errorCarreras } = await supabase
        .from("carreras")
        .select("nombre, familia_id")
        .eq("activo", true);

      if (errorCarreras) {
        console.error(errorCarreras);
        setError("No fue posible consultar el catálogo de carreras.");
        setCargandoCompatibilidad(false);
        return;
      }

      const catalogo = (carreras ?? []) as Carrera[];

      const normalizar = (texto: string) =>
        texto
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      const limpiarNombreCarrera = (texto: string) =>
        normalizar(texto)
          .replace(/^licenciatura en\s+/, "")
          .replace(/^licenciatura\s+/, "")
          .replace(/^ingenieria en\s+/, "")
          .replace(/^ingenieria\s+/, "")
          .replace(/^ingenieria de\s+/, "")
          .replace(/^tecnico superior universitario en\s+/, "")
          .trim();

      const carreraAlumnoCatalogo = catalogo.find(
        (carrera) =>
          limpiarNombreCarrera(carrera.nombre) ===
          limpiarNombreCarrera(carreraAlumno)
      );

      const familiaAlumno =
        carreraAlumnoCatalogo?.familia_id ?? null;

      const nuevasCompatibilidades: Record<
        number,
        boolean | null
      > = {};

      necesidades.forEach((necesidad) => {
        const nombreCarreraNecesidad =
          necesidad.carrera === "Otra"
            ? necesidad.carrera_otra || ""
            : necesidad.carrera;

        const carreraNecesidad = catalogo.find(
          (carrera) =>
            normalizar(carrera.nombre) ===
            normalizar(nombreCarreraNecesidad)
        );

        if (!familiaAlumno || !carreraNecesidad) {
          nuevasCompatibilidades[necesidad.id] = null;
          return;
        }

        nuevasCompatibilidades[necesidad.id] =
          carreraNecesidad.familia_id === familiaAlumno;
      });

      // Se muestran todas las vacantes disponibles.
      // La compatibilidad solamente sirve como referencia.
      setNecesidadesDisponibles(necesidades);
      setCompatibilidades(nuevasCompatibilidades);
      setCargandoCompatibilidad(false);
    };

    obtenerCompatibilidad();
  }, [carreraAlumno, necesidades, supabase]);

  // =========================================================
  // CREAR PROPUESTA
  // =========================================================

  const crearPropuesta = async () => {
    if (!seleccionada && !otraVacanteSeleccionada) {
      setError("Selecciona una vacante.");
      return;
    }

    if (otraVacanteSeleccionada && !otraVacante.trim()) {
      setError(
        "Especifica la vacante o área que corresponde a la opción Otra vacante."
      );
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión ha expirado.");
      setLoading(false);
      return;
    }

    const { data: propuestaId, error } = await supabase.rpc(
      "crear_propuesta_asignacion",
      {
        p_solicitud_id: solicitudId,
        p_necesidad_id: seleccionada,
        p_otra_vacante: otraVacanteSeleccionada
          ? otraVacante.trim()
          : null,
      }
    );

    if (error) {
      console.error(
        "ERROR COMPLETO AL CREAR PROPUESTA:",
        error
      );

      setError(
        `No fue posible crear la propuesta: ${error.message}`
      );

      setLoading(false);
      return;
    }

    console.log("Propuesta creada:", propuestaId);

    // =========================================================
    // OBTENER INFORMACIÓN DEL ÁREA PROPUESTA
    // =========================================================

    let areaPropuesta = otraVacanteSeleccionada
      ? otraVacante.trim()
      : "Área no especificada";

    if (seleccionada) {
      const necesidadSeleccionada = necesidadesDisponibles.find(
        (necesidad) => necesidad.id === seleccionada
      );

      if (necesidadSeleccionada) {
        const area = Array.isArray(necesidadSeleccionada.areas)
          ? necesidadSeleccionada.areas[0]?.nombre
          : necesidadSeleccionada.areas?.nombre;

        areaPropuesta = area || "Área no especificada";
      }
    }

    // =========================================================
    // AVISAR A ADMINISTRADORA
    // =========================================================

    try {
      const respuestaCorreo = await fetch("/api/enviar-correo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "propuesta",
          nombreAlumno,
          carrera: carreraAlumno,
          tipoProceso,
          area: areaPropuesta,
        }),
      });

      const resultadoCorreo = await respuestaCorreo.json();

      if (!respuestaCorreo.ok) {
        console.error(
          "La propuesta se creó, pero no se pudo enviar el aviso:",
          resultadoCorreo
        );

        setError(
          "La propuesta fue creada correctamente, pero no se pudo enviar el aviso a la Administradora."
        );

        setLoading(false);
        return;
      }
    } catch (errorCorreo) {
      console.error(
        "Error al enviar aviso a Administradora:",
        errorCorreo
      );

      setError(
        "La propuesta fue creada correctamente, pero no se pudo enviar el aviso a la Administradora."
      );

      setLoading(false);
      return;
    }

    router.push("/rh");
    router.refresh();
  };

  // =========================================================
  // SELECCIONAR VACANTE NORMAL
  // =========================================================

  const seleccionarNecesidad = (id: number) => {
    setSeleccionada(id);
    setOtraVacanteSeleccionada(false);
    setOtraVacante("");
    setError("");
  };

  // =========================================================
  // SELECCIONAR OTRA VACANTE
  // =========================================================

  const seleccionarOtraVacante = () => {
    setSeleccionada(null);
    setOtraVacanteSeleccionada(true);
    setError("");
  };

  // =========================================================
  // CARGANDO
  // =========================================================

  if (cargandoCompatibilidad) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Posibles necesidades
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Consultando vacantes disponibles...
        </p>
      </div>
    );
  }

  // =========================================================
  // SIN VACANTES
  // =========================================================

  if (necesidadesDisponibles.length === 0) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="font-semibold text-yellow-900">
          No hay vacantes disponibles
        </h3>

        <p className="mt-2 text-sm text-yellow-800">
          Actualmente no existen vacantes disponibles para realizar
          una propuesta de asignación.
        </p>

        <p className="mt-2 text-sm text-yellow-800">
          <strong>Carrera del alumno:</strong>{" "}
          {carreraAlumno}
        </p>

        <button
          type="button"
          onClick={seleccionarOtraVacante}
          className={`mt-5 w-full rounded-xl border p-5 text-left transition ${
            otraVacanteSeleccionada
              ? "border-[#621132] bg-white ring-2 ring-[#621132]"
              : "border-yellow-300 bg-white hover:border-[#621132]"
          }`}
        >
          <p className="font-semibold text-[#621132]">
            Otra vacante
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Permite registrar una vacante o área diferente.
          </p>
        </button>

        {otraVacanteSeleccionada && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Especifique la vacante o área *
            </label>

            <input
              type="text"
              value={otraVacante}
              onChange={(e) => setOtraVacante(e.target.value)}
              placeholder="Ej. Departamento de Profesionalización"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
            />

            {error && (
              <p className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={crearPropuesta}
                disabled={loading || !otraVacante.trim()}
                className="rounded-lg bg-[#621132] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creando propuesta..."
                  : "Proponer esta necesidad"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // INTERFAZ
  // =========================================================

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Posibles necesidades
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          Selecciona una de las vacantes disponibles para proponer
          la asignación.
        </p>

        <p className="mt-3 text-sm text-gray-500">
          Carrera del alumno:{" "}
          <span className="font-medium text-gray-900">
            {carreraAlumno}
          </span>
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Se muestran todas las vacantes disponibles. La compatibilidad
          se presenta únicamente como referencia y no limita la selección.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {necesidadesDisponibles.map((necesidad) => {
          const area = Array.isArray(necesidad.areas)
            ? necesidad.areas[0]?.nombre
            : necesidad.areas?.nombre;

          const carrera =
            necesidad.carrera === "Otra"
              ? necesidad.carrera_otra ||
                "Carrera no especificada"
              : necesidad.carrera;

          const seleccionadaActual =
            seleccionada === necesidad.id;

          const compatibilidad =
            compatibilidades[necesidad.id];

          return (
            <button
              key={necesidad.id}
              type="button"
              onClick={() =>
                seleccionarNecesidad(necesidad.id)
              }
              className={`w-full rounded-xl border p-5 text-left transition ${
                seleccionadaActual
                  ? "border-gray-900 bg-gray-50 ring-2 ring-gray-900"
                  : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Área de adscripción
                  </p>

                  <h4 className="mt-1 font-semibold text-gray-900">
                    {area || "Área no disponible"}
                  </h4>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {necesidad.vacantes_disponibles} vacante(s)
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">
                    Carrera requerida
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {carrera}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Nivel académico
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {necesidad.nivel_academico}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Horario
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {necesidad.horario}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Perfil
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {necesidad.perfil_requerido}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Compatibilidad
                  </p>

                  <p
                    className={`mt-1 text-sm font-semibold ${
                      compatibilidad === true
                        ? "text-green-700"
                        : compatibilidad === false
                        ? "text-gray-600"
                        : "text-gray-500"
                    }`}
                  >
                    {compatibilidad === true
                      ? "Compatible"
                      : compatibilidad === false
                      ? "No coincide con la familia de carrera"
                      : "No determinada"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {/* =====================================================
            OTRA VACANTE
        ===================================================== */}

        <button
          type="button"
          onClick={seleccionarOtraVacante}
          className={`w-full rounded-xl border p-5 text-left transition ${
            otraVacanteSeleccionada
              ? "border-[#621132] bg-gray-50 ring-2 ring-[#621132]"
              : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Vacante
              </p>

              <h4 className="mt-1 font-semibold text-[#621132]">
                Otra vacante
              </h4>

              <p className="mt-1 text-sm text-gray-600">
                Registrar una vacante o área diferente.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              Personalizada
            </span>
          </div>
        </button>
      </div>

      {otraVacanteSeleccionada && (
        <div className="mt-5 rounded-xl border border-[#D4C29C] bg-[#D4C29C]/10 p-5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Especifique la vacante o área *
          </label>

          <input
            type="text"
            value={otraVacante}
            onChange={(e) => {
              setOtraVacante(e.target.value);
              setError("");
            }}
            placeholder="Ej. Departamento de Profesionalización"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9D2449] focus:ring-2 focus:ring-[#9D2449]/20"
          />
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={crearPropuesta}
          disabled={
            loading ||
            (seleccionada === null &&
              !otraVacanteSeleccionada)
          }
          className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creando propuesta..."
            : "Proponer esta necesidad"}
        </button>
      </div>
    </div>
  );
}