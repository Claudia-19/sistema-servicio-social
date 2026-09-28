import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
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
      <section className="flex min-h-[calc(100vh-130px)] w-full items-center justify-center px-6 py-14">
        <div className="w-full max-w-xl">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}