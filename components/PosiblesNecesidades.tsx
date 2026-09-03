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
  areas?: {
    nombre: string;
  } | {
    nombre: string;
  }[] | null;
};

type Carrera = {
  nombre: string;
  familia_id: number;
};

type PosiblesNecesidadesProps = {
  solicitudId: number;
  carreraAlumno: string;
  necesidades: Necesidad[];
};

export default function PosiblesNecesidades({
  solicitudId,
  carreraAlumno,
  necesidades,
}: PosiblesNecesidadesProps) {
  const router = useRouter();
  const supabase = createClient();

  const [necesidadesCompatibles, setNecesidadesCompatibles] = useState<
    Necesidad[]
  >([]);

  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargandoCompatibilidad, setCargandoCompatibilidad] = useState(true);
  const [error, setError] = useState("");

  // Buscar las necesidades compatibles con la carrera del alumno
  useEffect(() => {
    const obtenerCompatibilidad = async () => {
      setCargandoCompatibilidad(true);
      setError("");

      // Obtener todas las carreras del catálogo con su familia
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

      // Normalizar texto para comparar nombres
      const normalizar = (texto: string) =>
        texto
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      // Buscar la carrera del alumno.
// Se eliminan palabras que indican el nivel o grado académico
// para poder relacionar, por ejemplo:
// "Licenciatura en Administración" con "Administración".
const limpiarNombreCarrera = (texto: string) =>
  normalizar(texto)
    .replace(/^licenciatura en\s+/, "")
    .replace(/^licenciatura\s+/, "")
    .replace(/^ingenieria en\s+/, "")
    .replace(/^ingenieria\s+/, "")
    .replace(/^ingenieria de\s+/, "")
    .replace(/^ingenieria\s+de\s+/, "")
    .replace(/^tecnico superior universitario en\s+/, "")
    .trim();

const carreraAlumnoCatalogo = catalogo.find(
  (carrera) =>
    limpiarNombreCarrera(carrera.nombre) ===
    limpiarNombreCarrera(carreraAlumno)
);

      // Si la carrera del alumno no está en el catálogo,
      // no podemos determinar su familia.
      if (!carreraAlumnoCatalogo) {
        setNecesidadesCompatibles([]);
        setCargandoCompatibilidad(false);
        return;
      }

      const familiaAlumno = carreraAlumnoCatalogo.familia_id;

      // Filtrar únicamente necesidades cuya carrera
      // pertenezca a la misma familia
      const compatibles = necesidades.filter((necesidad) => {
        const nombreCarreraNecesidad =
          necesidad.carrera === "Otra"
            ? necesidad.carrera_otra || ""
            : necesidad.carrera;

        const carreraNecesidad = catalogo.find(
          (carrera) =>
            normalizar(carrera.nombre) ===
            normalizar(nombreCarreraNecesidad)
        );

        if (!carreraNecesidad) {
          return false;
        }

        return carreraNecesidad.familia_id === familiaAlumno;
      });

      setNecesidadesCompatibles(compatibles);
      setCargandoCompatibilidad(false);
    };

    obtenerCompatibilidad();
  }, [carreraAlumno, necesidades, supabase]);

  const crearPropuesta = async () => {
    if (!seleccionada) {
      setError("Selecciona una necesidad.");
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
      }
    );

    if (error) {
      console.error("ERROR COMPLETO AL CREAR PROPUESTA:", error);

      setError(
        `No fue posible crear la propuesta: ${error.message}`
      );

      setLoading(false);
      return;
    }

    console.log("Propuesta creada:", propuestaId);

    router.push("/rh");
    router.refresh();
  };

  // Mientras se consulta la compatibilidad
  if (cargandoCompatibilidad) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Posibles necesidades
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Buscando necesidades relacionadas con la carrera del alumno...
        </p>
      </div>
    );
  }

  // Si no existen necesidades compatibles
  if (necesidadesCompatibles.length === 0) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="font-semibold text-yellow-900">
          No hay necesidades compatibles
        </h3>

        <p className="mt-2 text-sm text-yellow-800">
          Actualmente no existen vacantes disponibles relacionadas con la
          carrera del alumno.
        </p>

        <p className="mt-2 text-sm text-yellow-800">
          <strong>Carrera del alumno:</strong>{" "}
          {carreraAlumno}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Posibles necesidades
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          Selecciona una de las necesidades relacionadas con la carrera del
          alumno para proponer la asignación.
        </p>

        <p className="mt-3 text-sm text-gray-500">
          Carrera del alumno:{" "}
          <span className="font-medium text-gray-900">
            {carreraAlumno}
          </span>
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {necesidadesCompatibles.map((necesidad) => {
          const area = Array.isArray(necesidad.areas)
            ? necesidad.areas[0]?.nombre
            : necesidad.areas?.nombre;

          const carrera =
            necesidad.carrera === "Otra"
              ? necesidad.carrera_otra || "Carrera no especificada"
              : necesidad.carrera;

          const seleccionadaActual =
            seleccionada === necesidad.id;

          return (
            <button
              key={necesidad.id}
              type="button"
              onClick={() => setSeleccionada(necesidad.id)}
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
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={crearPropuesta}
          disabled={loading || seleccionada === null}
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