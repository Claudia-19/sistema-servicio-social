import { SignUpForm } from "@/components/sign-up-form";
import HeaderInstitucional from "@/components/HeaderInstitucional";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ENCABEZADO INSTITUCIONAL */}
      <HeaderInstitucional variante="centro" />

      {/* REGISTRO */}
      <section className="flex w-full items-start justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </section>
    </main>
  );
}