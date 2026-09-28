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
    correo: "",
    tipoProceso: "",
    fechaInicio: "",
    horario: "",
    informacionAdicional: "",
  });

  const [fotografia, setFotografia] = useState<File | null>(null);
  const [fotografiaPreview, setFotografiaPreview] = useState("");
  const [fotografiaUrl, setFotografiaUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [solicitudExistente, setSolicitudExistente] = useState(false);
  const [cargandoSolicitud, setCargandoSolicitud] = useState(true);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

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
          correo: solicitud.correo ?? "",
          tipoProceso: solicitud.tipo_proceso ?? "",
          fechaInicio: solicitud.fecha_inicio ?? "",
          horario: solicitud.horario_propuesto ?? "",
          informacionAdicional: solicitud.informacion_adicional ?? "",
        });

        /*
         * La columna fotografia_url ahora puede contener:
         * 1. Una ruta interna:
         *    usuario-id/archivo.jpg
         *
         * 2. Una URL pública antigua:
         *    https://...supabase.co/storage/v1/object/public/fotos-alumnos/usuario-id/archivo.jpg
         *
         * Convertimos ambas posibilidades a una ruta de Storage
         * y generamos una URL firmada.
         */
        if (solicitud.fotografia_url) {
          let rutaFotografia = solicitud.fotografia_url;

          if (rutaFotografia.includes("/storage/v1/object/public/fotos-alumnos/")) {
            rutaFotografia = rutaFotografia.split(
              "/storage/v1/object/public/fotos-alumnos/"
            )[1];
          }

          if (rutaFotografia) {
            const { data: signedUrlData, error: signedUrlError } =
              await supabase.storage
                .from("fotos-alumnos")
                .createSignedUrl(rutaFotografia, 60 * 60);

            if (!signedUrlError && signedUrlData?.signedUrl) {
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
      setError("La fotografía debe ser un archivo de imagen.");
      e.target.value = "";
      setFotografia(null);
      setFotografiaPreview("");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("La fotografía no debe superar los 5 MB.");
      e.target.value = "";
      setFotografia(null);
      setFotografiaPreview("");
      return;
    }

    setError("");
    setFotografia(archivo);
    setFotografiaPreview(URL.createObjectURL(archivo));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    if (!fotografia) {
      setError(
        "Debes seleccionar una fotografía para enviar la solicitud."
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
        "No fue posible subir la fotografía. Inténtalo nuevamente."
      );

      setLoading(false);
      return;
    }

    /*
     * IMPORTANTE:
     * Como el bucket es privado, ya NO guardamos getPublicUrl().
     * Guardamos únicamente la ruta interna del archivo.
     */
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
        correo: formulario.correo,
        tipo_proceso: formulario.tipoProceso,
        fecha_inicio: formulario.fechaInicio,
        horario_propuesto: formulario.horario,
        informacion_adicional: formulario.informacionAdicional,
        fotografia_url: rutaFotografia,
      });

    if (insertError) {
      console.error(insertError);

      await supabase.storage
        .from("fotos-alumnos")
        .remove([rutaFotografia]);

      setError(
        "No fue posible enviar la solicitud. Inténtalo nuevamente."
      );

      setLoading(false);
      return;
    }

    /*
     * Generamos una URL firmada para mostrar inmediatamente
     * la fotografía al alumno.
     */
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
            Cargando tu solicitud...
          </p>
        </div>
      </main>
    );
  }

  if (solicitudEnviada) {
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

        {/* CONFIRMACIÓN */}
        <section className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="rounded-xl border border-dorado-claro bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4C29C]">
                <span className="text-3xl text-vino-oscuro">✓</span>
              </div>

              <h2 className="text-3xl font-bold text-vino-oscuro">
                ¡Solicitud recibida!
              </h2>

              <p className="mt-5 text-base leading-7 text-gris-oscuro">
                Tu solicitud ha sido registrada correctamente.
              </p>

              <p className="mt-3 text-base leading-7 text-gris-oscuro">
                El{" "}
                <strong className="text-vino-oscuro">
                  Departamento de Profesionalización
                </strong>{" "}
                atenderá tu solicitud en un plazo máximo de{" "}
                <strong className="text-vino-oscuro">
                  dos días hábiles
                </strong>
                .
              </p>

              <p className="mt-3 text-base leading-7 text-gris-oscuro">
                Te recomendamos estar pendiente de tu{" "}
                <strong className="text-vino-oscuro">
                  correo electrónico
                </strong>
                , ya que recibirás información relacionada con el seguimiento
                de tu solicitud.
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
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-vino-claro">
            Alumno / Prestador
          </p>

          <h2 className="mt-2 text-3xl font-bold text-vino-oscuro">
            Solicitud
          </h2>

          <p className="mt-2 text-gris-oscuro">
            Completa la información solicitada para iniciar tu proceso.
          </p>
        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-dorado-claro bg-white p-8 shadow-sm"
        >
          <div>
            <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

            <h3 className="text-lg font-semibold text-vino-oscuro">
              Datos del alumno
            </h3>

            <p className="mt-1 text-sm text-gris-oscuro">
              Proporciona tus datos personales y académicos.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              ["nombre", "Nombre completo", "text"],
              ["domicilio", "Domicilio", "text"],
              ["institucion", "Institución educativa", "text"],
              ["carrera", "Carrera", "text"],
              ["semestre", "Semestre / Cuatrimestre", "text"],
              ["matricula", "Matrícula / Número de control", "text"],
              ["telefono", "Teléfono celular", "tel"],
              ["correo", "Correo electrónico", "email"],
            ].map(([name, label, type]) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="mb-2 block text-sm font-medium text-vino-oscuro"
                >
                  {label}
                </label>

                <input
                  id={name}
                  name={name}
                  type={type}
                  value={formulario[name as keyof typeof formulario]}
                  onChange={handleChange}
                  required
                  disabled={solicitudExistente}
                  placeholder={
                    name === "semestre"
                      ? "Ej. 9° cuatrimestre"
                      : undefined
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            ))}

            {/* TIPO DE PROCESO */}
            <div>
              <label
                htmlFor="tipoProceso"
                className="mb-2 block text-sm font-medium text-vino-oscuro"
              >
                Tipo de proceso
              </label>

              <select
                id="tipoProceso"
                name="tipoProceso"
                value={formulario.tipoProceso}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50"
              >
                <option value="">Selecciona una opción</option>
                <option value="Servicio social">Servicio social</option>
                <option value="Prácticas profesionales">
                  Prácticas profesionales
                </option>
                <option value="Estadía">Estadía</option>
                <option value="Otro">Otro</option>
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
                required
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
                Horario propuesto
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
                <option value="">Selecciona un horario</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>
          </div>

          {/* FOTOGRAFÍA */}
          <div className="mt-6">
            <label
              htmlFor="fotografia"
              className="mb-2 block text-sm font-medium text-vino-oscuro"
            >
              Fotografía del alumno{" "}
              <span className="text-red-600">*</span>
            </label>

            <p className="mb-3 text-sm leading-6 text-gris-oscuro">
              Selecciona una fotografía reciente del alumno. La fotografía es
              obligatoria para enviar la solicitud.
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
              Formatos permitidos: JPG, JPEG o PNG. Tamaño máximo: 5 MB.
            </p>

            {(fotografiaPreview || fotografiaUrl) && (
              <div className="mt-5 flex justify-center">
                <div className="overflow-hidden rounded-lg border border-dorado-claro bg-gray-50 p-2">
                  <img
                    src={fotografiaPreview || fotografiaUrl}
                    alt="Vista previa de la fotografía del alumno"
                    className="h-48 w-40 object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* INFORMACIÓN ADICIONAL */}
          <div className="mt-6">
            <label
              htmlFor="informacionAdicional"
              className="mb-2 block text-sm font-medium text-vino-oscuro"
            >
              Información adicional
            </label>

            <p className="mb-3 text-sm leading-6 text-gris-oscuro">
              Puedes proporcionar información adicional que consideres
              relevante para tu proceso, como alguna condición que deba ser
              tomada en cuenta, necesidades educativas, situaciones particulares
              o disponibilidad para ajustar o adelantar tu fecha de inicio.
            </p>

            <textarea
              id="informacionAdicional"
              name="informacionAdicional"
              value={formulario.informacionAdicional}
              onChange={handleChange}
              disabled={solicitudExistente}
              rows={5}
              placeholder="Escribe aquí la información que consideres relevante para tu proceso."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>

          {/* AVISO DE PRIVACIDAD */}
          <div className="mt-8 rounded-lg border border-dorado-claro bg-gray-50 p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-vino-oscuro">
              Aviso de privacidad
            </h3>

            <p className="text-xs leading-5 text-gris-oscuro">
              De conformidad con lo dispuesto en el articulo 38 de la Ley de
              Protección de Datos Personales en Posesión de los Sujetos
              Obligados para el Estado de Hidalgo, el Departamento de
              Capacitación, dependiente de la Dirección de Recursos Humanos;
              será la responsable del uso, protección y tratamiento de sus
              datos personales, el uso de la información solicitada es para
              proveerle los servicios de localización del o la alumna, en caso
              de extravío, aclaraciones, omisiones o accidente. De requerirse
              hacer alguna transferencia de sus datos personales, para otro
              fin, se solicitará de su consentimiento y se le hará saber la
              finalidad del mismo, Asimismo usted podrá hacer valer sus
              derechos de acceso, rectificación, cancelación u oposición
              (ARCO) ante la Unidad de Transparencia, ubicada en Calle M. Vila
              115. Primer piso, Colonia Centro de esta Ciudad, con correo
              electrónico uiap@pachuca.gob.mx; y número telefónico (771)
              6.88.11.61 Usted podrá consultar el Aviso de Privacidad Integral
              en la página del municipio www.pachuca.gob.mx, así como en la
              Unidad de Transparencia.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ACCIONES */}
          <div className="mt-8 flex items-center justify-between border-t border-dorado-claro pt-6">
            <a
              href="/alumno"
              className="text-sm text-gris-oscuro transition hover:text-vino-oscuro"
            >
              ← Regresar al panel
            </a>

            {!solicitudExistente && (
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-vino-oscuro px-6 py-3 font-medium text-white transition hover:bg-vino-claro disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar solicitud"}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}