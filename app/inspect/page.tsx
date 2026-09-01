"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const InspectScene = dynamic(() => import("./InspectScene"), { ssr: false });

/**
 * Oficina do modelo: /inspect?view=lateral para comparar com fotos de
 * referência sem precisar dirigir até um ângulo específico.
 * Views: frente, lateral, traseira, 3-4, 3-4-tras, topo.
 * Aceita ainda ?steer=-1..1 e ?spin=<radianos> para conferir as rodas paradas.
 */
export default function InspectPage() {
  const [params, setParams] = useState({ view: "3-4", steer: 0, spin: 0 });

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setParams({
      view: search.get("view") ?? "3-4",
      steer: Number(search.get("steer") ?? 0),
      spin: Number(search.get("spin") ?? 0),
    });
  }, []);

  return (
    <main style={{ position: "fixed", inset: 0 }}>
      <InspectScene view={params.view} steer={params.steer} spin={params.spin} />
    </main>
  );
}
