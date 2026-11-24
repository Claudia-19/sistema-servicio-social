import { NextResponse } from "next/server";
import { consultarCodigoPostal } from "@/lib/codigo-postal";

export async function GET(request: Request) {
  const cp = new URL(request.url).searchParams.get("cp")?.trim() ?? "";

  try {
    const resultado = await consultarCodigoPostal(cp);
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({
      encontrado: false,
      estado: "",
      municipio: "",
      localidad: "",
      colonias: [],
      mensaje:
        "No fue posible consultar el código postal. Capture el domicilio manualmente.",
    });
  }
}
