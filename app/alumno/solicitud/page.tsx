"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HeaderInstitucional from "@/components/HeaderInstitucional";
import BuscadorCarrera from "@/components/BuscadorCarrera";
import {
  aplicarDomicilioPostal,
  type DomicilioAutocompletado,
  type LugarPostal,
  type ResultadoCodigoPostal,
} from "@/lib/codigo-postal";
import {
  componerDomicilio,
  componerNombre,
  contactosEmergencia,
  estadoDomicilioRegistrado,
  leerRedApoyo,
  quitarApellidosDelNombre,
  separarNombreRegistrado,
  serializarContactosAdicionales,
  validarRedApoyo,
  type ContactoAdicional,
} from "@/lib/solicitud";

const claseCampo =
  "h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600";
export default function SolicitudPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formulario, setFormulario] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    domicilio: "",
    codigoPostal: "",
    estado: "",
    municipio: "",
    colonia: "",
    localidad: "",
    calle: "",
    numeroExterior: "",
    numeroInterior: "",
    institucion: "",
    institucionManual: "",
    carrera: "",
    tieneSeguroFacultativo: "",
    seguroInstitucion: "",
    seguroOtro: "",
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
    papaEmergencia: false,
    mamaEmergencia: false,
    tutorEmergencia: false,
    contactosAdicionales: [] as ContactoAdicional[],
  });
  const consultarCp = useRef(true);
  const ultimoDomicilio = useRef<DomicilioAutocompletado>({
    estado: "",
    municipio: "",
    localidad: "",
    colonia: "",
  });
  const [instituciones, setInstituciones] = useState<
    { id: number; nombre: string; nivel_educativo: string }[]
  >([]);
  const [institucionesCargando, setInstitucionesCargando] = useState(true);
  const [mostrarOtraInstitucion, setMostrarOtraInstitucion] = useState(false);
  const [institucionAbierta, setInstitucionAbierta] = useState(false);
  const [carreras, setCarreras] = useState<{ id: number; nombre: string; nivel_academico: string | null }[]>([]);
  const [carrerasCargando, setCarrerasCargando] = useState(true);
  const [carreraId, setCarreraId] = useState<number | null>(null);
  const [lugaresCp, setLugaresCp] = useState<LugarPostal[]>([]);
  const [nombreHistorico, setNombreHistorico] = useState("");
  const [capturaManualCp, setCapturaManualCp] = useState({
    municipio: false,
    localidad: false,
    colonia: false,
  });
  const [avisoCp, setAvisoCp] = useState("");
  const [consultandoCp, setConsultandoCp] = useState(false);
  const [fotografia, setFotografia] = useState<File | null>(null);
  const [fotografiaPreview, setFotografiaPreview] = useState("");
  const [fotografiaUrl, setFotografiaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [correoNoDisponible, setCorreoNoDisponible] = useState(false);
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
      const { data: dataCarreras, error: errorCarreras } = await supabase
        .from("carreras")
        .select("id, nombre, nivel_academico")
        .eq("activo", true)
        .order("nombre", { ascending: true });
      if (errorCarreras) {
        console.error("Error al cargar carreras:", errorCarreras);
        setCarreras([]);
      } else {
        setCarreras(dataCarreras ?? []);
      }
      setCarrerasCargando(false);
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
      const correoSesion = user.email?.trim() ?? "";
      const { data: solicitud } = await supabase
        .from("solicitudes")
        .select("*")
        .eq("usuario_id", user.id)
        .order("fecha_solicitud", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (solicitud) {
        consultarCp.current = false;
        const red = leerRedApoyo(solicitud);
        const nombreSeparado = separarNombreRegistrado(solicitud);
        setNombreHistorico(nombreSeparado.nombreHistorico);
        setSolicitudExistente(true);
        setFormulario({
          nombres: nombreSeparado.nombres,
          apellidoPaterno: nombreSeparado.apellidoPaterno,
          apellidoMaterno: nombreSeparado.apellidoMaterno,
          domicilio: solicitud.domicilio ?? "",
          codigoPostal: solicitud.codigo_postal ?? "",
          estado: estadoDomicilioRegistrado(solicitud),
          municipio: solicitud.municipio ?? "",
          colonia: solicitud.colonia ?? "",
          localidad: solicitud.localidad ?? "",
          calle: solicitud.calle ?? "",
          numeroExterior: solicitud.numero_exterior ?? "",
          numeroInterior: solicitud.numero_interior ?? "",
          institucion: solicitud.institucion_pendiente_revision
            ? ""
            : (solicitud.institucion_educativa ?? ""),
          institucionManual: solicitud.institucion_pendiente_revision
            ? (solicitud.institucion_educativa ?? "")
            : "",
          carrera: solicitud.carrera ?? "",
          tieneSeguroFacultativo:
            solicitud.tiene_seguro_facultativo === true
              ? "si"
              : solicitud.tiene_seguro_facultativo === false
                ? "no"
                : "",
          seguroInstitucion: solicitud.seguro_facultativo_institucion ?? "",
          seguroOtro: solicitud.seguro_facultativo_otro ?? "",
          semestre: solicitud.semestre_cuatrimestre ?? "",
          matricula: solicitud.matricula ?? "",
          telefono: solicitud.telefono ?? "",
          telefonoCasa: solicitud.telefono_casa ?? "",
          correo: solicitud.correo?.trim() || correoSesion,
          tipoProceso: solicitud.tipo_proceso ?? "",
          fechaInicio: solicitud.fecha_inicio ?? "",
          horario: solicitud.horario_propuesto ?? "",
          horasRequeridas:
            solicitud.horas_requeridas?.toString() ?? "",
          informacionAdicional:
            solicitud.informacion_adicional ?? "",
          nombrePapa: red.nombrePapa,
          telefonoPapa: red.telefonoPapa,
          nombreMama: red.nombreMama,
          telefonoMama: red.telefonoMama,
          nombreTutor: red.nombreTutor,
          telefonoTutor: red.telefonoTutor,
          papaEmergencia: red.papaEmergencia,
          mamaEmergencia: red.mamaEmergencia,
          tutorEmergencia: red.tutorEmergencia,
          contactosAdicionales: red.adicionales,
        });
        setCarreraId(typeof solicitud.carrera_id === "number" ? solicitud.carrera_id : null);
        setMostrarOtraInstitucion(Boolean(solicitud.institucion_pendiente_revision));
        setCorreoNoDisponible(!(solicitud.correo?.trim() || correoSesion));
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
      } else {
        setFormulario((actual) => ({ ...actual, correo: correoSesion }));
        setCorreoNoDisponible(!correoSesion);
      }
      setCargandoSolicitud(false);
    };
    obtenerSolicitud();
  }, [supabase]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "codigoPostal") {
      const digitos = value.replace(/\D/g, "").slice(0, 5);
      setLugaresCp([]);
      setCapturaManualCp({ municipio: false, localidad: false, colonia: false });
      setFormulario((actual) => {
        if (digitos === actual.codigoPostal) {
          return { ...actual, codigoPostal: digitos };
        }
        ultimoDomicilio.current = {
          estado: "",
          municipio: "",
          localidad: "",
          colonia: "",
        };
        return {
          ...actual,
          codigoPostal: digitos,
          estado: "",
          municipio: "",
          localidad: "",
          colonia: "",
        };
      });
      return;
    }
    if (name === "nombres" || name === "apellidoPaterno" || name === "apellidoMaterno") {
      setFormulario((actual) => {
        const siguiente = { ...actual, [name]: value };
        return {
          ...siguiente,
          nombres: quitarApellidosDelNombre(
            siguiente.nombres,
            siguiente.apellidoPaterno,
            siguiente.apellidoMaterno,
          ),
        };
      });
      return;
    }
    if (name === "tieneSeguroFacultativo" && value === "no") {
      setFormulario((actual) => ({
        ...actual,
        tieneSeguroFacultativo: "no",
        seguroInstitucion: "",
        seguroOtro: "",
      }));
      return;
    }
    const vinculoFamiliar: Record<
      string,
      { nombre: "nombrePapa" | "nombreMama" | "nombreTutor"; telefono: "telefonoPapa" | "telefonoMama" | "telefonoTutor"; marca: "papaEmergencia" | "mamaEmergencia" | "tutorEmergencia" }
    > = {
      nombrePapa: { nombre: "nombrePapa", telefono: "telefonoPapa", marca: "papaEmergencia" },
      telefonoPapa: { nombre: "nombrePapa", telefono: "telefonoPapa", marca: "papaEmergencia" },
      nombreMama: { nombre: "nombreMama", telefono: "telefonoMama", marca: "mamaEmergencia" },
      telefonoMama: { nombre: "nombreMama", telefono: "telefonoMama", marca: "mamaEmergencia" },
      nombreTutor: { nombre: "nombreTutor", telefono: "telefonoTutor", marca: "tutorEmergencia" },
      telefonoTutor: { nombre: "nombreTutor", telefono: "telefonoTutor", marca: "tutorEmergencia" },
    };
    const vinculo = vinculoFamiliar[name];
    if (vinculo) {
      setFormulario((actual) => {
        const siguiente = { ...actual, [name]: value };
        if (!siguiente[vinculo.nombre].trim() || !siguiente[vinculo.telefono].trim()) {
          siguiente[vinculo.marca] = false;
        }
        return siguiente;
      });
      return;
    }
    if (name === "seguroInstitucion" && value !== "Otro") {
      setFormulario((actual) => ({
        ...actual,
        seguroInstitucion: value,
        seguroOtro: "",
      }));
      return;
    }
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };
  useEffect(() => {
    if (!consultarCp.current) return;
    if (!/^\d{5}$/.test(formulario.codigoPostal)) {
      setLugaresCp([]);
      setConsultandoCp(false);
      return;
    }

    const cp = formulario.codigoPostal;
    const controlador = new AbortController();
    const temporizador = window.setTimeout(async () => {
      setConsultandoCp(true);
      try {
        const respuesta = await fetch(`/api/codigo-postal?cp=${cp}`, {
          signal: controlador.signal,
        });
        const datos = (await respuesta.json()) as ResultadoCodigoPostal;
        const lista = Array.isArray(datos.lugares) ? datos.lugares : [];
        setLugaresCp(lista);
        setAvisoCp(typeof datos.mensaje === "string" ? datos.mensaje : "");
        setFormulario((actual) => {
          if (actual.codigoPostal !== cp) return actual;
          const aplicado = aplicarDomicilioPostal(
            actual,
            { ...datos, lugares: lista },
            ultimoDomicilio.current,
          );
          ultimoDomicilio.current = aplicado.ultimo;
          return aplicado.domicilio;
        });
      } catch (errorConsulta) {
        if (errorConsulta instanceof Error && errorConsulta.name === "AbortError") return;
        setLugaresCp([]);
        setAvisoCp("No fue posible consultar el código postal. Capture el domicilio manualmente.");
      } finally {
        if (!controlador.signal.aborted) setConsultandoCp(false);
      }
    }, 500);
    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [formulario.codigoPostal]);
  const actualizarContacto = (
    id: string,
    cambios: Partial<ContactoAdicional>,
  ) => {
    setFormulario((actual) => ({
      ...actual,
      contactosAdicionales: actual.contactosAdicionales.map((contacto) => {
        if (contacto.id !== id) return contacto;
        const siguiente = { ...contacto, ...cambios };
        if (!siguiente.nombre.trim() || !siguiente.telefono.trim()) {
          siguiente.emergencia = false;
        }
        return siguiente;
      }),
    }));
  };
  const agregarContacto = () => {
    setFormulario((actual) => ({
      ...actual,
      contactosAdicionales: [
        ...actual.contactosAdicionales,
        {
          id: crypto.randomUUID(),
          nombre: "",
          parentesco: "",
          telefono: "",
          emergencia: false,
        },
      ],
    }));
  };
  const comoRed = (
    origen: typeof formulario,
  ) => ({
    ...origen,
    adicionales: origen.contactosAdicionales,
  });
  const quitarContacto = (id: string) => {
    setFormulario((actual) => ({
      ...actual,
      contactosAdicionales: actual.contactosAdicionales.filter(
        (contacto) => contacto.id !== id,
      ),
    }));
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
    if (!formulario.nombres.trim() || !formulario.apellidoPaterno.trim() || !formulario.apellidoMaterno.trim()) {
      setError("Capture el nombre y los dos apellidos.");
      setLoading(false);
      return;
    }
    if (!/^\d{5}$/.test(formulario.codigoPostal)) {
      setError("El código postal debe tener cinco dígitos.");
      setLoading(false);
      return;
    }
    if (!formulario.estado.trim() || !formulario.municipio.trim() || !formulario.colonia.trim() || !formulario.calle.trim() || !formulario.numeroExterior.trim()) {
      setError("Complete el domicilio: estado, municipio, colonia, calle y número exterior.");
      setLoading(false);
      return;
    }
    if (mostrarOtraInstitucion) {
      if (!formulario.institucionManual.trim()) {
        setError("Escriba el nombre completo de su institución educativa.");
        setLoading(false);
        return;
      }
    } else if (!instituciones.some((item) => item.nombre === formulario.institucion.trim())) {
      setError("Seleccione una institución del catálogo o indique que no la encuentra.");
      setLoading(false);
      return;
    }
    if (!carreraId) {
      setError("Seleccione una carrera del catálogo.");
      setLoading(false);
      return;
    }
    if (formulario.tieneSeguroFacultativo !== "si" && formulario.tieneSeguroFacultativo !== "no") {
      setError("Indique si cuenta con seguro facultativo.");
      setLoading(false);
      return;
    }
    if (formulario.tieneSeguroFacultativo === "si" && !formulario.seguroInstitucion) {
      setError("Seleccione la institución o servicio de su seguro facultativo.");
      setLoading(false);
      return;
    }
    if (formulario.tieneSeguroFacultativo === "si" && formulario.seguroInstitucion === "Otro" && !formulario.seguroOtro.trim()) {
      setError("Especifique la institución o servicio de su seguro facultativo.");
      setLoading(false);
      return;
    }
    const errorRed = validarRedApoyo(comoRed(formulario));
    if (errorRed) {
      setError(errorRed);
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
    if (!user.email?.trim()) {
      setCorreoNoDisponible(true);
      setError("No fue posible obtener el correo electrónico de su sesión.");
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
    const emergenciasGuardadas = contactosEmergencia(comoRed(formulario));
    const respuestaSolicitud = await fetch("/api/alumno/solicitud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: user.id,
        nombre: componerNombre(formulario.nombres, formulario.apellidoPaterno, formulario.apellidoMaterno),
        nombres: formulario.nombres.trim(),
        apellido_paterno: formulario.apellidoPaterno.trim(),
        apellido_materno: formulario.apellidoMaterno.trim(),
        domicilio: componerDomicilio({
          calle: formulario.calle,
          numeroExterior: formulario.numeroExterior,
          numeroInterior: formulario.numeroInterior,
          colonia: formulario.colonia,
          codigoPostal: formulario.codigoPostal,
          municipio: formulario.municipio,
          localidad: formulario.localidad,
          estado: formulario.estado,
        }),
        codigo_postal: formulario.codigoPostal,
        estado_domicilio: formulario.estado.trim(),
        municipio: formulario.municipio.trim(),
        localidad: formulario.localidad.trim() || null,
        colonia: formulario.colonia.trim(),
        calle: formulario.calle.trim(),
        numero_exterior: formulario.numeroExterior.trim(),
        numero_interior: formulario.numeroInterior.trim() || null,
        institucion_educativa: mostrarOtraInstitucion
          ? formulario.institucionManual.trim()
          : formulario.institucion.trim(),
        institucion_pendiente_revision: mostrarOtraInstitucion,
        carrera: formulario.carrera.trim(),
        carrera_id: carreraId,
        tiene_seguro_facultativo: formulario.tieneSeguroFacultativo === "si",
        seguro_facultativo_institucion:
          formulario.tieneSeguroFacultativo === "si"
            ? formulario.seguroInstitucion
            : null,
        seguro_facultativo_otro:
          formulario.tieneSeguroFacultativo === "si" &&
          formulario.seguroInstitucion === "Otro"
            ? formulario.seguroOtro.trim()
            : null,
        semestre_cuatrimestre: formulario.semestre,
        matricula: formulario.matricula,
        telefono: formulario.telefono,
        telefono_casa: formulario.telefonoCasa,
        tipo_proceso: formulario.tipoProceso,
        fecha_inicio: formulario.fechaInicio || null,
        horario_propuesto: formulario.horario,
        horas_requeridas: horas,
        informacion_adicional:
          formulario.informacionAdicional,
        nombre_papa: formulario.nombrePapa.trim(),
        telefono_papa: formulario.telefonoPapa.trim(),
        nombre_mama: formulario.nombreMama.trim(),
        telefono_mama: formulario.telefonoMama.trim(),
        nombre_tutor: formulario.nombreTutor.trim(),
        telefono_tutor: formulario.telefonoTutor.trim(),
        papa_contacto_emergencia: formulario.papaEmergencia,
        mama_contacto_emergencia: formulario.mamaEmergencia,
        tutor_contacto_emergencia: formulario.tutorEmergencia,
        contactos_adicionales: serializarContactosAdicionales(comoRed(formulario)),
        emergencia_1_nombre: emergenciasGuardadas[0]?.nombre ?? "",
        emergencia_1_parentesco: emergenciasGuardadas[0]?.parentesco ?? "",
        emergencia_1_telefono: emergenciasGuardadas[0]?.telefono ?? "",
        emergencia_2_nombre: emergenciasGuardadas[1]?.nombre ?? "",
        emergencia_2_parentesco: emergenciasGuardadas[1]?.parentesco ?? "",
        emergencia_2_telefono: emergenciasGuardadas[1]?.telefono ?? "",
        fotografia_url: rutaFotografia,
      }),
    });
    const resultadoSolicitud = await respuestaSolicitud.json().catch(() => null);
    if (!respuestaSolicitud.ok || respuestaSolicitud.redirected) {
      await supabase.storage
        .from("fotos-alumnos")
        .remove([rutaFotografia]);
      setError(
        resultadoSolicitud?.error ||
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
  const listaUnica = (valores: string[]) =>
    [...new Set(valores.map((valor) => valor.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es"),
    );
  const municipiosCp = listaUnica(lugaresCp.map((lugar) => lugar.municipio));
  const localidadesCp = listaUnica(
    lugaresCp
      .filter((lugar) => !formulario.municipio || lugar.municipio === formulario.municipio)
      .map((lugar) => lugar.localidad),
  );
  const coloniasCp = listaUnica(
    lugaresCp
      .filter(
        (lugar) =>
          (!formulario.municipio || lugar.municipio === formulario.municipio) &&
          (!formulario.localidad || lugar.localidad === formulario.localidad),
      )
      .map((lugar) => lugar.colonia),
  );
  const elegirLugar = (
    campo: "municipio" | "localidad" | "colonia",
    valor: string,
  ) => {
    if (valor === "__manual") {
      setCapturaManualCp((actual) => ({ ...actual, [campo]: true }));
      setFormulario((actual) => ({ ...actual, [campo]: "" }));
      ultimoDomicilio.current[campo] = "";
      return;
    }
    setFormulario((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === "municipio") {
        const sigueLocalidad = lugaresCp.some(
          (lugar) => lugar.municipio === valor && lugar.localidad === actual.localidad,
        );
        if (!sigueLocalidad) {
          siguiente.localidad = "";
          siguiente.colonia = "";
          ultimoDomicilio.current.localidad = "";
          ultimoDomicilio.current.colonia = "";
        }
      }
      if (campo === "localidad") {
        const sigueColonia = lugaresCp.some(
          (lugar) =>
            lugar.localidad === valor &&
            (!actual.municipio || lugar.municipio === actual.municipio) &&
            lugar.colonia === actual.colonia,
        );
        if (!sigueColonia) {
          siguiente.colonia = "";
          ultimoDomicilio.current.colonia = "";
        }
        const lugar = lugaresCp.find(
          (item) =>
            item.localidad === valor &&
            (!actual.municipio || item.municipio === actual.municipio),
        );
        if (lugar && !siguiente.colonia) {
          const colonias = listaUnica(
            lugaresCp
              .filter(
                (item) =>
                  item.localidad === valor &&
                  (!siguiente.municipio || item.municipio === siguiente.municipio),
              )
              .map((item) => item.colonia),
          );
          if (colonias.length === 1) {
            siguiente.colonia = colonias[0];
            ultimoDomicilio.current.colonia = colonias[0];
          }
        }
      }
      ultimoDomicilio.current[campo] = valor;
      return siguiente;
    });
  };
  if (cargandoSolicitud) {
    return (
      <main className="min-h-screen bg-gray-50">
      <HeaderInstitucional variante="logo" ancho="formulario" />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
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
      <HeaderInstitucional variante="logo" ancho="formulario" />
      <section className="mx-auto flex w-full max-w-5xl items-start justify-center px-4 py-6 sm:px-6">
          <div className="w-full max-w-2xl">
            <div className="rounded-xl border border-dorado-claro bg-white p-5 text-center shadow-sm sm:p-6">
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
             <div className="mt-4">
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
    <HeaderInstitucional variante="logo" ancho="formulario" />
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {/* REGRESAR */}
        <div className="mb-2">
          <a
            href="/alumno"
            className="inline-flex items-center text-sm text-gris-oscuro transition hover:text-vino-oscuro"
          >
            ← Regresar
          </a>
        </div>
        <div className="mb-3">
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
          className="flex w-full flex-col gap-y-4"
        >
          <section className="overflow-hidden rounded-xl border border-dorado-claro bg-white shadow-sm">
            <div className="border-b border-dorado-claro bg-[#faf7f2] px-4 py-3 sm:px-5">
              <h3 className="text-lg font-semibold text-vino-oscuro">
                Datos del estudiante
              </h3>
              <p className="mt-1 text-sm leading-5 text-gris-oscuro">
                Proporcione sus datos personales y académicos.
              </p>
            </div>
            <div className="grid grid-cols-1 items-start justify-items-stretch gap-x-4 gap-y-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-6">
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="nombres" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Nombre(s) <span className="text-red-600">*</span>
                </label>
                <input id="nombres" name="nombres" type="text" value={formulario.nombres} onChange={handleChange} required={!nombreHistorico} disabled={solicitudExistente} autoComplete="given-name" placeholder="Ej. nombre" className={claseCampo} />
                <p className="mt-1 text-xs leading-4 text-gray-500">
                  Solo el nombre, sin apellidos.
                </p>
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="apellidoPaterno" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Apellido paterno <span className="text-red-600">*</span>
                </label>
                <input id="apellidoPaterno" name="apellidoPaterno" type="text" value={formulario.apellidoPaterno} onChange={handleChange} required={!nombreHistorico} disabled={solicitudExistente} autoComplete="off" placeholder="Ej. apellido paterno" className={claseCampo} />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="apellidoMaterno" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Apellido materno <span className="text-red-600">*</span>
                </label>
                <input id="apellidoMaterno" name="apellidoMaterno" type="text" value={formulario.apellidoMaterno} onChange={handleChange} required={!nombreHistorico} disabled={solicitudExistente} autoComplete="off" placeholder="Ej. apellido materno" className={claseCampo} />
              </div>
              {nombreHistorico && (
                <div className="min-w-0 md:col-span-2 xl:col-span-6">
                  <p className="text-sm leading-5 text-gris-oscuro">
                    Nombre registrado: {nombreHistorico}
                  </p>
                </div>
              )}
              {solicitudExistente && formulario.domicilio && !formulario.codigoPostal && (
                <div className="min-w-0 md:col-span-2 xl:col-span-6">
                  <p className="text-sm leading-5 text-gris-oscuro">
                    Domicilio registrado: {formulario.domicilio}
                  </p>
                </div>
              )}
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="codigoPostal" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Código postal <span className="text-red-600">*</span>
                </label>
                <input id="codigoPostal" name="codigoPostal" type="text" inputMode="numeric" maxLength={5} pattern="\d{5}" value={formulario.codigoPostal} onChange={handleChange} required disabled={solicitudExistente} autoComplete="postal-code" placeholder="Ej. 00000" aria-busy={consultandoCp} className={claseCampo} />
                <p className="mt-1 flex items-center gap-2 text-xs leading-4 text-gray-500" aria-live="polite">
                  {consultandoCp && (
                    <span className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-vino-oscuro border-t-transparent" />
                  )}
                  {consultandoCp ? "Consultando código postal..." : avisoCp || "Cinco dígitos. Si la consulta no responde, capture el domicilio manualmente."}
                </p>
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="estado" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Estado <span className="text-red-600">*</span>
                </label>
                <input id="estado" name="estado" type="text" value={formulario.estado} onChange={handleChange} required disabled={solicitudExistente} autoComplete="address-level1" placeholder="Ej. estado" className={claseCampo} />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="municipio" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Municipio <span className="text-red-600">*</span>
                </label>
                {municipiosCp.length > 1 && !capturaManualCp.municipio ? (
                  <select id="municipio" name="municipio" value={formulario.municipio} onChange={(evento) => elegirLugar("municipio", evento.target.value)} required disabled={solicitudExistente} className={claseCampo}>
                    <option value="">Seleccione el municipio</option>
                    {municipiosCp.map((municipio) => (
                      <option key={municipio} value={municipio}>{municipio}</option>
                    ))}
                    <option value="__manual">Capturar manualmente</option>
                  </select>
                ) : (
                  <input id="municipio" name="municipio" type="text" value={formulario.municipio} onChange={handleChange} required disabled={solicitudExistente} autoComplete="address-level2" placeholder="Ej. municipio" className={claseCampo} />
                )}
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="localidad" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Localidad
                </label>
                {localidadesCp.length > 1 && !capturaManualCp.localidad ? (
                  <select id="localidad" name="localidad" value={formulario.localidad} onChange={(evento) => elegirLugar("localidad", evento.target.value)} disabled={solicitudExistente} className={claseCampo}>
                    <option value="">Seleccione la localidad</option>
                    {localidadesCp.map((localidad) => (
                      <option key={localidad} value={localidad}>{localidad}</option>
                    ))}
                    <option value="__manual">Capturar manualmente</option>
                  </select>
                ) : (
                  <input id="localidad" name="localidad" type="text" value={formulario.localidad} onChange={handleChange} disabled={solicitudExistente} autoComplete="off" placeholder="Ej. localidad" className={claseCampo} />
                )}
                <p className="mt-1 text-xs leading-4 text-gray-500">
                  La localidad es independiente del municipio.
                </p>
              </div>
              <div className="flex min-w-0 flex-col md:col-span-2 xl:col-span-6">
                <label htmlFor="colonia" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Colonia <span className="text-red-600">*</span>
                </label>
                {coloniasCp.length > 0 && !capturaManualCp.colonia ? (
                  <select id="colonia" name="colonia" value={formulario.colonia} onChange={(evento) => elegirLugar("colonia", evento.target.value)} required disabled={solicitudExistente} className={claseCampo}>
                    <option value="">Seleccione su colonia</option>
                    {coloniasCp.map((colonia) => (
                      <option key={colonia} value={colonia}>{colonia}</option>
                    ))}
                    <option value="__manual">Capturar manualmente</option>
                  </select>
                ) : (
                  <input id="colonia" name="colonia" type="text" value={formulario.colonia} onChange={handleChange} required disabled={solicitudExistente} placeholder="Escriba su colonia" className={claseCampo} />
                )}
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="calle" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Calle <span className="text-red-600">*</span>
                </label>
                <input id="calle" name="calle" type="text" value={formulario.calle} onChange={handleChange} required disabled={solicitudExistente} autoComplete="address-line1" placeholder="Ej. calle" className={claseCampo} />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="numeroExterior" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Número exterior <span className="text-red-600">*</span>
                </label>
                <input id="numeroExterior" name="numeroExterior" type="text" value={formulario.numeroExterior} onChange={handleChange} required disabled={solicitudExistente} placeholder="Ej. 25" className={claseCampo} />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="numeroInterior" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Número interior
                </label>
                <input id="numeroInterior" name="numeroInterior" type="text" value={formulario.numeroInterior} onChange={handleChange} disabled={solicitudExistente} placeholder="Opcional" className={claseCampo} />
              </div>
              <div className="min-w-0 border-t border-dorado-claro pt-4 md:col-span-2 xl:col-span-6">
                <h4 className="text-base font-semibold text-vino-oscuro">Datos académicos</h4>
                <p className="mt-1 text-sm leading-5 text-gris-oscuro">
                  Institución, carrera y seguro facultativo.
                </p>
              </div>
              <div className="flex min-w-0 flex-col md:col-span-2 xl:col-span-6">
                <label htmlFor="institucion" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Institución educativa {!mostrarOtraInstitucion && <span className="text-red-600">*</span>}
                </label>
                {!mostrarOtraInstitucion && (
                  <div className="relative">
                    <input
                      id="institucion"
                      name="institucion"
                      type="text"
                      value={formulario.institucion}
                      role="combobox"
                      aria-expanded={institucionAbierta}
                      autoComplete="off"
                      onChange={(e) => {
                        setInstitucionAbierta(true);
                        setFormulario({ ...formulario, institucion: e.target.value, institucionManual: "" });
                      }}
                      onFocus={() => setInstitucionAbierta(true)}
                      onBlur={() => window.setTimeout(() => setInstitucionAbierta(false), 150)}
                      required
                      disabled={solicitudExistente || institucionesCargando}
                      placeholder={institucionesCargando ? "Cargando instituciones..." : "Escriba para buscar en el catálogo"}
                      className={claseCampo}
                    />
                    {institucionAbierta && !solicitudExistente && formulario.institucion.trim() && (
                      <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-dorado-claro bg-white py-1 shadow-lg">
                        {instituciones.filter((item) => item.nombre.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(formulario.institucion.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, ""))).slice(0, 8).length === 0 ? (
                          <li className="px-3 py-2 text-sm text-gris-oscuro">No hay coincidencias en el catálogo.</li>
                        ) : (
                          instituciones
                            .filter((item) => item.nombre.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(formulario.institucion.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
                            .slice(0, 8)
                            .map((institucion) => (
                              <li key={institucion.id}>
                                <button
                                  type="button"
                                  onMouseDown={(evento) => evento.preventDefault()}
                                  onClick={() => {
                                    setFormulario({ ...formulario, institucion: institucion.nombre, institucionManual: "" });
                                    setInstitucionAbierta(false);
                                  }}
                                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-[#faf7f2]"
                                >
                                  <span className="text-sm text-gray-900">{institucion.nombre}</span>
                                  <span className="text-xs text-gris-oscuro">{institucion.nivel_educativo}</span>
                                </button>
                              </li>
                            ))
                        )}
                      </ul>
                    )}
                    <p className="mt-1 text-xs leading-4 text-gray-500">
                      Escriba para ver coincidencias del catálogo.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const activarManual = !mostrarOtraInstitucion;
                    setMostrarOtraInstitucion(activarManual);
                    setInstitucionAbierta(false);
                    setFormulario((actual) => ({
                      ...actual,
                      institucion: activarManual ? "" : actual.institucion,
                      institucionManual: activarManual ? actual.institucionManual : "",
                    }));
                  }}
                  disabled={solicitudExistente}
                  className="mt-2 self-start text-sm font-medium text-vino-oscuro underline underline-offset-2 transition hover:text-vino-claro disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {mostrarOtraInstitucion ? "Buscar en el catálogo" : "No encuentro mi institución"}
                </button>
                {mostrarOtraInstitucion && (
                  <div className="mt-3 flex flex-col rounded-lg border border-dorado-claro bg-[#faf7f2] p-3">
                    <label htmlFor="institucionManual" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                      Nombre de la institución que no está en el catálogo <span className="text-red-600">*</span>
                    </label>
                    <input id="institucionManual" name="institucionManual" type="text" value={formulario.institucionManual} onChange={handleChange} required disabled={solicitudExistente} placeholder="Escriba el nombre completo" className={claseCampo} />
                    <p className="mt-1 text-xs leading-4 text-gray-500">
                      Quedará pendiente de revisión y no se agregará al catálogo.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label htmlFor="carrera" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                  Carrera <span className="text-red-600">*</span>
                </label>
                <BuscadorCarrera
                  carreras={carreras}
                  valor={formulario.carrera}
                  seleccionadaId={carreraId}
                  disabled={solicitudExistente}
                  cargando={carrerasCargando}
                  onCambio={(texto, carrera) => {
                    setCarreraId(carrera?.id ?? null);
                    setFormulario({ ...formulario, carrera: carrera?.nombre ?? texto });
                  }}
                />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="semestre"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
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
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50"
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
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="matricula"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
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
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <fieldset className="min-w-0 md:col-span-2 xl:col-span-6">
                <legend className="mb-2 text-sm font-medium leading-5 text-vino-oscuro">
                  ¿Cuentas con seguro facultativo? <span className="text-red-600">*</span>
                </legend>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-900">
                    <input type="radio" name="tieneSeguroFacultativo" value="si" checked={formulario.tieneSeguroFacultativo === "si"} onChange={handleChange} required disabled={solicitudExistente} className="h-4 w-4 border-gray-300 text-vino-oscuro focus:ring-[#D4C29C]" />
                    Sí
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-900">
                    <input type="radio" name="tieneSeguroFacultativo" value="no" checked={formulario.tieneSeguroFacultativo === "no"} onChange={handleChange} required disabled={solicitudExistente} className="h-4 w-4 border-gray-300 text-vino-oscuro focus:ring-[#D4C29C]" />
                    No
                  </label>
                </div>
              </fieldset>
              {formulario.tieneSeguroFacultativo === "si" && (
                <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                  <label htmlFor="seguroInstitucion" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                    Institución <span className="text-red-600">*</span>
                  </label>
                  <select id="seguroInstitucion" name="seguroInstitucion" value={formulario.seguroInstitucion} onChange={handleChange} required disabled={solicitudExistente} className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50">
                    <option value="">Seleccione una opción</option>
                    <option value="IMSS">IMSS</option>
                    <option value="ISSSTE">ISSSTE</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              )}
              {formulario.tieneSeguroFacultativo === "si" && formulario.seguroInstitucion === "Otro" && (
                <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                  <label htmlFor="seguroOtro" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                    Especifique la institución <span className="text-red-600">*</span>
                  </label>
                  <input id="seguroOtro" name="seguroOtro" type="text" value={formulario.seguroOtro} onChange={handleChange} required disabled={solicitudExistente} placeholder="Nombre de la institución" className={claseCampo} />
                </div>
              )}
              <div className="min-w-0 border-t border-dorado-claro pt-4 md:col-span-2 xl:col-span-6">
                <h4 className="text-base font-semibold text-vino-oscuro">Datos de contacto</h4>
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="telefono"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
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
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="telefonoCasa"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
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
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="correo"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
                >
                  Correo electrónico{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  value={formulario.correo}
                  readOnly
                  aria-readonly="true"
                  required
                  disabled={solicitudExistente}
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
                {correoNoDisponible && (
                  <p className="mt-1 text-xs leading-4 text-red-700">
                    No fue posible obtener el correo electrónico de su sesión.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-dorado-claro bg-white shadow-sm">
            <div className="border-b border-dorado-claro bg-[#faf7f2] px-4 py-3 sm:px-5">
              <h3 className="text-lg font-semibold text-vino-oscuro">
                Datos del proceso
              </h3>
              <p className="mt-1 text-sm leading-5 text-gris-oscuro">
                Indique la información relacionada con el servicio
                social, prácticas profesionales o estadía.
              </p>
            </div>
            <div className="grid grid-cols-1 items-start justify-items-stretch gap-x-4 gap-y-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-6">
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="tipoProceso"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
                >
                  Tipo de proceso{" "}
                  <span className="text-red-600">*</span>
                </label>
                <select
                  id="tipoProceso"
                  name="tipoProceso"
                  value={formulario.tipoProceso}
                  onChange={handleChange}
                  required
                  disabled={solicitudExistente}
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50"
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
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="fechaInicio"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
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
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50"
                />
              </div>
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="horario"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
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
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
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
              <div className="flex min-w-0 flex-col md:col-span-1 xl:col-span-2">
                <label
                  htmlFor="horasRequeridas"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
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
                  className="h-10 w-full max-w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
                <p className="mt-1 text-xs leading-4 text-gray-500">
                  Indique el total de horas que debe realizar de
                  acuerdo con los requisitos de su institución educativa.
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-dorado-claro bg-white shadow-sm">
            <div className="border-b border-dorado-claro bg-[#faf7f2] px-4 py-3 sm:px-5">
              <h3 className="text-lg font-semibold text-vino-oscuro">
                Fotografía
              </h3>
              <p className="mt-1 text-sm leading-5 text-gris-oscuro">
                Adjunte una fotografía que será utilizada para la
                identificación del estudiante.
              </p>
            </div>
            <div className="grid grid-cols-1 items-start justify-items-stretch gap-x-4 gap-y-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-6">
              <div className="flex min-w-0 flex-col md:col-span-2 xl:col-span-6">
                <label
                  htmlFor="fotografia"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
                >
                  Fotografía del estudiante{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="fotografia"
                  name="fotografia"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFotografiaChange}
                  required={!solicitudExistente}
                  disabled={solicitudExistente}
                  className="w-full max-w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-vino-oscuro file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-vino-claro disabled:cursor-not-allowed disabled:bg-gray-50"
                />
                <p className="mt-1 text-sm leading-5 text-gris-oscuro">
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
                <p className="mt-1 text-xs leading-4 text-gray-500">
                  Formatos permitidos: JPG, JPEG o PNG. Tamaño máximo:
                  5 MB.
                </p>
                {(fotografiaPreview || fotografiaUrl) && (
                  <div className="mt-2">
                    <div className="inline-block overflow-hidden rounded-lg border border-dorado-claro bg-gray-50 p-2">
                      <img
                        src={fotografiaPreview || fotografiaUrl}
                        alt="Vista previa de la fotografía del estudiante"
                        className="h-48 w-40 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="w-full min-w-0 overflow-hidden rounded-xl border border-dorado-claro bg-white shadow-sm">
            <div className="border-b border-dorado-claro bg-[#faf7f2] px-4 py-3 sm:px-5">
              <h3 className="text-lg font-semibold text-vino-oscuro">
                Red de apoyo y contactos de emergencia
              </h3>
              <p className="mt-1 text-sm leading-5 text-gris-oscuro">
                Papá, mamá y tutor son opcionales. Márquelos como contacto de emergencia solo si capturó su nombre y teléfono. Puede agregar otras personas. Se requieren al menos dos contactos de emergencia.
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-6 p-4 sm:p-5">
              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
              {(
                [
                  ["Papá (opcional)", "nombrePapa", "telefonoPapa", "papaEmergencia", "¿Puede ser contactado en caso de emergencia?", "Nombre del papá", "Teléfono del papá"],
                  ["Mamá (opcional)", "nombreMama", "telefonoMama", "mamaEmergencia", "¿Puede ser contactada en caso de emergencia?", "Nombre de la mamá", "Teléfono de la mamá"],
                ] as const
              ).map(([titulo, campoNombre, campoTelefono, campoEmergencia, pregunta, etiquetaNombre, etiquetaTelefono]) => {
                const puedeMarcarEmergencia = Boolean(
                  formulario[campoNombre].trim() && formulario[campoTelefono].trim(),
                );
                return (
                <div key={titulo} className="flex h-full min-w-0 w-full flex-col rounded-lg border border-dorado-claro bg-white p-4">
                  <h4 className="text-sm font-semibold leading-5 text-vino-oscuro">{titulo}</h4>
                  <div className="mt-4 grid w-full min-w-0 grid-cols-1 gap-4">
                    <div className="flex min-w-0 flex-col">
                      <label htmlFor={campoNombre} className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                        {etiquetaNombre}
                      </label>
                      <input id={campoNombre} name={campoNombre} type="text" value={formulario[campoNombre]} onChange={handleChange} disabled={solicitudExistente} placeholder="Ej. nombre completo" className={claseCampo} />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <label htmlFor={campoTelefono} className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                        {etiquetaTelefono}
                      </label>
                      <input id={campoTelefono} name={campoTelefono} type="tel" value={formulario[campoTelefono]} onChange={handleChange} disabled={solicitudExistente} placeholder="Teléfono" className={claseCampo} />
                    </div>
                  </div>
                  <div className="mt-auto border-t border-dorado-claro pt-3">
                    <label className="flex items-start gap-2.5 text-sm leading-5 text-gray-900">
                      <input type="checkbox" checked={formulario[campoEmergencia]} onChange={(e) => setFormulario((actual) => ({ ...actual, [campoEmergencia]: e.target.checked }))} disabled={solicitudExistente || !puedeMarcarEmergencia} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-vino-oscuro focus:ring-[#D4C29C]" />
                      <span className="min-w-0 flex-1">{pregunta}</span>
                    </label>
                    <div className="mt-1 min-h-8 text-xs leading-4 text-gray-500">
                      {!solicitudExistente && !puedeMarcarEmergencia && (
                        <p>
                          Capture nombre y teléfono para poder marcarlo como contacto de emergencia.
                        </p>
                      )}
                      {formulario[campoEmergencia] && (
                        <p>
                          Se usarán el nombre y el teléfono capturados arriba.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
              <div className="flex h-full min-w-0 w-full flex-col rounded-lg border border-dorado-claro bg-white p-4">
                <h4 className="text-sm font-semibold leading-5 text-vino-oscuro">Tutor (opcional)</h4>
                <div className="mt-4 grid w-full min-w-0 grid-cols-1 gap-4">
                  <div className="flex min-w-0 flex-col">
                    <label htmlFor="nombreTutor" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                      Nombre del tutor (opcional)
                    </label>
                    <input id="nombreTutor" name="nombreTutor" type="text" value={formulario.nombreTutor} onChange={handleChange} disabled={solicitudExistente} placeholder="Ej. nombre completo" className={claseCampo} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <label htmlFor="telefonoTutor" className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                      Teléfono del tutor (opcional)
                    </label>
                    <input id="telefonoTutor" name="telefonoTutor" type="tel" value={formulario.telefonoTutor} onChange={handleChange} disabled={solicitudExistente} placeholder="Teléfono" className={claseCampo} />
                  </div>
                </div>
                <div className="mt-auto border-t border-dorado-claro pt-3">
                  <label className="flex items-start gap-2.5 text-sm leading-5 text-gray-900">
                    <input type="checkbox" checked={formulario.tutorEmergencia} onChange={(e) => setFormulario((actual) => ({ ...actual, tutorEmergencia: e.target.checked }))} disabled={solicitudExistente || !formulario.nombreTutor.trim() || !formulario.telefonoTutor.trim()} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-vino-oscuro focus:ring-[#D4C29C]" />
                    <span className="min-w-0 flex-1">¿Puede ser contactado en caso de emergencia?</span>
                  </label>
                  <div className="mt-1 min-h-8 text-xs leading-4 text-gray-500">
                    {!solicitudExistente && (!formulario.nombreTutor.trim() || !formulario.telefonoTutor.trim()) && (
                      <p>
                        Capture nombre y teléfono para poder marcarlo como contacto de emergencia.
                      </p>
                    )}
                    {formulario.tutorEmergencia && (
                      <p>
                        Se usarán el nombre y el teléfono capturados arriba.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              </div>
              <div className="w-full min-w-0 rounded-lg border border-dorado-claro bg-[#faf7f2] p-4 sm:p-5">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-vino-oscuro">Contactos adicionales</h4>
                    <p className="mt-1 text-xs leading-4 text-gray-500">
                      Puede agregar personas que no sean familiares y elegir cuáles son contacto de emergencia.
                    </p>
                  </div>
                  {!solicitudExistente && (
                    <button type="button" onClick={agregarContacto} className="shrink-0 self-start rounded-lg border border-vino-oscuro bg-white px-3 py-2 text-sm font-medium text-vino-oscuro transition hover:bg-[#faf7f2] sm:self-center">
                      Agregar persona
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs leading-4 text-gray-500">
                  Contactos de emergencia seleccionados: {contactosEmergencia(comoRed(formulario)).filter((contacto) => contacto.nombre && contacto.telefono).length}. Se requieren al menos dos.
                </p>
                <div className="mt-4 flex w-full flex-col gap-3">
                  {formulario.contactosAdicionales.map((contacto, indice) => (
                    <div key={contacto.id} className="grid w-full min-w-0 grid-cols-1 items-start gap-4 rounded-lg border border-dorado-claro bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex min-w-0 flex-col">
                        <label htmlFor={`adicional-nombre-${contacto.id}`} className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                          Nombre completo
                        </label>
                        <input id={`adicional-nombre-${contacto.id}`} type="text" value={contacto.nombre} onChange={(e) => actualizarContacto(contacto.id, { nombre: e.target.value })} disabled={solicitudExistente} placeholder={`Persona ${indice + 1}`} className={claseCampo} />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <label htmlFor={`adicional-parentesco-${contacto.id}`} className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                          Parentesco
                        </label>
                        <input id={`adicional-parentesco-${contacto.id}`} type="text" value={contacto.parentesco} onChange={(e) => actualizarContacto(contacto.id, { parentesco: e.target.value })} disabled={solicitudExistente} placeholder="Ej. Tío, amigo" className={claseCampo} />
                      </div>
                      <div className="flex min-w-0 flex-col sm:col-span-2 lg:col-span-1">
                        <label htmlFor={`adicional-telefono-${contacto.id}`} className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro">
                          Teléfono
                        </label>
                        <input id={`adicional-telefono-${contacto.id}`} type="tel" value={contacto.telefono} onChange={(e) => actualizarContacto(contacto.id, { telefono: e.target.value })} disabled={solicitudExistente} placeholder="Teléfono" className={claseCampo} />
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-dorado-claro pt-3 sm:col-span-2 lg:col-span-3">
                        <label className="flex min-w-0 items-start gap-2.5 text-sm leading-5 text-gray-900">
                          <input type="checkbox" checked={contacto.emergencia} onChange={(e) => actualizarContacto(contacto.id, { emergencia: e.target.checked })} disabled={solicitudExistente || !contacto.nombre.trim() || !contacto.telefono.trim()} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-vino-oscuro focus:ring-[#D4C29C]" />
                          <span className="min-w-0">Emergencia</span>
                        </label>
                        {!solicitudExistente && (
                          <button type="button" onClick={() => quitarContacto(contacto.id)} className="shrink-0 text-sm font-medium text-red-700 underline underline-offset-2">
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {formulario.contactosAdicionales.length === 0 && (
                    <p className="text-sm text-gris-oscuro">
                      No hay contactos adicionales.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-dorado-claro bg-white shadow-sm">
            <div className="border-b border-dorado-claro bg-[#faf7f2] px-4 py-3 sm:px-5">
              <h3 className="text-lg font-semibold text-vino-oscuro">
                Información adicional
              </h3>
            </div>
            <div className="grid grid-cols-1 items-start justify-items-stretch gap-x-4 gap-y-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-6">
              <div className="flex min-w-0 flex-col md:col-span-2 xl:col-span-6">
                <label
                  htmlFor="informacionAdicional"
                  className="mb-1 block text-sm font-medium leading-5 text-vino-oscuro"
                >
                  Información adicional
                </label>
                <textarea
                  id="informacionAdicional"
                  name="informacionAdicional"
                  value={formulario.informacionAdicional}
                  onChange={handleChange}
                  disabled={solicitudExistente}
                  rows={5}
                  placeholder="Escriba aquí la información que considere relevante para su proceso."
                  className="w-full max-w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-vino-claro focus:ring-2 focus:ring-[#D4C29C] disabled:bg-gray-50 disabled:text-gray-600"
                />
                <p className="mt-1 text-sm leading-5 text-gris-oscuro">
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
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-dorado-claro bg-[#faf7f2] p-4 shadow-sm sm:p-5">
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
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={aceptaAvisoPrivacidad}
                onChange={(e) =>
                  setAceptaAvisoPrivacidad(e.target.checked)
                }
                disabled={solicitudExistente}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-vino-oscuro focus:ring-[#D4C29C]"
              />
              <span className="text-sm leading-6 text-gray-800">
                He leído y acepto el{" "}
                <strong className="font-semibold text-vino-oscuro">
                  Aviso de Privacidad
                </strong>
                .
              </span>
            </label>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!solicitudExistente && (
            <div className="flex justify-end rounded-xl border border-dorado-claro bg-white px-4 py-3 shadow-sm sm:px-5">
              <button
                type="submit"
                disabled={loading || !aceptaAvisoPrivacidad}
                className="rounded-lg bg-vino-oscuro px-6 py-3 font-medium text-white transition hover:bg-vino-claro disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          )}
        </form>

      </section>
    </main>
  );
}