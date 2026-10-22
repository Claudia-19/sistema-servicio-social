
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 },
      );
    }

    const { data: usuario, error: perfilError } = await supabase
      .from("usuarios")
      .select("rol_id, activo")
      .eq("id", user.id)
      .single();

    if (perfilError || !usuario || !usuario.activo || usuario.rol_id !== 4) {
      return NextResponse.json(
        { error: "No tienes autorización para realizar esta operación." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Sesión administrativa verificada.",
    });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error al verificar los permisos." },
      { status: 500 },
    );
  }
}
