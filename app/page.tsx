export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Sistema de Control de Servicio Social
            </h1>
            <p className="text-sm text-gray-500">
              Presidencia Municipal
            </p>
          </div>

          <a
            href="/login"
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Iniciar sesión
          </a>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-89px)] max-w-7xl items-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Presidencia Municipal
          </p>

          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Sistema de Control de Servicio Social
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Plataforma para gestionar las solicitudes, necesidades de las
            áreas y asignaciones de prestadores de servicio social.
          </p>

          <div className="mt-8 flex gap-4">
            <a
              href="/login"
              className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700"
            >
              Iniciar sesión
            </a>

            <a
              href="/solicitud"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Registrar solicitud
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}