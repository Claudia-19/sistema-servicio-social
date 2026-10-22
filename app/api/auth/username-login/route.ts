
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username =
      typeof body.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Buscar únicamente cuentas internas activas.
    const { data: usuario, error: perfilError } = await admin
      .from("usuarios")
      .select("id, username, rol_id, activo")
      .eq("username", username)
      .in("rol_id", [2, 3, 4])
      .eq("activo", true)
      .maybeSingle();

    if (perfilError || !usuario) {
  console.error("[username-login] Error al buscar perfil:", {
    error: perfilError?.message ?? null,
    usuarioEncontrado: Boolean(usuario),
  });

  return NextResponse.json(
    { error: "Usuario o contraseña incorrectos." },
    { status: 401 },
  );
}
    // Obtener el correo asociado a la identidad de Supabase Auth.
    const { data: resultadoAuth, error: errorAuth } =
      await admin.auth.admin.getUserById(usuario.id);

    const email = resultadoAuth.user?.email;

    if (errorAuth || !email) {
  console.error("[username-login] Error al buscar cuenta Auth:", {
    error: errorAuth?.message ?? null,
    emailExiste: Boolean(email),
  });

  return NextResponse.json(
    { error: "No se pudo verificar la cuenta de acceso." },
    { status: 401 },
  );
}

    // Autenticar con Supabase Auth y guardar la sesión en las cookies.
    const supabase = await createClient();

    const { data: sesion, error: errorLogin } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (errorLogin || !sesion.user || sesion.user.id !== usuario.id) {
  console.error("[username-login] Falló la autenticación:", {
    error: errorLogin?.message ?? null,
    usuarioEncontrado: Boolean(sesion.user),
    idCoincide: sesion.user?.id === usuario.id,
  });

  return NextResponse.json(
    { error: "Usuario o contraseña incorrectos." },
    { status: 401 },
  );
}

    return NextResponse.json({
      ok: true,
      usuario: {
        username: usuario.username,
        rol_id: usuario.rol_id,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error al iniciar sesión." },
      { status: 500 },
    );
  }
}
