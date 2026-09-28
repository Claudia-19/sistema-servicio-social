"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FotoAlumnoProps = {
  usuarioId: string;
  fotoUrl: string | null;
};

export default function FotoAlumno({
  usuarioId,
  fotoUrl,
}: FotoAlumnoProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [foto, setFoto] = useState<string | null>(fotoUrl);
  const [preview, setPreview] = useState<string | null>(fotoUrl);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const seleccionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    setMensaje("");
    setError("");

    if (!archivo.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido.");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("La fotografía no debe superar los 5 MB.");
      return;
    }

    const url = URL.createObjectURL(archivo);
    setPreview(url);
  };

  const subirFoto = async () => {
    const archivo = inputRef.current?.files?.[0];

    if (!archivo) {
      setError("Primero selecciona una fotografía.");
      return;
    }

    setLoading(true);
    setMensaje("");
    setError("");

    try {
      const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
      const nombreArchivo = `foto.${extension}`;
      const ruta = `${usuarioId}/${nombreArchivo}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-alumnos")
        .upload(ruta, archivo, {
          upsert: true,
          contentType: archivo.type,
        });

      if (uploadError) {
        console.error(uploadError);
        throw new Error("No fue posible subir la fotografía.");
      }

      const { error: updateError } = await supabase
        .from("usuarios")
        .update({
          foto_url: ruta,
        })
        .eq("id", usuarioId);

      if (updateError) {
        console.error(updateError);
        throw new Error(
          "La fotografía se subió, pero no fue posible actualizar tu perfil."
        );
      }

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("fotos-alumnos")
          .createSignedUrl(ruta, 60 * 60);

      if (signedUrlError) {
        console.error(signedUrlError);
        throw new Error("La fotografía se guardó, pero no fue posible mostrarla.");
      }

      setFoto(ruta);
      setPreview(signedUrlData.signedUrl);
      setMensaje("Fotografía guardada correctamente.");

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar la fotografía."
      );
    } finally {
      setLoading(false);
    }
  };

  const mostrarFoto = async () => {
    if (!foto) return;

    const { data, error: signedUrlError } = await supabase.storage
      .from("fotos-alumnos")
      .createSignedUrl(foto, 60 * 60);

    if (!signedUrlError && data?.signedUrl) {
      setPreview(data.signedUrl);
    }
  };

  return (
    <div className="rounded-xl border border-dorado-claro bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="mb-4 h-1 w-12 rounded-full bg-vino-oscuro" />

        <h3 className="text-xl font-semibold text-vino-oscuro">
          Fotografía
        </h3>

        <p className="mt-1 text-sm text-gris-oscuro">
          Sube una fotografía que será utilizada para tu expediente y
          credencial.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex h-40 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dorado-claro bg-gray-50">
          {preview ? (
            <img
              src={preview}
              alt="Fotografía del alumno"
              className="h-full w-full object-cover"
              onError={() => {
                setPreview(null);
              }}
            />
          ) : (
            <div className="px-4 text-center">
              <div className="mb-2 text-4xl">📷</div>
              <p className="text-xs text-gris-oscuro">
                Sin fotografía
              </p>
            </div>
          )}
        </div>

        <div className="w-full">
          <label
            htmlFor="foto-alumno"
            className="mb-2 block text-sm font-medium text-vino-oscuro"
          >
            Seleccionar fotografía
          </label>

          <input
            ref={inputRef}
            id="foto-alumno"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={seleccionarFoto}
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-vino-oscuro file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-vino-claro"
          />

          <p className="mt-2 text-xs text-gris-oscuro">
            Formatos permitidos: JPG, PNG o WEBP. Tamaño máximo: 5 MB.
          </p>

          <button
            type="button"
            onClick={subirFoto}
            disabled={loading}
            className="mt-4 rounded-lg bg-vino-oscuro px-5 py-2.5 text-sm font-medium text-white transition hover:bg-vino-claro disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Guardando..."
              : foto
              ? "Cambiar fotografía"
              : "Guardar fotografía"}
          </button>

          {mensaje && (
            <p className="mt-3 text-sm font-medium text-green-700">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}