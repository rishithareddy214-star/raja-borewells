'use client'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white print:hidden">
      Print / Save as PDF
    </button>
  )
}
