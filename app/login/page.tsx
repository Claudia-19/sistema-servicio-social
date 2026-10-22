"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    const valor = identificador.trim();

    // Si parece un correo, conservar el acceso habitual del alumno.
    if (valor.includes("@")) {
      const { error } = await supabase.auth.signInWithPassword({
        email: valor,
        password: contrasena,
      });

      if (error) {
        setError("Correo o contraseña incorrectos.");
        return;
      }
    } else {
      // El personal municipal entra mediante su nombre de usuario.
      const response = await fetch("/api/auth/username-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: valor,
          password: contrasena,
        }),
      });

      const resultado = await response.json();

      if (!response.ok || !resultado.ok) {
        setError(resultado.error || "Usuario o contraseña incorrectos.");
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  } catch {
    setError("No fue posible iniciar sesión. Inténtalo nuevamente.");
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado institucional */}
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-5">
          <img
            src="/logo-pachuca.png"
            alt="Pachuca Capital de la Transformación"
            className="h-24 w-auto object-contain"
          />
        </div>
      </header>

      {/* Contenido */}
      <section className="flex min-h-[calc(100vh-130px)] items-center justify-center px-6 py-14">
        <div className="w-full max-w-xl">

          {/* Título */}
          <div className="mb-8 text-center">
            <p className="mb-3 text-base font-semibold uppercase tracking-wider text-[#9D2449]">
              Presidencia Municipal
            </p>

            <h1 className="text-4xl font-bold leading-tight text-[#621132] sm:text-5xl">
              Sistema Integral de Seguimiento de
              <br />
              Formación Profesional
            </h1>

            <p className="mt-4 text-base text-[#707272]">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Formulario */}
          <div className="rounded-xl border border-[#D4C29C] bg-white p-8 shadow-sm sm:p-10">
            <form onSubmit={handleLogin} className="space-y-6">

              {/* Correo */}
<div>
  <label
    htmlFor="identificador"
    className="mb-2 block text-sm font-semibold text-[#621132]"
  >
    Correo electrónico o nombre de usuario
  </label>

  <input
    id="identificador"
    type="text"
    autoComplete="username"
    value={identificador}
    onChange={(e) => setIdentificador(e.target.value)}
    placeholder="Correo electrónico o usuario"
    required
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#9D2449] focus:ring-2 focus:ring-[#D4C29C]"
  />
</div>


              {/* Contraseña */}
              <div>
                <label
                  htmlFor="contrasena"
                  className="mb-2 block text-sm font-semibold text-[#621132]"
                >
                  Contraseña
                </label>

                <input
                  id="contrasena"
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#9D2449] focus:ring-2 focus:ring-[#D4C29C]"
                />

                {/* Recuperación de contraseña */}
                <div className="mt-2 text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-[#9D2449] underline-offset-4 hover:text-[#621132] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#621132] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#9D2449] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>

            {/* Registro */}
            <div className="mt-7 text-center">
              <p className="text-sm text-[#707272]">
                ¿Aún no tienes una cuenta?
              </p>

              <Link
                href="/auth/sign-up"
                className="mt-2 inline-block text-sm font-semibold text-[#9D2449] underline-offset-4 hover:text-[#621132] hover:underline"
              >
                Crear cuenta
              </Link>
            </div>
          </div>

          {/* Regresar */}
          <div className="mt-7 text-center">
            <Link
              href="/"
              className="text-sm text-[#707272] transition hover:text-[#621132]"
            >
              ← Regresar al inicio
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}