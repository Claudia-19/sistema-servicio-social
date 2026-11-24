import { randomInt } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = env.SUPABASE_SECRET_KEY;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !secretKey || !publishableKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERNAMES = {
  SEC_GENERAL: "coord.general",
  SEC_TESORERIA: "coord.tesoreria",
  SEC_DES_ECONOMICO: "coord.economico",
  SEC_BIENESTAR: "coord.bienestar",
  SEC_SERVICIOS: "coord.servicios",
  SEC_MEDIO_AMBIENTE: "coord.medioambiente",
  SEC_MUJERES: "coord.mujeres",
  SEC_OBRAS: "coord.obras",
  SEC_PLANEACION: "coord.planeacion",
  SEC_CONTRALORIA: "coord.contraloria",
  SEC_SEGURIDAD: "coord.seguridad",
  DESPACHO_PRESIDENCIA: "coord.despacho",
};

const AREAS_DESPACHO = [
  "Presidencia Municipal",
  "Secretaría Particular",
  "Secretaría Ejecutiva del Sistema Municipal de Protección Integral de Niñas, Niños y Adolescentes",
];

function generarPassword() {
  const minusculas = "abcdefghijkmnopqrstuvwxyz";
  const mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const simbolos = "!@#$%*-_";
  const todos = minusculas + mayusculas + numeros + simbolos;
  const caracteres = [
    minusculas[randomInt(minusculas.length)],
    mayusculas[randomInt(mayusculas.length)],
    numeros[randomInt(numeros.length)],
    simbolos[randomInt(simbolos.length)],
  ];

  while (caracteres.length < 20) {
    caracteres.push(todos[randomInt(todos.length)]);
  }

  for (let indice = caracteres.length - 1; indice > 0; indice -= 1) {
    const destino = randomInt(indice + 1);
    [caracteres[indice], caracteres[destino]] = [caracteres[destino], caracteres[indice]];
  }

  return caracteres.join("");
}

function crearCliente(accessToken) {
  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function leerCatalogo() {
  const correo = `lectura.temporal.${Date.now()}@ejemplo.com`;
  const password = generarPassword();
  const creado = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  });

  if (creado.error || !creado.data.user) {
    throw new Error(creado.error?.message ?? "No se pudo abrir la lectura del catálogo.");
  }

  const userId = creado.data.user.id;

  try {
    const actualizado = await admin
      .from("usuarios")
      .update({
        rol_id: 4,
        username: `lectura.temporal.${Date.now()}`,
        nombre: "Lectura",
        apellido_paterno: "Temporal",
        activo: true,
      })
      .eq("id", userId)
      .select("id")
      .single();

    if (actualizado.error) {
      throw new Error(actualizado.error.message);
    }

    const lector = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const sesion = await lector.auth.signInWithPassword({ email: correo, password });
    if (sesion.error || !sesion.data.session) {
      throw new Error(sesion.error?.message ?? "No se pudo leer el catálogo.");
    }

    const cliente = crearCliente(sesion.data.session.access_token);
    const dependencias = await cliente
      .from("dependencias")
      .select("id, clave, nombre, activo")
      .order("id");
    const areas = await cliente
      .from("areas")
      .select("id, nombre, activo, dependencia_id")
      .order("id");

    if (dependencias.error || areas.error) {
      throw new Error(dependencias.error?.message ?? areas.error?.message);
    }

    return { dependencias: dependencias.data ?? [], areas: areas.data ?? [] };
  } finally {
    await admin.from("usuarios").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
}

async function esperarPerfil(userId) {
  for (let intento = 0; intento < 10; intento += 1) {
    const perfil = await admin
      .from("usuarios")
      .select("id, username, rol_id, dependencia_id, area_id, activo")
      .eq("id", userId)
      .maybeSingle();

    if (perfil.error) {
      throw new Error(perfil.error.message);
    }
    if (perfil.data) return perfil.data;
    await new Promise((resolver) => setTimeout(resolver, 300));
  }

  return null;
}

function csvCampo(valor) {
  const texto = valor == null ? "" : String(valor);
  return `"${texto.replaceAll('"', '""')}"`;
}

async function limpiarLecturasTemporales() {
  let pagina = 1;

  while (pagina < 20) {
    const lista = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (lista.error) {
      throw new Error(lista.error.message);
    }

    const usuariosAuth = lista.data.users ?? [];
    for (const usuario of usuariosAuth) {
      if (!usuario.email?.startsWith("lectura.temporal.")) continue;
      await admin.from("usuarios").delete().eq("id", usuario.id);
      await admin.auth.admin.deleteUser(usuario.id);
    }

    if (usuariosAuth.length < 200) break;
    pagina += 1;
  }
}

await limpiarLecturasTemporales();
const catalogo = await leerCatalogo();
const dependenciasActivas = catalogo.dependencias.filter((item) => item.activo);
const administracion = dependenciasActivas.find((item) => item.clave === "SEC_ADMIN");
const objetivos = dependenciasActivas.filter((item) => USERNAMES[item.clave]);

if (!administracion || objetivos.length !== 12) {
  throw new Error("El catálogo no contiene las 12 dependencias esperadas además de Administración.");
}

const perfiles = await admin
  .from("usuarios")
  .select("id, username, nombre, apellido_paterno, rol_id, dependencia_id, area_id, activo")
  .eq("rol_id", 3);

if (perfiles.error) {
  throw new Error(perfiles.error.message);
}

const cuentas = perfiles.data ?? [];
const administracionActual = cuentas.find(
  (cuenta) => cuenta.username === "coord.administracion" && cuenta.rol_id === 3,
);

if (
  !administracionActual ||
  Number(administracionActual.dependencia_id) !== Number(administracion.id) ||
  Number(administracionActual.area_id) !== 2 ||
  administracionActual.activo !== true
) {
  throw new Error("La cuenta coord.administracion no está en el estado que debe conservarse.");
}

const correoAdministracion = await admin.auth.admin.getUserById(administracionActual.id);
const resultados = [];
const credencialesNuevas = [];
const usadas = new Set();

for (const dependencia of objetivos) {
  const username = USERNAMES[dependencia.clave];
  const esDespacho = dependencia.clave === "DESPACHO_PRESIDENCIA";
  const areasDependencia = catalogo.areas.filter(
    (area) => area.dependencia_id === dependencia.id && area.activo,
  );
  const areaPropia = areasDependencia.filter((area) => area.nombre === dependencia.nombre);

  if (!esDespacho && areaPropia.length !== 1) {
    resultados.push({
      username,
      dependencia: dependencia.nombre,
      resultado: "no creada",
      detalle: "No hay un área única con el mismo nombre de la dependencia.",
    });
    continue;
  }

  if (esDespacho) {
    const nombres = areasDependencia.map((area) => area.nombre).sort();
    const esperadas = [...AREAS_DESPACHO].sort();
    if (nombres.join("|") !== esperadas.join("|")) {
      resultados.push({
        username,
        dependencia: dependencia.nombre,
        resultado: "no creada",
        detalle: "Las áreas del Despacho no coinciden con Presidencia, Secretaría Particular y SIPINNA.",
      });
      continue;
    }
  }

  const existente = cuentas.find(
    (cuenta) => cuenta.rol_id === 3 && cuenta.dependencia_id === dependencia.id,
  );

  if (existente) {
    resultados.push({
      username: existente.username,
      dependencia: dependencia.nombre,
      resultado: "ya existía",
      detalle: "Se conservó la cuenta coordinadora de esta dependencia.",
    });
    continue;
  }

  const usernameOcupado = await admin
    .from("usuarios")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (usernameOcupado.error) {
    resultados.push({
      username,
      dependencia: dependencia.nombre,
      resultado: "no creada",
      detalle: usernameOcupado.error.message,
    });
    continue;
  }

  if (usernameOcupado.data) {
    resultados.push({
      username,
      dependencia: dependencia.nombre,
      resultado: "no creada",
      detalle: "El username ya está ocupado por otra cuenta.",
    });
    continue;
  }

  const correo = `${username}@ejemplo.com`;
  let password = generarPassword();
  while (usadas.has(password)) password = generarPassword();
  usadas.add(password);

  const creado = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  });

  if (creado.error || !creado.data.user) {
    resultados.push({
      username,
      dependencia: dependencia.nombre,
      resultado: "no creada",
      detalle: creado.error?.message ?? "Auth no devolvió la cuenta.",
    });
    continue;
  }

  const userId = creado.data.user.id;

  try {
    const perfil = await esperarPerfil(userId);
    if (!perfil) {
      throw new Error("La cuenta de Auth no generó su perfil.");
    }

    const actualizado = await admin
      .from("usuarios")
      .update({
        rol_id: 3,
        username,
        dependencia_id: dependencia.id,
        area_id: esDespacho ? null : areaPropia[0].id,
        activo: true,
        nombre: dependencia.nombre,
        apellido_paterno: "Coordinador",
        apellido_materno: null,
      })
      .eq("id", userId)
      .select("id, username, rol_id, dependencia_id, area_id, activo, nombre")
      .single();

    if (actualizado.error || !actualizado.data) {
      throw new Error(actualizado.error?.message ?? "No se pudo actualizar el perfil.");
    }

    cuentas.push(actualizado.data);
    credencialesNuevas.push({
      username,
      correo,
      password,
      dependencia: dependencia.nombre,
      dependenciaId: dependencia.id,
      areaId: esDespacho ? "" : areaPropia[0].id,
    });
    resultados.push({
      username,
      dependencia: dependencia.nombre,
      resultado: "creada",
      detalle: esDespacho
        ? "Vinculada al Despacho, sin área única."
        : `Vinculada a su dependencia y al área ${areaPropia[0].id}.`,
    });
  } catch (error) {
    await admin.auth.admin.deleteUser(userId);
    await admin.from("usuarios").delete().eq("id", userId);
    resultados.push({
      username,
      dependencia: dependencia.nombre,
      resultado: "no creada",
      detalle: error instanceof Error ? error.message : "Error al crear la cuenta.",
    });
  }
}

const carpeta = path.resolve("credenciales_coordinadores");
mkdirSync(carpeta, { recursive: true });

if (credencialesNuevas.length > 0) {
  const csv = [
    "username,correo,contrasena,dependencia,dependencia_id,area_id",
    ...credencialesNuevas.map((cuenta) =>
      [
        cuenta.username,
        cuenta.correo,
        cuenta.password,
        cuenta.dependencia,
        cuenta.dependenciaId,
        cuenta.areaId,
      ]
        .map(csvCampo)
        .join(","),
    ),
  ].join("\r\n");

  const txt = [
    "Credenciales privadas de las cuentas coordinadoras creadas.",
    "Este archivo es local. No lo compartas ni lo subas al repositorio.",
    "",
    ...credencialesNuevas.flatMap((cuenta) => [
      `Usuario: ${cuenta.username}`,
      `Dependencia: ${cuenta.dependencia}`,
      `Correo interno: ${cuenta.correo}`,
      `Contraseña: ${cuenta.password}`,
      cuenta.areaId === "" ? "Área: acceso por dependencia" : `Área id: ${cuenta.areaId}`,
      "",
    ]),
  ].join("\r\n");

  writeFileSync(path.join(carpeta, "coordinadores.csv"), `\uFEFF${csv}\r\n`, "utf8");
  writeFileSync(path.join(carpeta, "coordinadores.txt"), txt, "utf8");
}

const verificacion = await admin
  .from("usuarios")
  .select("id, username, nombre, rol_id, dependencia_id, area_id, activo")
  .eq("rol_id", 3)
  .order("dependencia_id");

const coordinadores = verificacion.data ?? [];
const administracionFinal = coordinadores.find((cuenta) => cuenta.username === "coord.administracion");
const correoFinal = administracionFinal
  ? await admin.auth.admin.getUserById(administracionFinal.id)
  : null;

const despacho = coordinadores.find((cuenta) => cuenta.username === "coord.despacho");
let accesoDespacho = null;

if (despacho) {
  const credencial = credencialesNuevas.find((cuenta) => cuenta.username === "coord.despacho");
  const areasDespacho = catalogo.areas
    .filter((area) => area.dependencia_id === despacho.dependencia_id && area.activo)
    .map((area) => ({ id: area.id, nombre: area.nombre }));

  if (credencial) {
    const verificador = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const sesion = await verificador.auth.signInWithPassword({
      email: credencial.correo,
      password: credencial.password,
    });
    if (sesion.data.session) {
      const cliente = crearCliente(sesion.data.session.access_token);
      const areasVisibles = await cliente
        .from("areas")
        .select("id, nombre, dependencia_id")
        .eq("dependencia_id", despacho.dependencia_id)
        .order("id");
      accesoDespacho = {
        areasDeLaDependencia: areasDespacho,
        areasVisiblesEnSesion: areasVisibles.data ?? [],
        errorSesion: areasVisibles.error?.message ?? null,
      };
      await cliente.auth.signOut();
    } else {
      accesoDespacho = {
        areasDeLaDependencia: areasDespacho,
        areasVisiblesEnSesion: [],
        errorSesion: sesion.error?.message ?? "No se pudo iniciar sesión de verificación.",
      };
    }
  }
}

const resumen = {
  resultados,
  totalCoordinadores: coordinadores.length,
  coordinadores: coordinadores.map((cuenta) => ({
    username: cuenta.username,
    dependencia_id: cuenta.dependencia_id,
    area_id: cuenta.area_id,
    activo: cuenta.activo,
    nombre: cuenta.nombre,
  })),
  administracionConservada:
    administracionFinal?.id === administracionActual.id &&
    administracionFinal?.dependencia_id === administracionActual.dependencia_id &&
    administracionFinal?.area_id === administracionActual.area_id &&
    correoFinal?.data.user?.email === correoAdministracion.data.user?.email,
  accesoDespacho,
  archivos:
    credencialesNuevas.length > 0
      ? [
          path.join(carpeta, "coordinadores.csv"),
          path.join(carpeta, "coordinadores.txt"),
        ]
      : [],
};

console.log(
  JSON.stringify(
    {
      resultados: resumen.resultados,
      totalCoordinadores: resumen.totalCoordinadores,
      administracionConservada: resumen.administracionConservada,
      archivos: resumen.archivos.length,
    },
    null,
    2,
  ),
);
