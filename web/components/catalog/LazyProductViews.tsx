"use client";

// Product views with their own personalisation, loaded only on the products that need them:
// the monogram view carries the font engine and the hole view its geometry, so ordinary
// product pages do not download them (Lighthouse mobile, QA 2026-10-16). Both still render
// on the server, the split only changes when the browser loads their code.

import dynamic from "next/dynamic";

export const LazyHoleProductView = dynamic(() => import("./HoleProductView").then((m) => m.HoleProductView));

export const LazyMonogramProductView = dynamic(() => import("./MonogramProductView").then((m) => m.MonogramProductView));
