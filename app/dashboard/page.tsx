import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

const { data: usuario, error } = await supabase
  .from("usuarios")
  .select("nombre, apellido_paterno, apellido_materno, rol_id")
  .eq("id", user.id)
  .single();

if (error) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="max-w-lg rounded-xl border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-red-700">
          Error al consultar el perfil
        </h1>

        <p className="mt-3 text-gray-600">
          {error.message}
        </p>

        <p className="mt-4 text-xs text-gray-400">
          Código: {error.code}
        </p>
      </div>
    </main>
  );
}

if (!usuario) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-red-700">
          No se encontró el perfil del usuario
        </h1>
      </div>
    </main>
  );
}

  if (error || !usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            No se encontró el perfil del usuario
          </h1>

          <p className="mt-2 text-gray-600">
            El usuario está autenticado, pero todavía no tiene un perfil
            configurado en el sistema.
          </p>
        </div>
      </main>
    );
  }

  switch (usuario.rol_id) {
    case 1:
      redirect("/alumno");

    case 2:
      redirect("/rh");

    case 3:
      redirect("/coordinador");

    case 4:
      redirect("/administradora");

    default:
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-red-700">
              Rol no válido
            </h1>

            <p className="mt-2 text-gray-600">
              El usuario no tiene un rol válido configurado.
            </p>
          </div>
        </main>
      );
  }
}