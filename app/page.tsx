export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ENCABEZADO INSTITUCIONAL */}
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/logo-pachuca.png"
              alt="Pachuca Capital de la Transformación"
              className="h-16 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto max-w-5xl">

          {/* INTRODUCCIÓN */}
          <div className="text-center">
            <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-[#B38E5D]" />

            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9D2449]">
              Presidencia Municipal
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-[#621132] sm:text-5xl">
              Sistema de Control de Prestadores
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#707272] sm:text-lg">
              Sistema para el registro, seguimiento y asignación de personas
              que realizan Servicio Social, Prácticas Profesionales o
              Estadía en las diferentes áreas de la Presidencia Municipal.
            </p>
          </div>

          {/* ACCESO */}
          <div className="mt-8 text-center">
            <a
              href="/login"
              className="inline-flex rounded-lg bg-[#621132] px-7 py-3 font-medium text-white transition hover:bg-[#9D2449]"
            >
              Iniciar sesión
            </a>
          </div>

          {/* PROCESO */}
          <div className="mt-14">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#621132]">
                ¿Cómo funciona el proceso?
              </h2>

              <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[#B38E5D]" />
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">

              {/* PASO 1 */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#621132] text-lg font-bold text-white">
                  01
                </div>

                <h3 className="text-lg font-bold text-[#621132]">
                  Registro de solicitud
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#707272]">
                  El proceso inicia con el registro de la solicitud y la
                  captura de los datos personales y académicos correspondientes.
                </p>
              </div>

              {/* PASO 2 */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#621132] text-lg font-bold text-white">
                  02
                </div>

                <h3 className="text-lg font-bold text-[#621132]">
                  Revisión y asignación
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#707272]">
                  La solicitud será revisada por el área responsable y se
                  establecerá contacto para informar sobre la asignación del
                  área correspondiente.
                </p>
              </div>

              {/* PASO 3 */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#621132] text-lg font-bold text-white">
                  03
                </div>

                <h3 className="text-lg font-bold text-[#621132]">
                  Presentación de documentación
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#707272]">
                  Una vez definida el área de asignación, será necesario acudir
                  al Departamento de Profesionalización con la{" "}
                  <strong className="font-bold text-[#621132]">
                    carta de presentación en original y copia
                  </strong>
                  .
                </p>
              </div>

            </div>
          </div>

          {/* INFORMACIÓN POSTERIOR */}
          <div className="mt-10 rounded-xl border border-[#D4C29C] bg-[#D4C29C]/20 p-6">
            <h2 className="text-lg font-bold text-[#621132]">
              Después de la asignación
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#707272]">
              Se notificará cuando la{" "}
              <strong className="font-bold text-[#621132]">
                carta de aceptación
              </strong>{" "}
              se encuentre disponible para su entrega. Posteriormente, se
              proporcionarán las indicaciones correspondientes para la
              presentación en el área asignada y el inicio de actividades.
            </p>
          </div>

          {/* DETALLE INSTITUCIONAL */}
          <div className="mt-12 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-[#B38E5D]" />

            <p className="text-center text-sm text-[#707272]">
              Presidencia Municipal de Pachuca de Soto, Hidalgo
            </p>

            <div className="h-px w-12 bg-[#B38E5D]" />
          </div>

        </div>
      </section>
    </main>
  );
}