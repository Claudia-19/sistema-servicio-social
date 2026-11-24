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
      className="shrink-0 rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white hover:text-[#621132]"
    >
      Cerrar sesión
    </button>
  );
}