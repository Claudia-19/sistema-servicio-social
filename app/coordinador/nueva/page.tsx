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
    area_asignada: "",
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
          const esSecretariaA =
            nombreA.startsWith("secretaría");
          const esSecretariaB =
            nombreB.startsWith("secretaría");

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
  }, [supabase]);

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
      setError(
        "No tienes permisos para registrar vacantes."
      );
      setGuardando(false);
      return;
    }

    const { error } = await supabase
      .from("necesidades")
      .insert({
        coordinador_id: user.id,
        area_id: Number(formulario.area_id),

        perfil_requerido:
          formulario.perfil_requerido.trim(),

        carrera:
          formulario.carrera === "Otra"
            ? formulario.carrera_otra.trim()
            : formulario.carrera.trim(),

        carrera_otra:
          formulario.carrera === "Otra"
            ? formulario.carrera_otra.trim()
            : null,

        nivel_academico:
          formulario.nivel_academico.trim(),

        actividad_1:
          formulario.actividad_1.trim(),

        actividad_2:
          formulario.actividad_2.trim(),

        actividad_3:
          formulario.actividad_3.trim(),

        // Se conserva temporalmente para compatibilidad
        // con las partes antiguas del sistema.
        actividades_a_realizar: [
          formulario.actividad_1.trim(),
          formulario.actividad_2.trim(),
          formulario.actividad_3.trim(),
        ].join(" | "),

        // Área o departamento específico dentro del área de adscripción.
        area_asignada:
          formulario.area_asignada.trim(),

        horario:
          formulario.horario.trim(),

        jefe_inmediato:
          formulario.jefe_inmediato.trim(),

        vacantes_disponibles: Number(
          formulario.vacantes_disponibles
        ),

        estado: "Disponible",
      });

    if (error) {
      console.error(
        "ERROR AL GUARDAR VACANTE:",
        error
      );

      setError(`Error: ${error.message}`);
      setGuardando(false);
      return;
    }

    router.push("/coordinador");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ENCABEZADO INSTITUCIONAL */}
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <img
            src="/logo-pachuca.png"
            alt="Pachuca Capital de la Transformación"
            className="h-16 w-auto object-contain"
          />
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <a
            href="/coordinador"
            className="text-sm text-gris-oscuro transition hover:text-vino-oscuro"
          >
            ← Regresar
          </a>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-vino-claro">
            Coordinador
          </p>

          <h2 className="mt-2 text-3xl font-bold text-vino-oscuro">
            Registrar vacante
          </h2>

          <p className="mt-2 text-gris-oscuro">
            Registra la información de la vacante disponible en tu área.
          </p>
        </div>

        <form
          onSubmit={guardarNecesidad}
          className="space-y-6"
        >
          {/* ÁREA DE ADSCRIPCIÓN */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Área de adscripción
            </h3>

            <p className="mt-1 text-sm text-gris-oscuro">
              Selecciona el área en la que se incorporará el prestador.
            </p>

            <div className="mt-5">
              <label
                htmlFor="area_id"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-100"
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

              {!loadingAreas &&
                areas.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    Todavía no hay áreas registradas en el catálogo.
                  </p>
                )}
            </div>
          </div>

          {/* CONOCIMIENTOS REQUERIDOS */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-dorado-oscuro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Conocimientos requeridos
            </h3>

            <p className="mt-1 text-sm text-gris-oscuro">
              Describe las características y conocimientos que requiere la vacante.
            </p>

            <div className="mt-5">
              <label
                htmlFor="perfil_requerido"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Conocimientos requeridos *
              </label>

              <textarea
                id="perfil_requerido"
                name="perfil_requerido"
                value={formulario.perfil_requerido}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Describe los conocimientos que requiere el área..."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
              />
            </div>
          </div>

          {/* DATOS ACADÉMICOS */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-claro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Perfil académico
            </h3>

            <p className="mt-1 text-sm text-gris-oscuro">
              Selecciona o escribe la carrera y el nivel académico requerido.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {/* CARRERA */}
              <div>
                <label
                  htmlFor="carrera"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Carrera *
                </label>

                <input
                  id="carrera"
                  name="carrera"
                  type="text"
                  list="carreras-lista"
                  value={formulario.carrera}
                  onChange={handleChange}
                  required
                  disabled={loadingCarreras}
                  placeholder={
                    loadingCarreras
                      ? "Cargando carreras..."
                      : "Escribe para buscar una carrera"
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-100"
                />

                <datalist id="carreras-lista">
                  {carreras.map((carrera) => (
                    <option
                      key={carrera.id}
                      value={carrera.nombre}
                    />
                  ))}

                  <option value="Otra" />
                </datalist>

                <p className="mt-2 text-xs text-gris-oscuro">
                  Puedes escribir parte del nombre para encontrar una carrera del catálogo.
                </p>
              </div>

              {/* NIVEL ACADÉMICO */}
              <div>
                <label
                  htmlFor="nivel_academico"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Nivel académico *
                </label>

                <select
                  id="nivel_academico"
                  name="nivel_academico"
                  value={formulario.nivel_academico}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                >
                  <option value="">
                    Selecciona un nivel académico
                  </option>

                  <option value="Bachillerato/Técnico(a)">
                    Bachillerato/Técnico(a)
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

            {/* OTRA CARRERA */}
            {formulario.carrera === "Otra" && (
              <div className="mt-5">
                <label
                  htmlFor="carrera_otra"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                />
              </div>
            )}
          </div>

          {/* ACTIVIDADES */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-dorado-oscuro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Actividades a realizar
            </h3>

            <p className="mt-1 text-sm text-gris-oscuro">
              Registra las tres actividades principales que realizará el prestador.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="actividad_1"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
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
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                />
              </div>

              <div>
                <label
                  htmlFor="actividad_2"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
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
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                />
              </div>

              <div>
                <label
                  htmlFor="actividad_3"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
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
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                />
              </div>
            </div>
          </div>

          {/* INFORMACIÓN DE LA VACANTE */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Información de la vacante
            </h3>

            <p className="mt-1 text-sm text-gris-oscuro">
              Define el área asignada, horario, jefe inmediato y número de vacantes disponibles.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {/* ÁREA ASIGNADA */}
              <div>
                <label
                  htmlFor="area_asignada"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Área asignada *
                </label>

                <input
                  id="area_asignada"
                  name="area_asignada"
                  type="text"
                  value={formulario.area_asignada}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Dirección, Departamento de..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                />

                <p className="mt-2 text-xs text-gris-oscuro">
                  Indica el departamento, área o programa específico donde realizará sus actividades.
                </p>
              </div>

              {/* HORARIO */}
              <div>
                <label
                  htmlFor="horario"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Horario *
                </label>

                <select
                  id="horario"
                  name="horario"
                  value={formulario.horario}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                >
                  <option value="">
                    Selecciona un horario
                  </option>

                  <option value="Matutino (8:30-12:30)">
                    Matutino (8:30-12:30)
                  </option>

                  <option value="Vespertino (12:30-16:30)">
                    Vespertino (12:30-16:30)
                  </option>
                </select>
              </div>

              {/* JEFE INMEDIATO */}
              <div>
                <label
                  htmlFor="jefe_inmediato"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Jefe(a) inmediato(a) *
                </label>

                <input
                  id="jefe_inmediato"
                  name="jefe_inmediato"
                  type="text"
                  value={formulario.jefe_inmediato}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del jefe(a) inmediato(a)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                />
              </div>

              {/* NÚMERO DE VACANTES */}
              <div>
                <label
                  htmlFor="vacantes_disponibles"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]"
                />
              </div>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* BOTONES */}
          <div className="flex items-center justify-end gap-3">
            <a
              href="/coordinador"
              className="rounded-lg border border-[#707272]/40 px-5 py-3 text-sm font-medium text-gris-oscuro transition hover:bg-[#D4C29C]/20 hover:text-vino-oscuro"
            >
              Cancelar
            </a>

            <button
              type="submit"
              disabled={
                guardando ||
                loadingAreas ||
                loadingCarreras ||
                areas.length === 0
              }
              className="rounded-lg bg-vino-oscuro px-5 py-3 text-sm font-medium text-white transition hover:bg-vino-claro disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando
                ? "Guardando..."
                : "Guardar vacante"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}