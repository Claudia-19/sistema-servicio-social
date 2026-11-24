import { ForgotPasswordForm } from "@/components/forgot-password-form";
import HeaderInstitucional from "@/components/HeaderInstitucional";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado institucional */}
      <HeaderInstitucional variante="centro" />

      {/* Contenido */}
      <section className="flex w-full items-start justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-xl">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}