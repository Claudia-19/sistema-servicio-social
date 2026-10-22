"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
type Area = {
  id: number;
  nombre: string;
};

type Adscripcion = {
  id: number;
  nombre: string;
  clave: string | null;
};

type Personal = {
  id: number;
  nombre: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  puesto: string | null;
  adscripcion_id: number | null;
};
type ProgramaCatalogo = {
  clave: string;
  programa: string;
  perfiles: string[];
};
const programasPorArea: Array<{
  nombres: string[];
  datos: ProgramaCatalogo;
}> = [
  { nombres: ["ADMINISTRACIÓN", "SECRETARÍA DE ADMINISTRACIÓN"], datos: { clave: "14P15-3B026D091F046-SSA", programa: "La Administración al Interior del Gobierno Municipal", perfiles: ["Lic. en Psicología", "Lic. en Administración", "Lic. en Sistemas Computacionales", "Lic. en Contaduría", "Lic. en Derecho", "Técnico en Electricidad", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Contabilidad", "Técnico en Logística", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["SISTEMA DIF MUNICIPAL"], datos: { clave: "14P16-3B001D003E002F003-SSA", programa: "Asistencia al Sistema DIF Municipal de Pachuca", perfiles: ["Lic. en Psicología", "Lic. en Ciencias de la Educación", "Lic. en Derecho", "Lic. en Pedagogía", "Lic. en Diseño Grafico", "Lic. en Administración", "Lic. en Sistemas Computacionales", "Lic. en Trabajo Social", "Lic. en Gastronomía", "Lic. en Nutrición", "Lic. en Intervención Educativa", "Lic. en Psicopedagogía", "Lic. en Terapia Física", "Lic. y Técnico en Puericultura", "Lic. y Técnico en Gericultura", "Técnico en Programación", "Técnico en Contabilidad", "Técnico en Preparación de Alimentos y Bebidas", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["DESARROLLO HUMANO Y SOCIAL"], datos: { clave: "14P16-3D006E004F009-SSA", programa: "Fortalecimiento del Desarrollo Social en la Ciudadanía del Municipio de Pachuca", perfiles: ["Lic. en Sistemas Computacionales", "Lic. en Diseño Grafico", "Lic. en Contaduría", "Lic. en Administración", "Lic. en Trabajo Social", "Lic. en Ciencias de la Comunicación", "Lic. en Arquitectura", "Lic. en Ciencias de la Educación", "Lic. en Historia de México", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Logística", "Técnico en Soporte y Mantenimiento de Computo", "Técnico en Diseño Gráfico Digital"] } },
  { nombres: ["MEDIO AMBIENTE Y DESARROLLO SUSTENTABLE"], datos: { clave: "14P16-3A002C001D020F025-SSA", programa: "Fomentar los Hábitos Ambientales en la Ciudadanía del Municipio de Pachuca", perfiles: ["Ing. Forestal", "Lic. en Biología", "Lic. en Administración", "Técnico en Administración en Recursos Humanos", "Técnico en Soporte y Mantenimiento de Computo", "Técnico en Contabilidad"] } },
  { nombres: ["TESORERÍA MUNICIPAL"], datos: { clave: "14P16-3D007F010-SSA", programa: "Fortalecimiento a la Tesorería Municipal", perfiles: ["Lic. en Arquitectura", "Lic. en Administración", "Lic. en Sistemas Computacionales", "Lic. en Contaduría", "Lic. en Derecho", "Técnico en Construcción", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Contabilidad", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["OBRAS PÚBLICAS, DESARROLLO URBANO, VIVIENDA Y MOVILIDAD"], datos: { clave: "14P16-3D008F011-SSA", programa: "Fortalecimiento de la Construcción de Obras Públicas y Desarrollo Urbano en el Municipio de Pachuca", perfiles: ["Lic. en Arquitectura", "Lic. en Construcción", "Lic. en Diseño Grafico", "Lic. en Administración", "Lic. en Sistemas Computacionales", "Técnico en Construcción", "Técnico en Administración en Recursos Humanos", "Técnico en Programación", "Técnico en Logística", "Técnico en Diseño Gráfico Digital"] } },
  { nombres: ["SERVICIOS PÚBLICOS MUNICIPALES"], datos: { clave: "14P16-3A001D014F013-SSA", programa: "Fortalecimiento en los Servicios Públicos Municipales", perfiles: ["Lic. en Sistemas Computacionales", "Lic. en Diseño Grafico", "Lic. en Automotriz", "Lic. en Administración", "Lic. en Derecho", "Lic. en Zootecnia y Veterinaria", "Ing. Forestal", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Electricidad"] } },
  { nombres: ["SEGURIDAD PÚBLICA, TRÁNSITO Y VIALIDAD MUNICIPAL"], datos: { clave: "14P16-3B009D037F038-SSA", programa: "Fortalecer y Salvaguardar la Integridad Física de la Ciudadanía del Municipio de Pachuca", perfiles: ["Lic. en Derecho", "Lic. en Psicología", "Lic. en Administración", "Lic. en Contaduría", "Lic. en Sistemas Computacionales", "Lic. en Criminología", "Técnico en Administración en Recursos Humanos", "Técnico en Contabilidad"] } },
  { nombres: ["INSTITUTO MUNICIPAL PARA LA JUVENTUD DE PACHUCA"], datos: { clave: "14P16-3B007D028F032-SSA", programa: "Fortalecimiento a los Jóvenes de Pachuca", perfiles: ["Lic. en Administración", "Lic. en Psicología", "Lic. en Sistemas Computacionales", "Lic. en Mercadotecnia", "Lic. en Diseño Grafico", "Técnico en Programación", "Lic. en Ciencias de la Comunicación"] } },
  { nombres: ["SECRETARÍA DE CONTRALORÍA"], datos: { clave: "14P16-3D018F023-SSA", programa: "Fortalecimiento de los Procedimientos de la Gestión Pública Municipal", perfiles: ["Lic. en Arquitectura", "Lic. en Administración", "Lic. en Sistemas Computacionales", "Lic. en Contaduría", "Lic. en Derecho", "Ing. Civil", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["SECRETARÍA GENERAL MUNICIPAL"], datos: { clave: "14P16-3D019F024-SSA", programa: "Fortalecimiento de la Política Interna de Pachuca", perfiles: ["Lic. en Contaduría", "Lic. en Ciencias de la Comunicación", "Lic. en Derecho", "Ing. En Financiera", "Lic. en Administración", "Lic. en Sistemas Computacionales", "Técnico en Administración en Recursos Humanos", "Técnico en Logística", "Técnico en Programación", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["SECRETARÍA PARTICULAR"], datos: { clave: "14P16-3D060F046-SSA", programa: "Fortalecimiento en la Unidad con la Ciudadanía", perfiles: ["Lic. en Administración", "Lic. en Derecho", "Lic. en Contaduría", "Lic. en Ciencias de la Comunicación", "Lic. en Mercadotecnia", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Logística", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["INSTITUTO MUNICIPAL PARA LA PREVENCIÓN DE ADICCIONES"], datos: { clave: "14P16-3B004D022F027-SSA", programa: "Fortalecimiento en Prevención de Adicciones", perfiles: ["Lic. en Sistemas Computacionales", "Lic. en Psicología", "Lic. en Diseño Grafico", "Lic. en Contaduría", "Lic. en Administración", "Lic. en Mercadotecnia", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Logística", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["DESARROLLO ECONÓMICO"], datos: { clave: "14P16-3D027F031-SSA", programa: "Fortalecimiento de la Actividad Económica en el Municipio de Pachuca", perfiles: ["Lic. en Diseño Gráfico", "Lic. en Diseño Gráfico Digital", "Lic. en Comercio Exterior", "Lic. en Turismo", "Lic. en Administración", "Lic. en Ingeniería en Negocios", "Lic. en Arquitectura", "Lic. en Administración de Empresas", "Lic. en Administración de Empresas Turísticas", "Lic. en Gestión Turística y Gastronómica", "Lic.- en Ingeniería Civil", "Técnico en Logística", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Soporte y Mantenimiento de Computo", "Técnico en Secretaria Ejecutivo Bilingüe", "Técnico en Servicios y Hospedajes"] } },
  { nombres: ["INSTITUTO MUNICIPAL DE LA CULTURA"], datos: { clave: "14P16-3D029E013F033-SSA", programa: "Reforzando el Desarrollo Integral a través del Arte y la Cultura", perfiles: ["Lic. en Diseño Gráfico", "Lic. en Ciencias de la Comunicación", "Lic. en Administración", "Lic. en Danza", "Lic. en Artes", "Lic. en Sistemas Computacionales", "Lic. en Mercadotecnia", "Técnico en Logística", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["SECRETARÍA DE PLANEACIÓN E INVESTIGACIÓN"], datos: { clave: "14P16-3D030F034-SSA", programa: "Fortalecimiento de Proyectos Estratégicos en la Administración Pública Municipal", perfiles: ["Lic. en Contaduría", "Lic. en Sistemas Computacionales", "Lic. en Derecho", "Lic. en Administración", "Técnico en Logística", "Técnico en Administración en Recursos Humanos", "Técnico en Contabilidad", "Técnico en Programación", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["INSTITUTO MUNICIPAL DE INVESTIGACIÓN Y PLANEACIÓN"], datos: { clave: "14P16-3D023E010F028-SSA", programa: "Planeación e Investigación Municipal", perfiles: ["Lic. en Arquitectura", "Lic. en Ciencias Políticas y Administración Pública", "Lic. en Comunicación", "Lic. en Historia de México", "Lic. en Diseño Gráfico", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["SECRETARÍA DE LAS MUJERES DE PACHUCA"], datos: { clave: "14P16-3B006D025F029-SSA", programa: "Fortalecimiento Municipal para las Mujeres de Pachuca", perfiles: ["Lic. en Diseño Grafico", "Lic. en Psicología", "Lic. en Mercadotecnia", "Lic. en Administración", "Lic. en Trabajo Social", "Lic. en Derecho", "Técnico en Administración en Recursos Humanos", "Técnico en Soporte y Mantenimiento de Computo"] } },
  { nombres: ["INSTITUTO MUNICIPAL DEL DEPORTE"], datos: { clave: "14P16-3B019D084E054F060-SSA", programa: "Fortalecimiento al Instituto Municipal del Deporte", perfiles: ["Lic. en Diseño Grafico", "Lic. en Educación Física", "Lic. en Nutrición", "Lic. en Comunicación", "Lic. en Administración", "Lic. en Mercadotecnia", "Lic. en Psicología", "Técnico en Logística", "Técnico en Programación", "Técnico en Administración en Recursos Humanos", "Técnico en Soporte y Mantenimiento de Computo", "Técnico en Diseño Gráfico Digital"] } },
];
const normalizarTexto = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
const obtenerPrograma = (nombreArea: string) => {
  const nombreNormalizado = normalizarTexto(nombreArea);
  return programasPorArea.find((item) =>
    item.nombres.some((nombre) => normalizarTexto(nombre) === nombreNormalizado)
  )?.datos ?? null;
};
export default function NuevaNecesidadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [area, setArea] = useState<Area | null>(null);
  const [loadingArea, setLoadingArea] = useState(true);
  const [adscripciones, setAdscripciones] = useState<Adscripcion[]>([]);
  const [loadingAdscripciones, setLoadingAdscripciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [formulario, setFormulario] = useState({
    area_id: "",
    adscripcion_id: "",
    jefe_inmediato_id: "",
    perfil_requerido: "",
    carrera: "",
    carrera_otra: "",
    justificacion_carrera_otra: "",
    actividad_1: "",
    actividad_2: "",
    actividad_3: "",
    area_asignada: "",
    horario: "",
    jefe_inmediato: "",
    vacantes_disponibles: "1",
  });
  useEffect(() => {
    const cargarArea = async () => {
      setLoadingArea(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Tu sesión ha expirado.");
        setLoadingArea(false);
        return;
      }
      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("area_id")
        .eq("id", user.id)
        .single();
      if (usuarioError || !usuario?.area_id) {
        console.error(usuarioError);
        setError("No fue posible identificar el área de adscripción de tu cuenta.");
        setLoadingArea(false);
        return;
      }
      const { data: areaData, error: areaError } = await supabase
        .from("areas")
        .select("id, nombre")
        .eq("id", usuario.area_id)
        .eq("activo", true)
        .single();
      if (areaError || !areaData) {
        console.error(areaError);
        setError("No fue posible cargar tu área de adscripción.");
      } else {
        setArea(areaData);
        setFormulario((prev) => ({ ...prev, area_id: String(areaData.id) }));

        setLoadingAdscripciones(true);
        const { data: adscripcionesData, error: adscripcionesError } = await supabase
          .from("adscripciones")
          .select("id, nombre, clave")
          .eq("area_id", areaData.id)
          .eq("activo", true)
          .order("nombre", { ascending: true });

        if (adscripcionesError) {
          console.error(adscripcionesError);
          setError("No fue posible cargar las adscripciones disponibles.");
          setAdscripciones([]);
        } else {
          setAdscripciones(adscripcionesData ?? []);
        }
        setLoadingAdscripciones(false);
      }
      setLoadingArea(false);
    };
    cargarArea();
  }, [supabase]);
  const [loadingResponsable, setLoadingResponsable] = useState(false);
  const [errorResponsable, setErrorResponsable] = useState("");

  const obtenerPrioridadPuesto = (puesto: string | null) => {
    const cargo = (puesto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (cargo.includes("DIRECTOR GENERAL")) return 1;
    if (cargo.includes("DIRECTOR DE AREA") || cargo === "DIRECTOR") return 2;
    if (cargo.includes("TITULAR")) return 3;
    if (cargo.includes("SUBDIRECTOR")) return 4;
    if (cargo.includes("JEFE DE DEPARTAMENTO")) return 5;
    if (cargo.includes("JEFE DE AREA") || cargo === "JEFE") return 6;
    if (cargo.includes("COORDINADOR")) return 7;
    return 8;
  };

  const handleChange = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({ ...prev, [name]: value }));

    if (name !== "adscripcion_id") return;

    setFormulario((prev) => ({
      ...prev,
      adscripcion_id: value,
      jefe_inmediato: "",
      jefe_inmediato_id: "",
    }));
    setErrorResponsable("");

    if (!value) return;

    setLoadingResponsable(true);
    const { data: personalData, error: personalError } = await supabase
      .from("personal")
      .select("id, nombre, apellido_paterno, apellido_materno, puesto, adscripcion_id")
      .eq("adscripcion_id", Number(value))
      .eq("activo", true);

    if (personalError) {
      console.error("ERROR AL CARGAR RESPONSABLE:", personalError);
      setErrorResponsable("No fue posible cargar el responsable de esta adscripción.");
      setLoadingResponsable(false);
      return;
    }

    const personal = (personalData ?? []) as Personal[];
    if (personal.length === 0) {
      setErrorResponsable("No hay personal activo registrado para esta adscripción.");
      setLoadingResponsable(false);
      return;
    }

    personal.sort((a, b) => {
      const prioridad = obtenerPrioridadPuesto(a.puesto) - obtenerPrioridadPuesto(b.puesto);
      if (prioridad !== 0) return prioridad;
      const nombreA = `${a.nombre ?? ""} ${a.apellido_paterno ?? ""} ${a.apellido_materno ?? ""}`.trim();
      const nombreB = `${b.nombre ?? ""} ${b.apellido_paterno ?? ""} ${b.apellido_materno ?? ""}`.trim();
      return nombreA.localeCompare(nombreB, "es");
    });

    const responsable = personal[0];
    const nombreResponsable = `${responsable.nombre ?? ""} ${responsable.apellido_paterno ?? ""} ${responsable.apellido_materno ?? ""}`.replace(/\s+/g, " ").trim();

    setFormulario((prev) => ({
      ...prev,
      jefe_inmediato: nombreResponsable,
      jefe_inmediato_id: String(responsable.id),
    }));
    setLoadingResponsable(false);
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
      .select("rol_id, area_id")
      .eq("id", user.id)
      .single();
    if (!usuario || usuario.rol_id !== 3) {
      setError(
        "No tienes permisos para registrar vacantes."
      );
      setGuardando(false);
      return;
    }
    if (!usuario.area_id) {
      setError(
        "Tu cuenta no tiene un área de adscripción asignada."
      );
      setGuardando(false);
      return;
    }
    if (!formulario.adscripcion_id) {
      setError("Selecciona la adscripción donde se incorporará el prestador.");
      setGuardando(false);
      return;
    }

    const programa = area ? obtenerPrograma(area.nombre) : null;
    if (!programa) {
      setError("No se encontró un programa configurado para el área de adscripción de esta cuenta.");
      setGuardando(false);
      return;
    }
    if (!formulario.carrera.trim()) {
      setError("Selecciona un perfil académico.");
      setGuardando(false);
      return;
    }
    if (formulario.carrera === "Otra") {
      if (!formulario.carrera_otra.trim()) {
        setError("Especifica el perfil académico solicitado.");
        setGuardando(false);
        return;
      }
      if (!formulario.justificacion_carrera_otra.trim()) {
        setError("La justificación es obligatoria cuando se solicita otra carrera o perfil.");
        setGuardando(false);
        return;
      }
    }
    const { error } = await supabase
      .from("necesidades")
      .insert({
        coordinador_id: user.id,
        area_id: usuario.area_id,
        adscripcion_id: Number(formulario.adscripcion_id),
        programa: programa.programa,
        clave_programa: programa.clave,
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
        justificacion_carrera_otra:
          formulario.carrera === "Otra"
            ? formulario.justificacion_carrera_otra.trim()
            : null,
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
        // Se conserva el campo anterior para compatibilidad con el resto del sistema.
        area_asignada:
          adscripciones.find((item) => String(item.id) === formulario.adscripcion_id)?.nombre ?? "",
        horario:
          formulario.horario.trim(),
        jefe_inmediato_id: formulario.jefe_inmediato_id ? Number(formulario.jefe_inmediato_id) : null,
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
              <div className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-900">
                {loadingArea
                  ? "Cargando área de adscripción..."
                  : area?.nombre ?? "No hay un área de adscripción asignada"}
              </div>
              {!loadingArea && !area && (
                <p className="mt-2 text-sm text-amber-700">
                  Tu cuenta todavía no tiene un área de adscripción asignada.
                </p>
              )}
            </div>
          </div>
          {/* DATOS DEL PROGRAMA */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-claro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">Datos del programa</h3>
            <p className="mt-1 text-sm text-gris-oscuro">El programa y la clave se asignan automáticamente de acuerdo con el área de adscripción.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-vino-oscuro">Programa</label>
                <div className="min-h-[48px] rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-900">
                  {loadingArea ? "Cargando programa..." : obtenerPrograma(area?.nombre ?? "")?.programa ?? "Sin programa configurado"}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-vino-oscuro">Clave del programa</label>
                <div className="min-h-[48px] rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-900">
                  {loadingArea ? "Cargando clave..." : obtenerPrograma(area?.nombre ?? "")?.clave ?? "Sin clave configurada"}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-claro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">Perfil académico requerido</h3>
            <p className="mt-1 text-sm text-gris-oscuro">Selecciona el perfil académico que requiere la vacante de acuerdo con el programa.</p>
            <div className="mt-5">
              <label htmlFor="carrera" className="mb-2 block text-sm font-medium text-vino-oscuro">Perfil académico requerido *</label>
              <select id="carrera" name="carrera" value={formulario.carrera} onChange={handleChange} required disabled={loadingArea || !area || !obtenerPrograma(area?.nombre ?? "")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-100">
                <option value="">{loadingArea ? "Cargando perfiles..." : "Selecciona un perfil académico"}</option>
                {obtenerPrograma(area?.nombre ?? "")?.perfiles.map((perfil) => (
                  <option key={perfil} value={perfil}>{perfil}</option>
                ))}
                <option value="Otra">Otra</option>
              </select>
            </div>
            {formulario.carrera === "Otra" && (
              <div className="mt-5 space-y-5">
                <div>
                  <label htmlFor="carrera_otra" className="mb-2 block text-sm font-medium text-vino-oscuro">Especifica el perfil académico solicitado *</label>
                  <input id="carrera_otra" name="carrera_otra" type="text" value={formulario.carrera_otra} onChange={handleChange} required placeholder="Escribe la carrera o perfil requerido" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]" />
                </div>
                <div>
                  <label htmlFor="justificacion_carrera_otra" className="mb-2 block text-sm font-medium text-vino-oscuro">Justificación de la solicitud *</label>
                  <textarea id="justificacion_carrera_otra" name="justificacion_carrera_otra" value={formulario.justificacion_carrera_otra} onChange={handleChange} required rows={3} placeholder="Indica por qué se requiere un perfil diferente a los establecidos para el programa." className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C]" />
                </div>
              </div>
            )}
          </div>
          {/* CONOCIMIENTOS REQUERIDOS */}
          <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-dorado-oscuro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">
              Conocimientos requeridos
            </h3>
            <p className="mt-1 text-sm text-gris-oscuro">
              Describe los conocimientos que requiere la vacante.
            </p>
            <div className="mt-5">
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
              {/* ADSCRIPCIÓN ESPECÍFICA */}
              <div>
                <label
                  htmlFor="adscripcion_id"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Adscripción *
                </label>
                <select
                  id="adscripcion_id"
                  name="adscripcion_id"
                  value={formulario.adscripcion_id}
                  onChange={handleChange}
                  required
                  disabled={loadingArea || loadingAdscripciones || !area || adscripciones.length === 0}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingArea || loadingAdscripciones
                      ? "Cargando adscripciones..."
                      : adscripciones.length === 0
                        ? "No hay adscripciones disponibles"
                        : "Selecciona una adscripción"}
                  </option>
                  {adscripciones.map((adscripcion) => (
                    <option key={adscripcion.id} value={adscripcion.id}>
                      {adscripcion.nombre}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gris-oscuro">
                  Selecciona la adscripción específica donde se incorporará el prestador.
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
                  value={loadingResponsable ? "Buscando responsable..." : formulario.jefe_inmediato}
                  readOnly
                  required
                  placeholder={formulario.adscripcion_id ? "Responsable de la adscripción" : "Selecciona primero una adscripción"}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-900 outline-none"
                />
                {errorResponsable && (
                  <p className="mt-2 text-xs text-red-600">{errorResponsable}</p>
                )}
                {!errorResponsable && formulario.jefe_inmediato && (
                  <p className="mt-2 text-xs text-gris-oscuro">
                    Responsable identificado automáticamente según el puesto registrado.
                  </p>
                )}
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
                loadingArea ||
                !area
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
