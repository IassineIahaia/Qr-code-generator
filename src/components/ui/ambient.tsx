/**
 * Orbs radiais desfocados nos cantos do viewport — dão profundidade
 * ao fundo escuro sem competir com o conteúdo (8% de opacidade).
 */
export function AmbientOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute top-0 left-0 size-[800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(255,77,0,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute right-0 bottom-0 size-[1000px] translate-x-1/4 translate-y-1/4"
        style={{
          background:
            "radial-gradient(circle, rgba(6,40,63,0.4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
