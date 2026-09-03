"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Area = {
  id: number;
  nombre: string;
};

type Carrera = {
  id: number;
  nombre: string;
  nivel_academico: string;
  activo: boolean;
};

export default function NuevaNecesidadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [areas, setAreas] = useState<Area[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

 const [formulario, setFormulario] = useState({
  area_id: "",
  perfil_requerido: "",
  carrera: "",
  carrera_otra: "",
  nivel_academico: "",
  actividad_1: "",
  actividad_2: "",
  actividad_3: "",
  horario: "",
  jefe_inmediato: "",
  vacantes_disponibles: "1",
});

  useEffect(() => {
  const cargarCatalogos = async () => {
    setLoadingAreas(true);
    setLoadingCarreras(true);

    const [
      { data: areasData, error: areasError },
      { data: carrerasData, error: carrerasError },
    ] = await Promise.all([
      supabase
        .from("areas")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre"),

      supabase
        .from("carreras")
        .select("id, nombre, nivel_academico, activo")
        .eq("activo", true)
        .order("nombre"),
    ]);

    if (areasError) {
      console.error(areasError);
      setError("No fue posible cargar las áreas.");
    } else {
    const areasOrdenadas = (areasData ?? []).sort((a, b) => {
    const nombreA = a.nombre.toLowerCase();
    const nombreB = b.nombre.toLowerCase();

    // Asamblea siempre va primero
    if (nombreA === "asamblea") return -1;
    if (nombreB === "asamblea") return 1;

    // Después van las Secretarías
    const esSecretariaA = nombreA.startsWith("secretaría");
    const esSecretariaB = nombreB.startsWith("secretaría");

    if (esSecretariaA && !esSecretariaB) return -1;
    if (!esSecretariaA && esSecretariaB) return 1;

    // Finalmente, los Institutos
    return nombreA.localeCompare(nombreB);
  });

  setAreas(areasOrdenadas);
}

    if (carrerasError) {
      console.error(carrerasError);
      setError("No fue posible cargar las carreras.");
    } else {
      setCarreras(carrerasData ?? []);
    }

    setLoadingAreas(false);
    setLoadingCarreras(false);
  };

  cargarCatalogos();
}, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const guardarNecesidad = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setGuardando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión ha expirado.");
      setGuardando(false);
      return;
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("rol_id")
      .eq("id", user.id)
      .single();

    if (!usuario || usuario.rol_id !== 3) {
      setError("No tienes permisos para registrar necesidades.");
      setGuardando(false);
      return;
    }

    const { error } = await supabase.from("necesidades").insert({
  coordinador_id: user.id,
  area_id: Number(formulario.area_id),

  perfil_requerido: formulario.perfil_requerido.trim(),

  carrera:
    formulario.carrera === "Otra"
      ? formulario.carrera_otra.trim()
      : formulario.carrera.trim(),

  carrera_otra:
  formulario.carrera === "Otra"
    ? formulario.carrera_otra.trim()
    : null,

  nivel_academico: formulario.nivel_academico.trim(),

  actividad_1: formulario.actividad_1.trim(),
  actividad_2: formulario.actividad_2.trim(),
  actividad_3: formulario.actividad_3.trim(),

  // Se conserva temporalmente para compatibilidad
  // con las partes antiguas del sistema.
  actividades_a_realizar: [
    formulario.actividad_1.trim(),
    formulario.actividad_2.trim(),
    formulario.actividad_3.trim(),
  ].join(" | "),

  horario: formulario.horario.trim(),
  jefe_inmediato: formulario.jefe_inmediato.trim(),

  vacantes_disponibles: Number(
    formulario.vacantes_disponibles
  ),

  estado: "Disponible",
});
    if (error) {
      console.error("ERROR AL GUARDAR NECESIDAD:", error);
      setError(`Error: ${error.message}`);
      setGuardando(false);
      return;
    }

    router.push("/coordinador");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">
            Sistema de Control de Servicio Social
          </h1>

          <p className="text-sm text-gray-500">
            Registrar necesidad
          </p>
        </div>
      </header>

      {/* Contenido */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <a
            href="/coordinador"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Regresar
          </a>

          <h2 className="mt-5 text-3xl font-bold text-gray-900">
            Registrar necesidad
          </h2>

          <p className="mt-2 text-gray-600">
            Registra la información de la vacante disponible en tu área.
          </p>
        </div>

        <form
          onSubmit={guardarNecesidad}
          className="space-y-6"
        >
          {/* Área de adscripción */}
<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900">
    Área de adscripción
  </h3>

  <div className="mt-5">
    <label
      htmlFor="area_id"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Área de adscripción *
    </label>

    <select
      id="area_id"
      name="area_id"
      value={formulario.area_id}
      onChange={handleChange}
      required
      disabled={loadingAreas}
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500 disabled:bg-gray-100"
    >
      <option value="">
        {loadingAreas
          ? "Cargando áreas..."
          : "Selecciona un área de adscripción"}
      </option>

      {areas.map((area) => (
        <option
          key={area.id}
          value={area.id}
        >
          {area.nombre}
        </option>
      ))}
    </select>

    {!loadingAreas && areas.length === 0 && (
      <p className="mt-2 text-sm text-amber-700">
        Todavía no hay áreas registradas en el catálogo.
      </p>
    )}
  </div>
</div>

          {/* Perfil */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Perfil requerido
            </h3>

            <div className="mt-5">
              <label
                htmlFor="perfil_requerido"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Perfil requerido *
              </label>

              <textarea
                id="perfil_requerido"
                name="perfil_requerido"
                value={formulario.perfil_requerido}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Describe el perfil que requiere el área..."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Datos académicos */}
<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900">
    Perfil académico
  </h3>

  <div className="mt-5 grid gap-5 md:grid-cols-2">
    {/* Carrera */}
<div>
  <label
    htmlFor="carrera"
    className="mb-2 block text-sm font-medium text-gray-700"
  >
    Carrera *
  </label>

  <select
  id="carrera"
  name="carrera"
  value={formulario.carrera}
  onChange={handleChange}
  required
  disabled={loadingCarreras}
  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500 disabled:bg-gray-100"
>
  <option value="">
    {loadingCarreras
      ? "Cargando carreras..."
      : "Selecciona una carrera"}
  </option>

  {carreras.map((carrera) => (
    <option
      key={carrera.id}
      value={carrera.nombre}
    >
      {carrera.nombre}
    </option>
  ))}

  <option value="Otra">
    Otra
  </option>


    {carreras.map((carrera) => (
      <option
        key={carrera.id}
        value={carrera.nombre}
      >
        {carrera.nombre}
      </option>
    ))}

    <option value="Otra">
      Otra
    </option>
  </select>
</div>
{formulario.carrera === "Otra" && (
  <div>
    <label
      htmlFor="carrera_otra"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Especifica la carrera *
    </label>

    <input
      id="carrera_otra"
      name="carrera_otra"
      type="text"
      value={formulario.carrera_otra}
      onChange={handleChange}
      required
      placeholder="Escribe el nombre de la carrera"
      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
    />
  </div>
)}

    {/* Nivel académico */}
    <div>
      <label
        htmlFor="nivel_academico"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Nivel académico *
      </label>

      <select
        id="nivel_academico"
        name="nivel_academico"
        value={formulario.nivel_academico}
        onChange={handleChange}
        required
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
      >
        <option value="">
          Selecciona un nivel académico
        </option>

        <option value="Bachillerato">
          Bachillerato
        </option>

        <option value="Licenciatura">
          Licenciatura
        </option>

        <option value="Ingeniería">
          Ingeniería
        </option>
      </select>
    </div>
  </div>
</div>

          {/* Actividades */}
          <div className="mt-5 space-y-5">
  <div>
    <label
      htmlFor="actividad_1"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Actividad 1 *
    </label>

    <textarea
      id="actividad_1"
      name="actividad_1"
      value={formulario.actividad_1}
      onChange={handleChange}
      required
      rows={3}
      placeholder="Describe la primera actividad..."
      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
    />
  </div>

  <div>
    <label
      htmlFor="actividad_2"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Actividad 2 *
    </label>

    <textarea
      id="actividad_2"
      name="actividad_2"
      value={formulario.actividad_2}
      onChange={handleChange}
      required
      rows={3}
      placeholder="Describe la segunda actividad..."
      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
    />
  </div>

  <div>
    <label
      htmlFor="actividad_3"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Actividad 3 *
    </label>

    <textarea
      id="actividad_3"
      name="actividad_3"
      value={formulario.actividad_3}
      onChange={handleChange}
      required
      rows={3}
      placeholder="Describe la tercera actividad..."
      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
    />
  </div>
</div>
          {/* Horario y jefe */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Información de la vacante
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="horario"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Horario *
                </label>

                <input
                  id="horario"
                  name="horario"
                  type="text"
                  value={formulario.horario}
                  onChange={handleChange}
                  required
                  placeholder="Ej. 09:00 a 15:00"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="jefe_inmediato"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Jefe inmediato *
                </label>

                <input
                  id="jefe_inmediato"
                  name="jefe_inmediato"
                  type="text"
                  value={formulario.jefe_inmediato}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del jefe inmediato"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="vacantes_disponibles"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Número de vacantes *
                </label>

                <input
                  id="vacantes_disponibles"
                  name="vacantes_disponibles"
                  type="number"
                  min="1"
                  value={formulario.vacantes_disponibles}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3">
            <a
              href="/coordinador"
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </a>

            <button
              type="submit"
              disabled={guardando || loadingAreas || areas.length === 0}
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando
                ? "Guardando..."
                : "Guardar necesidad"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}