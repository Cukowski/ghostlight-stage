// Resolve the vendored browser import map during the optional Node export check.
export async function resolve(specifier, context, nextResolve) {
  if(specifier==='three')return {url:new URL('../dist/vendor/three.module.js',import.meta.url).href,shortCircuit:true};
  return nextResolve(specifier,context);
}
