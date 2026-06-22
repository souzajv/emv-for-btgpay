const PEDAGOGICAL_WRAPPER = /^Conforme a documentação fonte:\s*/i;

export function stripPedagogicalWrapper(text) {
  if (!text) return "";
  let t = text.trim();
  t = t.replace(PEDAGOGICAL_WRAPPER, "");
  t = t.replace(/\s*\(tradução e condensação pedagógica;[^)]*\)\s*$/i, "");
  return t.trim();
}
