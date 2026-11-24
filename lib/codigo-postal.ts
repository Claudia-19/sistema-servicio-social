export type DomicilioAutocompletado = {
  estado: string;
  municipio: string;
  localidad: string;
  colonia: string;
};

export type LugarPostal = {
  municipio: string;
  localidad: string;
  colonia: string;
};

export type ResultadoCodigoPostal = {
  encontrado: boolean;
  estado: string;
  lugares: LugarPostal[];
  mensaje: string;
};

const NO_ENCONTRADO =
  "No se encontró el código postal. Capture estado, municipio, localidad y colonia manualmente.";
const FALLO =
  "No fue posible consultar el código postal. Capture el domicilio manualmente.";

function vacio(mensaje: string): ResultadoCodigoPostal {
  return {
    encontrado: false,
    estado: "",
    lugares: [],
    mensaje,
  };
}

function unicos(valores: string[]) {
  return [
    ...new Set(valores.map((valor) => valor.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "es"));
}

function lugar(municipio: string, ciudad: string, colonia: string): LugarPostal | null {
  const asentamiento = colonia.trim();
  const municipioLimpio = municipio.trim();
  if (!asentamiento && !municipioLimpio) return null;

  const ciudadLimpia = ciudad.trim();
  return {
    municipio: municipioLimpio,
    localidad: ciudadLimpia || asentamiento,
    colonia: asentamiento || ciudadLimpia,
  };
}

function resultadoDesdeLugares(
  estado: string,
  lugares: LugarPostal[],
): ResultadoCodigoPostal {
  const lista = lugares.filter(
    (item, indice, todos) =>
      todos.findIndex(
        (otro) =>
          otro.municipio === item.municipio &&
          otro.localidad === item.localidad &&
          otro.colonia === item.colonia,
      ) === indice,
  );

  if (!estado && lista.length === 0) return vacio(NO_ENCONTRADO);

  const municipios = unicos(lista.map((item) => item.municipio));
  const localidades = unicos(lista.map((item) => item.localidad));

  let mensaje = "Confirme la colonia.";
  if (municipios.length > 1) {
    mensaje = "Este código postal abarca más de un municipio. Seleccione el que corresponda.";
  } else if (localidades.length > 1) {
    mensaje = "Hay varias localidades para este código postal. Seleccione la que corresponda.";
  } else if (!estado || municipios.length === 0) {
    mensaje = "La consulta no trajo todos los datos. Complete manualmente lo que falte.";
  }

  return {
    encontrado: true,
    estado,
    lugares: lista,
    mensaje,
  };
}

export function aplicarDomicilioPostal<T extends DomicilioAutocompletado>(
  actual: T,
  resultado: ResultadoCodigoPostal,
  ultimo: DomicilioAutocompletado,
): { domicilio: T; ultimo: DomicilioAutocompletado } {
  const siguiente = { ...actual };
  const nuevoUltimo = { ...ultimo };
  const campos = ["estado", "municipio", "localidad", "colonia"] as const;

  if (!resultado.encontrado) {
    for (const campo of campos) {
      if (actual[campo] && actual[campo] === ultimo[campo]) {
        siguiente[campo] = "";
        nuevoUltimo[campo] = "";
      }
    }
    return { domicilio: siguiente, ultimo: nuevoUltimo };
  }

  const municipios = unicos(resultado.lugares.map((item) => item.municipio));
  const localidades = unicos(resultado.lugares.map((item) => item.localidad));
  const colonias = unicos(resultado.lugares.map((item) => item.colonia));
  const propuestos: DomicilioAutocompletado = {
    estado: resultado.estado,
    municipio: municipios.length === 1 ? municipios[0] : "",
    localidad: localidades.length === 1 ? localidades[0] : "",
    colonia: colonias.length === 1 ? colonias[0] : "",
  };

  for (const campo of campos) {
    const puedeReemplazar = !actual[campo].trim() || actual[campo] === ultimo[campo];
    if (!puedeReemplazar) continue;
    siguiente[campo] = propuestos[campo];
    nuevoUltimo[campo] = propuestos[campo];
  }

  return { domicilio: siguiente, ultimo: nuevoUltimo };
}

async function consultarPostali(cp: string, signal: AbortSignal) {
  const respuesta = await fetch(`https://postali.app/api/v1/mx/cp/${cp}`, {
    signal,
    cache: "no-store",
  });

  if (respuesta.status === 404) return vacio(NO_ENCONTRADO);
  if (!respuesta.ok) throw new Error("postali");

  const datos = (await respuesta.json()) as {
    estado?: string;
    municipio?: string;
    asentamientos?: { nombre?: string; ciudad?: string | null }[];
  };
  const lugares = (datos.asentamientos ?? [])
    .map((asentamiento) =>
      lugar(
        datos.municipio ?? "",
        asentamiento.ciudad ?? "",
        asentamiento.nombre ?? "",
      ),
    )
    .filter((item): item is LugarPostal => item !== null);

  if (!datos.estado?.trim() && lugares.length === 0) return vacio(NO_ENCONTRADO);
  return resultadoDesdeLugares(datos.estado?.trim() ?? "", lugares);
}

async function consultarSepomex(cp: string, signal: AbortSignal) {
  const lugares: LugarPostal[] = [];
  let estado = "";

  for (let pagina = 1; pagina <= 5; pagina += 1) {
    const respuesta = await fetch(
      `https://sepomex.kurenn.dev/api/v1/zip_codes?zip_code=${cp}&per_page=200&page=${pagina}`,
      { signal, cache: "no-store" },
    );
    if (!respuesta.ok) throw new Error("sepomex");

    const datos = (await respuesta.json()) as {
      zip_codes?: {
        d_codigo?: string;
        d_asenta?: string;
        d_mnpio?: string;
        d_estado?: string;
        d_ciudad?: string | null;
      }[];
      meta?: { pagination?: { total_pages?: number } };
    };
    const filas = (datos.zip_codes ?? []).filter((fila) => fila.d_codigo === cp);
    if (filas.length === 0) break;

    for (const fila of filas) {
      if (!estado && fila.d_estado) estado = fila.d_estado.trim();
      const item = lugar(fila.d_mnpio ?? "", fila.d_ciudad ?? "", fila.d_asenta ?? "");
      if (item) lugares.push(item);
    }

    if (pagina >= (datos.meta?.pagination?.total_pages ?? pagina)) break;
  }

  if (!estado && lugares.length === 0) return null;
  return resultadoDesdeLugares(estado, lugares);
}

export async function consultarCodigoPostal(
  cp: string,
  signalExterno?: AbortSignal,
): Promise<ResultadoCodigoPostal> {
  if (!/^\d{5}$/.test(cp)) {
    return vacio("El código postal debe tener cinco dígitos.");
  }

  const signal = signalExterno
    ? AbortSignal.any([signalExterno, AbortSignal.timeout(8000)])
    : AbortSignal.timeout(8000);

  try {
    return await consultarPostali(cp, signal);
  } catch (error) {
    if (signal.aborted) throw error;
  }

  try {
    const sepomex = await consultarSepomex(cp, signal);
    if (sepomex) return sepomex;
  } catch (error) {
    if (signal.aborted) throw error;
  }

  return vacio(FALLO);
}
