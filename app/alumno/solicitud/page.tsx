"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function SolicitudPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formulario, setFormulario] = useState({
    nombre: "",
    domicilio: "",
    institucion: "",
    carrera: "",
    semestre: "",
    matricula: "",
    telefono: "",
    telefonoCasa: "",
    correo: "",
    tipoProceso: "",
    fechaInicio: "",
    horario: "",
    horasRequeridas: "",
    informacionAdicional: "",
    nombrePapa: "",
    telefonoPapa: "",
    nombreMama: "",
    telefonoMama: "",
    nombreTutor: "",
    telefonoTutor: "",
    emergencia1Nombre: "",
    emergencia1Parentesco: "",
    emergencia1Telefono: "",
    emergencia2Nombre: "",
    emergencia2Parentesco: "",
    emergencia2Telefono: "",
  });
  const [instituciones, setInstituciones] = useState<
    { id: number; nombre: string; nivel_educativo: string }[]
  >([]);
  const [institucionesCargando, setInstitucionesCargando] = useState(true);
  const [mostrarOtraInstitucion, setMostrarOtraInstitucion] = useState(false);
  const [fotografia, setFotografia] = useState<File | null>(null);
  const [fotografiaPreview, setFotografiaPreview] = useState("");
  const [fotografiaUrl, setFotografiaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [solicitudExistente, setSolicitudExistente] = useState(false);
  const [cargandoSolicitud, setCargandoSolicitud] = useState(true);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [aceptaAvisoPrivacidad, setAceptaAvisoPrivacidad] =
    useState(false);
  useEffect(() => {
    const obtenerInstituciones = async () => {
      const { data, error } = await supabase
        .from("instituciones_educativas")
        .select("id, nombre, nivel_educativo")
        .eq("activo", true)
        .order("nombre", { ascending: true });
      if (error) {
        console.error("Error al cargar instituciones:", error);
        setInstituciones([]);
      } else {
        setInstituciones(data ?? []);
      }
      setInstitucionesCargando(false);
    };
    obtenerInstituciones();
  }, [supabase]);
  useEffect(() => {
    const obtenerSolicitud = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCargandoSolicitud(false);
        return;
      }
      const { data: solicitud } = await supabase
        .from("solicitudes")
        .select("*")
        .eq("usuario_id", user.id)
        .order("fecha_solicitud", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (solicitud) {
        setSolicitudExistente(true);
        setFormulario({
          nombre: solicitud.nombre ?? "",
          domicilio: solicitud.domicilio ?? "",
          institucion: solicitud.institucion_educativa ?? "",
          carrera: solicitud.carrera ?? "",
          semestre: solicitud.semestre_cuatrimestre ?? "",
          matricula: solicitud.matricula ?? "",
          telefono: solicitud.telefono ?? "",
          telefonoCasa: solicitud.telefono_casa ?? "",
          correo: solicitud.correo ?? "",
          tipoProceso: solicitud.tipo_proceso ?? "",
          fechaInicio: solicitud.fecha_inicio ?? "",
          horario: solicitud.horario_propuesto ?? "",
          horasRequeridas:
            solicitud.horas_requeridas?.toString() ?? "",
          informacionAdicional:
            solicitud.informacion_adicional ?? "",
          nombrePapa: solicitud.nombre_papa ?? "",
          telefonoPapa: solicitud.telefono_papa ?? "",
          nombreMama: solicitud.nombre_mama ?? "",
          telefonoMama: solicitud.telefono_mama ?? "",
          nombreTutor: solicitud.nombre_tutor ?? "",
          telefonoTutor: solicitud.telefono_tutor ?? "",
          emergencia1Nombre:
            solicitud.emergencia_1_nombre ?? "",
          emergencia1Parentesco:
            solicitud.emergencia_1_parentesco ?? "",
          emergencia1Telefono:
            solicitud.emergencia_1_telefono ?? "",
          emergencia2Nombre:
            solicitud.emergencia_2_nombre ?? "",
          emergencia2Parentesco:
            solicitud.emergencia_2_parentesco ?? "",
          emergencia2Telefono:
            solicitud.emergencia_2_telefono ?? "",
        });
        if (solicitud.fotografia_url) {
          let rutaFotografia = solicitud.fotografia_url;
          if (
            rutaFotografia.includes(
              "/storage/v1/object/public/fotos-alumnos/"
            )
          ) {
            rutaFotografia = rutaFotografia.split(
              "/storage/v1/object/public/fotos-alumnos/"
            )[1];
          }
          if (rutaFotografia) {
            const {
              data: signedUrlData,
              error: signedUrlError,
            } = await supabase.storage
              .from("fotos-alumnos")
              .createSignedUrl(rutaFotografia, 60 * 60);
            if (
              !signedUrlError &&
              signedUrlData?.signedUrl
            ) {
              setFotografiaUrl(signedUrlData.signedUrl);
            }
          }
        }
      }
      setCargandoSolicitud(false);
    };
    obtenerSolicitud();
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
  const handleFotografiaChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivo = e.target.files?.[0];
    if (!archivo) {
      setFotografia(null);
      setFotografiaPreview("");
      return;
    }
    if (!archivo.type.startsWith("image/")) {
      setError(
        "La fotografía debe ser un archivo de imagen."
      );
      e.target.value = "";
      setFotografia(null);
      setFotografiaPreview("");
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setError(
        "La fotografía no debe superar los 5 MB."
      );
      e.target.value = "";
      setFotografia(null);
      setFotografiaPreview("");
      return;
    }
    setError("");
    setFotografia(archivo);
    setFotografiaPreview(URL.createObjectURL(archivo));
  };
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!aceptaAvisoPrivacidad) {
      setError(
        "Debe aceptar el Aviso de Privacidad para enviar la solicitud."
      );
      setLoading(false);
      return;
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(
        "Su sesión ha expirado. Inicie sesión nuevamente."
      );
      setLoading(false);
      return;
    }
    if (!fotografia) {
      setError(
        "Debe adjuntar una fotografía para enviar la solicitud."
      );
      setLoading(false);
      return;
    }
    const extension =
      fotografia.name.split(".").pop()?.toLowerCase() || "jpg";
    const nombreArchivo = `${user.id}-${Date.now()}.${extension}`;
    const rutaFotografia = `${user.id}/${nombreArchivo}`;
    const { error: uploadError } = await supabase.storage
      .from("fotos-alumnos")
      .upload(rutaFotografia, fotografia, {
        cacheControl: "3600",
        upsert: false,
        contentType: fotografia.type,
      });
    if (uploadError) {
      console.error(uploadError);
      setError(
        "No fue posible subir la fotografía. Inténtelo nuevamente."
      );
      setLoading(false);
      return;
    }
    const horas =
      formulario.horasRequeridas.trim() === ""
        ? null
        : Number(formulario.horasRequeridas);
    const { error: insertError } = await supabase
      .from("solicitudes")
      .insert({
        usuario_id: user.id,
        nombre: formulario.nombre,
        domicilio: formulario.domicilio,
        institucion_educativa: formulario.institucion,
        carrera: formulario.carrera,
        semestre_cuatrimestre: formulario.semestre,
        matricula: formulario.matricula,
        telefono: formulario.telefono,
        telefono_casa: formulario.telefonoCasa,
        correo: formulario.correo,
        tipo_proceso: formulario.tipoProceso,
        fecha_inicio: formulario.fechaInicio || null,
        horario_propuesto: formulario.horario,
        horas_requeridas: horas,
        informacion_adicional:
          formulario.informacionAdicional,
        nombre_papa: formulario.nombrePapa,
        telefono_papa: formulario.telefonoPapa,
        nombre_mama: formulario.nombreMama,
        telefono_mama: formulario.telefonoMama,
        nombre_tutor: formulario.nombreTutor,
        telefono_tutor: formulario.telefonoTutor,
        emergencia_1_nombre:
          formulario.emergencia1Nombre,
        emergencia_1_parentesco:
          formulario.emergencia1Parentesco,
        emergencia_1_telefono:
          formulario.emergencia1Telefono,
        emergencia_2_nombre:
          formulario.emergencia2Nombre,
        emergencia_2_parentesco:
          formulario.emergencia2Parentesco,
        emergencia_2_telefono:
          formulario.emergencia2Telefono,
        fotografia_url: rutaFotografia,
      });
    if (insertError) {
      console.error(insertError);
      await supabase.storage
        .from("fotos-alumnos")
        .remove([rutaFotografia]);
      setError(
        "No fue posible enviar la solicitud. Inténtelo nuevamente."
      );
      setLoading(false);
      return;
    }
    const { data: signedUrlData } = await supabase.storage
      .from("fotos-alumnos")
      .createSignedUrl(rutaFotografia, 60 * 60);
    setFotografiaUrl(signedUrlData?.signedUrl ?? "");
    setSolicitudEnviada(true);
    setLoading(false);
  };
  if (cargandoSolicitud) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b border-[#621132] bg-[#621132]">
          <div className="mx-auto max-w-7xl px-6 py-3">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la Transformación"
              className="h-16 w-auto object-contain"
            />
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-gris-oscuro">
            Cargando su solicitud...
          </p>
        </div>
      </main>
    );
  }
  if (solicitudEnviada) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b border-[#621132] bg-[#621132]">
          <div className="mx-auto max-w-7xl px-6 py-3">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la Transformación" className="h-16 w-auto object-contain"
            />
          </div>
        </header>
        <section className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="rounded-xl border border-dorado-claro bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4C29C]">
                <span className="text-3xl text-vino-oscuro">
                  ✓
                </span>
              </div>
              <h2 className="text-3xl font-bold text-vino-oscuro">
                ¡Solicitud recibida!
              </h2>
              <p className="mt-5 text-base leading-7 text-gris-oscuro">
                Hemos recibido su solicitud correctamente.
              </p>
              <p className="mt-3 text-base leading-7 text-gris-oscuro">
                El{" "}
                <strong className="text-vino-oscuro">
                  Departamento de Profesionalización
                </strong>{" "}
                atenderá su solicitud en un plazo máximo de{" "}
                <strong className="text-vino-oscuro">
                  dos días hábiles
                </strong>
                .
              </p>
              <p className="mt-3 text-base leading-7 text-gris-oscuro">
                Le recomendamos estar pendiente de su{" "}
                <strong className="text-vino-oscuro">
                  correo electrónico
                </strong>
                , ya que recibirá información relacionada con
                el seguimiento de su solicitud.
              </p>
             <div className="mt-8">
                <button
                  onClick={() => {
                    router.push("/alumno");
                    router.refresh();
                  }}
                  className="rounded-lg bg-vino-oscuro px-6 py-3 font-medium text-white transition hover:bg-vino-claro"
                >
                  Volver a mi perfil
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <img
            src="/logo-pachuca.png"
            alt="Pachuca Capital de la Transformación"
            className="h-16 w-auto object-contain"
          />
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-10">
        {/* REGRESAR */}
        <div className="mb-6">
          <a
            href="/alumno"
            className="inline-flex items-center text-sm text-gris-oscuro transition hover:text-vino-oscuro"
          >
            ← Regresar
          </a>
        </div>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-vino-claro">
            Estudiante
          </p>
          <h2 className="mt-2 text-3xl font-bold text-vino-oscuro">
            Solicitud
          </h2>
          <p className="mt-2 text-gris-oscuro">
            Complete la información solicitada para iniciar su proceso.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-dorado-claro bg-white p-8 shadow-sm"
        >
          {/* DATOS DEL ESTUDIANTE */}
          <div>
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">
              Datos del estudiante
            </h3>
            <p className="mt-1 text-sm text-gris-oscuro">
              Proporcione sus datos personales y académicos.
            </p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* NOMBRE */}
            <div className="md:col-span-2">
              <label
                htmlFor="nombre"
                className="mb-2 block text-sm font-medium text-vino-oscuro"              >
                Nombre completo{" "}
                <span className="text-red-600">*</span>
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Escriba su nombre en el siguiente orden: nombre(s),
                apellido paterno, apellido materno.
                Ejemplo: Claudia Galván Flores.
              </p>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formulario.nombre}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. Claudia Galván Flores"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* DOMICILIO */}
            <div className="md:col-span-2">
              <label
                htmlFor="domicilio"
                className="mb-2 block text-sm font-medium text-vino-oscuro"              >
                Domicilio particular{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="domicilio"
                name="domicilio"
                type="text"
                value={formulario.domicilio}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. Calle Morelos No. 25, Col. Centro, Localidad El Arenal, Municipio de Pachuca de Soto, Hidalgo"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* INSTITUCIÓN */}
            <div>
              <label
                htmlFor="institucion"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Institución educativa{" "}
                <span className="text-red-600">*</span>
              </label>
              {!mostrarOtraInstitucion ? (
                <>
                  <input
                    id="institucion"
                    name="institucion"
                    type="text"
                    list="instituciones-catalogo"
                    value={formulario.institucion}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setFormulario({ ...formulario, institucion: valor });
                    }}
                    required
                    disabled={solicitudExistente || institucionesCargando}
                    placeholder={institucionesCargando ? "Cargando instituciones..." : "Escriba para buscar su institución"}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                  />
                  <datalist id="instituciones-catalogo">
                    {instituciones.map((institucion) => (
                      <option key={institucion.id} value={institucion.nombre}>
                        {institucion.nivel_educativo}
                      </option>
                    ))}
                  </datalist>
                  <button type="button" onClick={() => { setMostrarOtraInstitucion(true); setFormulario({ ...formulario, institucion: "" }); }} disabled={solicitudExistente} className="mt-2 text-sm font-medium text-vino-oscuro underline underline-offset-2 transition hover:text-vino-claro disabled:cursor-not-allowed disabled:text-gray-400">
                    No encuentro mi institución
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Escriba el nombre de su institución para buscarla en el catálogo.
                  </p>
                </>
              ) : (
                <>
                  <input
                    id="institucion"
                    name="institucion"
                    type="text"
                    value={formulario.institucion}
                    onChange={handleChange}
                    required
                    disabled={solicitudExistente}
                    placeholder="Escriba el nombre completo de su institución"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                  />
                  <button type="button" onClick={() => { setMostrarOtraInstitucion(false); setFormulario({ ...formulario, institucion: "" }); }} disabled={solicitudExistente} className="mt-2 text-sm font-medium text-vino-oscuro underline underline-offset-2 transition hover:text-vino-claro disabled:cursor-not-allowed disabled:text-gray-400">
                    ← Buscar en el catálogo
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Si su institución no aparece en el catálogo, escriba aquí su nombre completo.
                  </p>
                </>
              )}
            </div>
            {/* CARRERA */}
            <div>
              <label
                htmlFor="carrera"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Carrera{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="carrera"
                name="carrera"
                type="text"
                value={formulario.carrera}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. Ingeniería en Software"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* SEMESTRE */}
            <div>
              <label
                htmlFor="semestre"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Semestre / Cuatrimestre{" "}
                <span className="text-red-600">*</span>
              </label>
              <select
                id="semestre"
                name="semestre"
                value={formulario.semestre}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50"
              >
                <option value="">
                  Seleccione una opción
                </option>
                {Array.from({ length: 12 }, (_, index) => {
                  const numero = index + 1;
                  return (
                    <option
                      key={numero}
                      value={`${numero}`}
                    >
                      {numero}°
                    </option>
                  );
                })}
              </select>
            </div>
            {/* MATRÍCULA */}
            <div>
              <label
                htmlFor="matricula"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Matrícula / Número de control{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="matricula"
                name="matricula"
                type="text"
                value={formulario.matricula}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ingrese su matrícula"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* TELÉFONO CELULAR */}
            <div>
              <label
                htmlFor="telefono"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Teléfono celular{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formulario.telefono}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. 771 123 4567"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* TELÉFONO CASA */}
            <div>
              <label
                htmlFor="telefonoCasa"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Teléfono de casa
              </label>
              <input
                id="telefonoCasa"
                name="telefonoCasa"
                type="tel"
                value={formulario.telefonoCasa}
                onChange={handleChange}
                disabled={solicitudExistente}
                placeholder="Ej. 771 123 4567"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* CORREO */}
            <div className="md:col-span-2">
              <label
                htmlFor="correo"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Correo electrónico{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                value={formulario.correo}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. estudiante@correo.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
          </div>
          {/* DATOS DEL PROCESO */}
          <div className="mt-10 border-t border-dorado-claro pt-8">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">
              Datos del proceso
            </h3>
            <p className="mt-1 text-sm text-gris-oscuro">
              Indique la información relacionada con el servicio
              social, prácticas profesionales o estadía.
            </p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* TIPO DE PROCESO */}
            <div>
              <label
                htmlFor="tipoProceso"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Tipo de proceso{" "}
                <span className="text-red-600">*</span>
              </label>
              <select
                id="tipoProceso"
                name="tipoProceso"
                value={formulario.tipoProceso}
                onChange={handleChange}                required
                disabled={solicitudExistente}                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50"
              >
                <option value="">
                  Seleccione una opción
                </option>
                <option value="Servicio social">
                  Servicio social
                </option>
                <option value="Prácticas profesionales">
                  Prácticas profesionales
                </option>
                <option value="Estadía">
                  Estadía
                </option>
                <option value="Otro">
                  Otro
                </option>
              </select>
            </div>
            {/* FECHA */}
            <div>
              <label
                htmlFor="fechaInicio"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Fecha de inicio
              </label>
              <input
                id="fechaInicio"
                name="fechaInicio"
                type="date"
                value={formulario.fechaInicio}
                onChange={handleChange}
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50"
              />
            </div>
            {/* HORARIO */}
            <div>
              <label
                htmlFor="horario"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Horario propuesto{" "}
                <span className="text-red-600">*</span>
              </label>
              <select
                id="horario"
                name="horario"
                value={formulario.horario}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              >
                <option value="">
                  Seleccione un horario
                </option>
                <option value="Matutino (8:30-12:30)">
                  Matutino (8:30-12:30)
                </option>
                <option value="Vespertino (12:30-16:30)">
                  Vespertino (12:30-16:30)
                </option>
              </select>
            </div>
            {/* TOTAL DE HORAS */}
            <div>
              <label
                htmlFor="horasRequeridas"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Total de horas{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="horasRequeridas"
                name="horasRequeridas"
                type="number"
                min="1"
                step="1"
                value={formulario.horasRequeridas}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. 480"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
              <p className="mt-2 text-xs text-gray-500">
                Indique el total de horas que debe realizar de
                acuerdo con los requisitos de su institución educativa.
              </p>
            </div>
          </div>
          {/* FOTOGRAFÍA */}
          <div className="mt-10 border-t border-dorado-claro pt-8">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">
              Fotografía
            </h3>
            <p className="mt-1 text-sm text-gris-oscuro">
              Adjunte una fotografía que será utilizada para la
              identificación del estudiante.
            </p>
          </div>
          <div className="mt-6">
            <label
              htmlFor="fotografia"
              className="mb-2 block text-sm font-medium text-vino-oscuro"
            >
              Fotografía del estudiante{" "}
              <span className="text-red-600">*</span>
            </label>
            <p className="mb-3 text-sm leading-6 text-gris-oscuro">
              La fotografía debe ser{" "}
              <strong className="font-semibold text-vino-oscuro">
                formal y reciente
              </strong>
              , con buena iluminación y presentación adecuada.
              Será utilizada para la{" "}
              <strong className="font-semibold text-vino-oscuro">
                credencial del estudiante
              </strong>
              .
            </p>
            <input
              id="fotografia"
              name="fotografia"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFotografiaChange}
              required={!solicitudExistente}
              disabled={solicitudExistente}
              className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-vino-oscuro file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-vino-claro disabled:cursor-not-allowed disabled:bg-gray-50"
            />
            <p className="mt-2 text-xs text-gray-500">
              Formatos permitidos: JPG, JPEG o PNG. Tamaño máximo:
              5 MB.
            </p>
            {(fotografiaPreview || fotografiaUrl) && (
              <div className="mt-5 flex justify-center">
                <div className="overflow-hidden rounded-lg border border-dorado-claro bg-gray-50 p-2">
                  <img
                    src={fotografiaPreview || fotografiaUrl}
                    alt="Vista previa de la fotografía del estudiante"
                    className="h-48 w-40 object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          {/* REFERENCIAS PERSONALES */}
          <div className="mt-10 border-t border-dorado-claro pt-8">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">
              Referencias personales
            </h3>
            <p className="mt-1 text-sm text-gris-oscuro">
              Proporcione los datos de sus referencias personales.
              Estos datos serán utilizados únicamente para fines
              administrativos relacionados con el proceso.
            </p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* PAPÁ */}
            <div>
              <label
                htmlFor="nombrePapa"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Nombre del papá
              </label>
              <input
                id="nombrePapa"
                name="nombrePapa"
                type="text"
                value={formulario.nombrePapa}
                onChange={handleChange}
                disabled={solicitudExistente}
                placeholder="Nombre completo"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="telefonoPapa"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Teléfono del papá
              </label>
              <input
                id="telefonoPapa"
                name="telefonoPapa"
                type="tel"
                value={formulario.telefonoPapa}
                onChange={handleChange}
                disabled={solicitudExistente}
                placeholder="Teléfono donde se puede localizar"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* MAMÁ */}
            <div>
              <label
                htmlFor="nombreMama"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Nombre de la mamá
              </label>
              <input
                id="nombreMama"
                name="nombreMama"
                type="text"
                value={formulario.nombreMama}
                onChange={handleChange}
                disabled={solicitudExistente}
                placeholder="Nombre completo"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="telefonoMama"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Teléfono de la mamá
              </label>
              <input
                id="telefonoMama"
                name="telefonoMama"
                type="tel"
                value={formulario.telefonoMama}
                onChange={handleChange}
                disabled={solicitudExistente}
                placeholder="Teléfono donde se puede localizar"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            {/* TUTOR */}
            <div>
              <label
                htmlFor="nombreTutor"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Nombre del tutor, en su caso
              </label>
              <input
                id="nombreTutor"
                name="nombreTutor"
                type="text"
                value={formulario.nombreTutor}
                onChange={handleChange}
                disabled={solicitudExistente}
                placeholder="Nombre completo"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="telefonoTutor"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Teléfono del tutor
              </label>
              <input
                id="telefonoTutor"
                name="telefonoTutor"
                type="tel"
                value={formulario.telefonoTutor}
                onChange={handleChange}
                disabled={solicitudExistente}
                placeholder="Teléfono donde se puede localizar"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
          </div>
          {/* CONTACTOS DE EMERGENCIA */}
          <div className="mt-10 border-t border-dorado-claro pt-8">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">
              Personas a quienes avisar en caso de accidente
            </h3>
            <p className="mt-1 text-sm text-gris-oscuro">
              Registre las personas que puedan ser contactadas en
              caso de accidente o emergencia.
            </p>
          </div>
          <div className="mt-6">
            <h4 className="mb-4 text-sm font-semibold text-vino-oscuro">
              Contacto 1
            </h4>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label
                  htmlFor="emergencia1Nombre"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Nombre
                </label>
                <input
                  id="emergencia1Nombre"
                  name="emergencia1Nombre"
                  type="text"
                  value={formulario.emergencia1Nombre}
                  onChange={handleChange}
                  disabled={solicitudExistente}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label
                  htmlFor="emergencia1Parentesco"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Parentesco
                </label>
                <input
                  id="emergencia1Parentesco"
                  name="emergencia1Parentesco"
                  type="text"
                  value={formulario.emergencia1Parentesco}
                  onChange={handleChange}
                  disabled={solicitudExistente}
                  placeholder="Ej. Madre"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label
                  htmlFor="emergencia1Telefono"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Teléfono
                </label>
                <input
                  id="emergencia1Telefono"
                  name="emergencia1Telefono"
                  type="tel"
                  value={formulario.emergencia1Telefono}
                  onChange={handleChange}
                  disabled={solicitudExistente}
                  placeholder="Teléfono de contacto"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-semibold text-vino-oscuro">
              Contacto 2
            </h4>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label
                  htmlFor="emergencia2Nombre"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Nombre
                </label>
                <input
                  id="emergencia2Nombre"
                  name="emergencia2Nombre"
                  type="text"
                  value={formulario.emergencia2Nombre}
                  onChange={handleChange}
                  disabled={solicitudExistente}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label
                  htmlFor="emergencia2Parentesco"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Parentesco
                </label>
                <input
                  id="emergencia2Parentesco"
                  name="emergencia2Parentesco"
                  type="text"
                  value={formulario.emergencia2Parentesco}
                  onChange={handleChange}
                  disabled={solicitudExistente}
                  placeholder="Ej. Padre"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label
                  htmlFor="emergencia2Telefono"
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  Teléfono
                </label>
                <input
                  id="emergencia2Telefono"
                  name="emergencia2Telefono"
                  type="tel"
                  value={formulario.emergencia2Telefono}
                  onChange={handleChange}
                  disabled={solicitudExistente}
                  placeholder="Teléfono de contacto"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>
          {/* INFORMACIÓN ADICIONAL */}
          <div className="mt-10 border-t border-dorado-claro pt-8">
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />
            <h3 className="text-lg font-semibold text-vino-oscuro">
              Información adicional
            </h3>
          </div>
          <div className="mt-6">
            <label
              htmlFor="informacionAdicional"
              className="mb-2 block text-sm font-medium text-vino-oscuro"
            >
              Información adicional
            </label>
            <p className="mb-3 text-sm leading-6 text-gris-oscuro">
              Puede proporcionar información adicional que considere
              relevante para su proceso, como alguna condición que
              deba ser tomada en cuenta, necesidades educativas,
              situaciones particulares o{" "}
              <strong className="font-bold text-red-600">
                disponibilidad para ajustar o adelantar su fecha de
                inicio
              </strong>
              .
            </p>
            <textarea
              id="informacionAdicional"
              name="informacionAdicional"
              value={formulario.informacionAdicional}
              onChange={handleChange}
              disabled={solicitudExistente}
              rows={5}
              placeholder="Escriba aquí la información que considere relevante para su proceso."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
                    {/* AVISO DE PRIVACIDAD */}
          <div className="mt-8 rounded-lg border border-dorado-claro bg-gray-50 p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-vino-oscuro">
              Aviso de privacidad
            </h3>

            <p className="text-justify text-xs leading-5 text-gris-oscuro">
              De conformidad con lo dispuesto en el artículo 38 de la Ley de
              Protección de Datos Personales en Posesión de los Sujetos
              Obligados para el Estado de Hidalgo, el Departamento de
              Profesionalización, dependiente de la Dirección General de
              Recursos Humanos; será la responsable del uso, protección y
              tratamiento de sus datos personales, el uso de la información
              solicitada es para proveerle los servicios de localización del o
              la alumna, en caso de extravío, aclaraciones, omisiones o
              accidente. De requerirse hacer alguna transferencia de sus datos
              personales, para otro fin, se solicitará de su consentimiento y
              se le hará saber la finalidad del mismo. Asimismo usted podrá
              hacer valer sus derechos de acceso, rectificación, cancelación u
              oposición (ARCO) ante la Unidad de Transparencia, ubicada en
              Calle M. Villa 115, Primer piso, Colonia Centro de esta Ciudad;
              con correo electrónico uiap@pachuca.gob.mx; y número telefónico
              (771) 6.88.11.61. Usted podrá consultar el Aviso de Privacidad
              Integral en la página del municipio www.pachuca.gob.mx, así como
              en la Unidad de Transparencia.
            </p>

            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={aceptaAvisoPrivacidad}
                onChange={(e) =>
                  setAceptaAvisoPrivacidad(e.target.checked)
                }
                disabled={solicitudExistente}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-vino-oscuro focus:ring-[#D4C29C]"
              />
              <span className="text-sm leading-6 text-gray-800">
                He leído y acepto el{" "}
                <strong className="font-semibold text-vino-oscuro">
                  Aviso de Privacidad
                </strong>
                .
              </span>
            </label>
          </div>
          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {/* ACCIONES */}
          <div className="mt-8 flex justify-end border-t border-dorado-claro pt-6">
            {!solicitudExistente && (
              <button
                type="submit"
                disabled={loading || !aceptaAvisoPrivacidad}
                className="rounded-lg bg-vino-oscuro px-6 py-3 font-medium text-white transition hover:bg-vino-claro disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Enviando..."
                  : "Enviar solicitud"}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}