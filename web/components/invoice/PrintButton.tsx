"use client";

// "Зберегти PDF": the browser's print dialog, where "Save as PDF" is the default printer
// on phones and laptops.

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="h-11 rounded-full bg-[#0f172a] px-5 font-bold text-white">
      Зберегти PDF або надрукувати
    </button>
  );
}
