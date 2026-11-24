export type DomicilioSolicitud = {
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  codigoPostal: string;
  municipio: string;
  localidad?: string;
  estado: string;
};

export type ContactoAdicional = {
  id: string;
  nombre: string;
  parentesco: string;
  telefono: string;
  emergencia: boolean;
};

export type RedApoyo = {
  nombrePapa: string;
  telefonoPapa: string;
  papaEmergencia: boolean;
  nombreMama: string;
  telefonoMama: string;
  mamaEmergencia: boolean;
  nombreTutor: string;
  telefonoTutor: string;
  tutorEmergencia: boolean;
  adicionales: ContactoAdicional[];
};

export type ContactoEmergencia = {
  nombre: string;
  parentesco: string;
  telefono: string;
};

const ESTATUS_SOLICITUD = new Set([
  "Pendiente",
  "Aceptada",
  "Asignada",
  "Rechazada",
]);

type SolicitudDomicilio = {
  estado_domicilio?: string | null;
  estado?: string | null;
  codigo_postal?: string | null;
};

type SolicitudRed = {
  nombre_papa?: string | null;
  telefono_papa?: string | null;
  nombre_mama?: string | null;
  telefono_mama?: string | null;
  nombre_tutor?: string | null;
  telefono_tutor?: string | null;
  emergencia_1_nombre?: string | null;
  emergencia_1_parentesco?: string | null;
  emergencia_1_telefono?: string | null;
  emergencia_2_nombre?: string | null;
  emergencia_2_parentesco?: string | null;
  emergencia_2_telefono?: string | null;
  papa_contacto_emergencia?: boolean | null;
  mama_contacto_emergencia?: boolean | null;
  tutor_contacto_emergencia?: boolean | null;
  contactos_adicionales?: unknown;
};

function normalizarNombre(valor: string) {
  return valor
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function quitarApellidosDelNombre(
  nombres: string,
  apellidoPaterno: string,
  apellidoMaterno: string,
) {
  const actual = nombres.trim();
  const cola = [apellidoPaterno, apellidoMaterno]
    .map((parte) => parte.trim())
    .filter(Boolean)
    .join(" ");
  if (!actual || !cola) return actual;

  const completo = normalizarNombre(actual);
  const sufijo = normalizarNombre(cola);
  if (!completo.endsWith(` ${sufijo}`)) return actual;

  return actual.slice(0, actual.length - cola.length).trim();
}

export function separarNombreRegistrado(solicitud: {
  nombre?: string | null;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
}) {
  const apellidoPaterno = solicitud.apellido_paterno?.trim() ?? "";
  const apellidoMaterno = solicitud.apellido_materno?.trim() ?? "";
  const nombres = quitarApellidosDelNombre(
    solicitud.nombres?.trim() ?? "",
    apellidoPaterno,
    apellidoMaterno,
  );

  if (nombres || apellidoPaterno || apellidoMaterno) {
    return {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      nombreHistorico: "",
    };
  }

  return {
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombreHistorico: solicitud.nombre?.trim() ?? "",
  };
}

export function componerNombre(
  nombres: string,
  apellidoPaterno: string,
  apellidoMaterno: string,
) {
  return [nombres, apellidoPaterno, apellidoMaterno]
    .map((parte) => parte.trim())
    .filter(Boolean)
    .join(" ");
}

export function componerDomicilio(domicilio: DomicilioSolicitud) {
  const interior = domicilio.numeroInterior.trim()
    ? ` Int. ${domicilio.numeroInterior.trim()}`
    : "";

  return [
    `Calle ${domicilio.calle.trim()} No. ${domicilio.numeroExterior.trim()}${interior}`,
    `Col. ${domicilio.colonia.trim()}`,
    `C.P. ${domicilio.codigoPostal.trim()}`,
    domicilio.localidad?.trim() &&
    domicilio.localidad.trim() !== domicilio.municipio.trim()
      ? domicilio.localidad.trim()
      : "",
    domicilio.municipio.trim(),
    domicilio.estado.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

export function estadoDomicilioRegistrado(solicitud: SolicitudDomicilio) {
  const domicilio = solicitud.estado_domicilio?.trim() ?? "";
  if (domicilio) return domicilio;

  const estatus = solicitud.estado?.trim() ?? "";
  if (
    solicitud.codigo_postal?.trim() &&
    estatus &&
    !ESTATUS_SOLICITUD.has(estatus)
  ) {
    return estatus;
  }

  return "";
}

function texto(valor: string | null | undefined) {
  return valor?.trim() ?? "";
}

function normalizarPersona(valor: string) {
  return valor
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function mismaPersona(
  nombreA: string,
  telefonoA: string,
  nombreB: string,
  telefonoB: string,
) {
  const nombre = normalizarPersona(nombreA);
  if (!nombre || nombre !== normalizarPersona(nombreB)) return false;

  const telefono = telefonoA.replace(/\D/g, "");
  const otroTelefono = telefonoB.replace(/\D/g, "");
  if (telefono && otroTelefono && telefono !== otroTelefono) return false;
  return true;
}

function leerAdicionales(valor: unknown): ContactoAdicional[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((item, indice) => {
    if (!item || typeof item !== "object") return [];
    const registro = item as Record<string, unknown>;
    const nombre = typeof registro.nombre === "string" ? registro.nombre : "";
    const parentesco =
      typeof registro.parentesco === "string" ? registro.parentesco : "";
    const telefono =
      typeof registro.telefono === "string" ? registro.telefono : "";
    const emergencia = registro.emergencia === true;
    if (!nombre && !parentesco && !telefono && !emergencia) return [];

    return [
      {
        id: `guardado-${indice}`,
        nombre,
        parentesco,
        telefono,
        emergencia,
      },
    ];
  });
}

function familiaresDesdeEmergencia(solicitud: SolicitudRed) {
  const emergencias = [
    {
      nombre: texto(solicitud.emergencia_1_nombre),
      parentesco: texto(solicitud.emergencia_1_parentesco),
      telefono: texto(solicitud.emergencia_1_telefono),
    },
    {
      nombre: texto(solicitud.emergencia_2_nombre),
      parentesco: texto(solicitud.emergencia_2_parentesco),
      telefono: texto(solicitud.emergencia_2_telefono),
    },
  ].filter((contacto) => contacto.nombre || contacto.telefono);

  const familiares = [
    {
      clave: "papa" as const,
      nombre: texto(solicitud.nombre_papa),
      telefono: texto(solicitud.telefono_papa),
    },
    {
      clave: "mama" as const,
      nombre: texto(solicitud.nombre_mama),
      telefono: texto(solicitud.telefono_mama),
    },
    {
      clave: "tutor" as const,
      nombre: texto(solicitud.nombre_tutor),
      telefono: texto(solicitud.telefono_tutor),
    },
  ];

  const usados = new Set<number>();
  const marcas = { papa: false, mama: false, tutor: false };

  for (const familiar of familiares) {
    const indice = emergencias.findIndex((contacto, posicion) => {
      if (usados.has(posicion) || !familiar.nombre) return false;
      return mismaPersona(
        contacto.nombre,
        contacto.telefono,
        familiar.nombre,
        familiar.telefono,
      );
    });

    if (indice >= 0) {
      usados.add(indice);
      marcas[familiar.clave] = true;
    }
  }

  const adicionales = emergencias
    .filter((_, indice) => !usados.has(indice))
    .map((contacto, indice) => ({
      id: `historico-${indice}`,
      nombre: contacto.nombre,
      parentesco: contacto.parentesco,
      telefono: contacto.telefono,
      emergencia: true,
    }));

  return { marcas, adicionales };
}

export function leerRedApoyo(solicitud: SolicitudRed): RedApoyo {
  const tieneEstructuraNueva =
    typeof solicitud.papa_contacto_emergencia === "boolean" ||
    typeof solicitud.mama_contacto_emergencia === "boolean" ||
    typeof solicitud.tutor_contacto_emergencia === "boolean" ||
    Array.isArray(solicitud.contactos_adicionales);

  if (tieneEstructuraNueva) {
    return {
      nombrePapa: solicitud.nombre_papa ?? "",
      telefonoPapa: solicitud.telefono_papa ?? "",
      papaEmergencia: solicitud.papa_contacto_emergencia === true,
      nombreMama: solicitud.nombre_mama ?? "",
      telefonoMama: solicitud.telefono_mama ?? "",
      mamaEmergencia: solicitud.mama_contacto_emergencia === true,
      nombreTutor: solicitud.nombre_tutor ?? "",
      telefonoTutor: solicitud.telefono_tutor ?? "",
      tutorEmergencia: solicitud.tutor_contacto_emergencia === true,
      adicionales: leerAdicionales(solicitud.contactos_adicionales),
    };
  }

  const historico = familiaresDesdeEmergencia(solicitud);
  return {
    nombrePapa: solicitud.nombre_papa ?? "",
    telefonoPapa: solicitud.telefono_papa ?? "",
    papaEmergencia: historico.marcas.papa,
    nombreMama: solicitud.nombre_mama ?? "",
    telefonoMama: solicitud.telefono_mama ?? "",
    mamaEmergencia: historico.marcas.mama,
    nombreTutor: solicitud.nombre_tutor ?? "",
    telefonoTutor: solicitud.telefono_tutor ?? "",
    tutorEmergencia: historico.marcas.tutor,
    adicionales: historico.adicionales,
  };
}

export function contactosEmergencia(red: RedApoyo): ContactoEmergencia[] {
  const contactos: ContactoEmergencia[] = [];

  if (red.papaEmergencia) {
    contactos.push({
      nombre: red.nombrePapa.trim(),
      parentesco: "Papá",
      telefono: red.telefonoPapa.trim(),
    });
  }
  if (red.mamaEmergencia) {
    contactos.push({
      nombre: red.nombreMama.trim(),
      parentesco: "Mamá",
      telefono: red.telefonoMama.trim(),
    });
  }
  if (red.tutorEmergencia) {
    contactos.push({
      nombre: red.nombreTutor.trim(),
      parentesco: "Tutor",
      telefono: red.telefonoTutor.trim(),
    });
  }

  for (const adicional of red.adicionales) {
    if (!adicional.emergencia) continue;
    contactos.push({
      nombre: adicional.nombre.trim(),
      parentesco: adicional.parentesco.trim(),
      telefono: adicional.telefono.trim(),
    });
  }

  return contactos;
}

function textoEnvio(valor: unknown) {
  return typeof valor === "string" ? valor : "";
}

export function redApoyoDesdeEnvio(datos: Record<string, unknown>): RedApoyo {
  const crudos = Array.isArray(datos.contactos_adicionales)
    ? datos.contactos_adicionales
    : [];

  return {
    nombrePapa: textoEnvio(datos.nombre_papa),
    telefonoPapa: textoEnvio(datos.telefono_papa),
    papaEmergencia: datos.papa_contacto_emergencia === true,
    nombreMama: textoEnvio(datos.nombre_mama),
    telefonoMama: textoEnvio(datos.telefono_mama),
    mamaEmergencia: datos.mama_contacto_emergencia === true,
    nombreTutor: textoEnvio(datos.nombre_tutor),
    telefonoTutor: textoEnvio(datos.telefono_tutor),
    tutorEmergencia: datos.tutor_contacto_emergencia === true,
    adicionales: crudos.map((item, indice) => {
      const contacto =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        id: `envio-${indice}`,
        nombre: textoEnvio(contacto.nombre),
        parentesco: textoEnvio(contacto.parentesco),
        telefono: textoEnvio(contacto.telefono),
        emergencia: contacto.emergencia === true,
      };
    }),
  };
}

export function validarRedApoyo(red: RedApoyo) {
  const familiares = [
    {
      etiqueta: "su papá",
      nombre: red.nombrePapa,
      telefono: red.telefonoPapa,
      emergencia: red.papaEmergencia,
    },
    {
      etiqueta: "su mamá",
      nombre: red.nombreMama,
      telefono: red.telefonoMama,
      emergencia: red.mamaEmergencia,
    },
    {
      etiqueta: "el tutor",
      nombre: red.nombreTutor,
      telefono: red.telefonoTutor,
      emergencia: red.tutorEmergencia,
    },
  ];

  for (const familiar of familiares) {
    if (
      familiar.emergencia &&
      (!familiar.nombre.trim() || !familiar.telefono.trim())
    ) {
      return `Capture el nombre y el teléfono de ${familiar.etiqueta} para usarlo como contacto de emergencia.`;
    }
  }

  const adicionales = red.adicionales.filter(
    (contacto) =>
      contacto.nombre.trim() ||
      contacto.parentesco.trim() ||
      contacto.telefono.trim() ||
      contacto.emergencia,
  );

  for (const contacto of adicionales) {
    if (
      !contacto.nombre.trim() ||
      !contacto.parentesco.trim() ||
      !contacto.telefono.trim()
    ) {
      return "Complete nombre, parentesco y teléfono de cada contacto adicional.";
    }
  }

  const nombres = [
    ...familiares
      .filter((familiar) => familiar.nombre.trim())
      .map((familiar) => familiar.nombre),
    ...adicionales.map((contacto) => contacto.nombre),
  ];
  const vistos = new Set<string>();
  for (const nombre of nombres) {
    const clave = normalizarPersona(nombre);
    if (vistos.has(clave)) {
      return "Hay personas repetidas. Registre cada contacto una sola vez.";
    }
    vistos.add(clave);
  }

  const emergencias = contactosEmergencia({
    ...red,
    adicionales,
  }).filter(
    (contacto) => contacto.nombre && contacto.parentesco && contacto.telefono,
  );

  if (emergencias.length < 2) {
    return "Seleccione o registre al menos dos contactos de emergencia.";
  }

  return null;
}

export function serializarContactosAdicionales(red: RedApoyo) {
  const adicionales = red.adicionales
    .filter(
      (contacto) =>
        contacto.nombre.trim() ||
        contacto.parentesco.trim() ||
        contacto.telefono.trim(),
    )
    .map((contacto) => ({
      nombre: contacto.nombre.trim(),
      parentesco: contacto.parentesco.trim(),
      telefono: contacto.telefono.trim(),
      emergencia: contacto.emergencia,
    }));

  return adicionales.length > 0 ? adicionales : null;
}
