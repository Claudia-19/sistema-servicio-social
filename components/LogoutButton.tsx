"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-vino-oscuro"
    >
      Cerrar sesión
    </button>
  );
}