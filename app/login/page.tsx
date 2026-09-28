"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    if (error) {
      setError("Correo electrónico o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
              Sistema de Control de
              <br />
              Estudiantes
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
                  htmlFor="correo"
                  className="mb-2 block text-sm font-semibold text-[#621132]"
                >
                  Correo electrónico
                </label>

                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
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