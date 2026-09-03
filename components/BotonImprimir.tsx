"use client";

export default function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded bg-blue-600 px-4 py-2 text-white"
    >
      🖨️ Imprimir formato
    </button>
  );
}