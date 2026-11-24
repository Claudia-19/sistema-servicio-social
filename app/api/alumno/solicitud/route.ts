import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redApoyoDesdeEnvio, validarRedApoyo } from "@/lib/solicitud";

const CAMPOS_SOLICITUD = [
  "nombre",
  "nombres",
  "apellido_paterno",
  "apellido_materno",
  "domicilio",
  "codigo_postal",
  "estado_domicilio",
  "municipio",
  "localidad",
  "colonia",
  "calle",
  "numero_exterior",
  "numero_interior",
  "institucion_educativa",
  "institucion_pendiente_revision",
  "carrera",
  "carrera_id",
  "tiene_seguro_facultativo",
  "seguro_facultativo_institucion",
  "seguro_facultativo_otro",
  "semestre_cuatrimestre",
  "matricula",
  "telefono",
  "telefono_casa",
  "tipo_proceso",
  "fecha_inicio",
  "horario_propuesto",
  "horas_requeridas",
  "informacion_adicional",
  "nombre_papa",
  "telefono_papa",
  "nombre_mama",
  "telefono_mama",
  "nombre_tutor",
  "telefono_tutor",
  "papa_contacto_emergencia",
  "mama_contacto_emergencia",
  "tutor_contacto_emergencia",
  "contactos_adicionales",
  "emergencia_1_nombre",
  "emergencia_1_parentesco",
  "emergencia_1_telefono",
  "emergencia_2_nombre",
  "emergencia_2_parentesco",
  "emergencia_2_telefono",
  "fotografia_url",
] as const;

function correoNormalizado(valor: unknown) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return NextResponse.json(
      { error: "Su sesión ha expirado. Inicie sesión nuevamente." },
      { status: 401 },
    );
  }

  const correo = user.email?.trim() ?? "";
  if (!correo) {
    return NextResponse.json(
      { error: "No fue posible obtener el correo electrónico de su sesión." },
      { status: 400 },
    );
  }

  const cuerpo = await request.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    return NextResponse.json(
      { error: "La solicitud no es válida." },
      { status: 400 },
    );
  }

  const datos = cuerpo as Record<string, unknown>;
  const correoEnviado = correoNormalizado(datos.correo);
  if (correoEnviado && correoEnviado !== correo.toLowerCase()) {
    return NextResponse.json(
      { error: "El correo no corresponde al usuario autenticado." },
      { status: 403 },
    );
  }

  const errorRed = validarRedApoyo(redApoyoDesdeEnvio(datos));
  if (errorRed) {
    return NextResponse.json({ error: errorRed }, { status: 400 });
  }

  const fila: Record<string, unknown> = {
    usuario_id: user.id,
    correo,
  };

  for (const campo of CAMPOS_SOLICITUD) {
    if (campo in datos) {
      fila[campo] = datos[campo];
    }
  }

  const { error: errorInsert } = await supabase.from("solicitudes").insert(fila);
  if (errorInsert) {
    console.error(errorInsert);
    return NextResponse.json(
      { error: "No fue posible enviar la solicitud. Inténtelo nuevamente." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
