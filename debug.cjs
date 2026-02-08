// debug.cjs
const { createRequire } = require('module');
const requireModule = createRequire(__filename);

console.log('require.resolve →', requireModule.resolve('svg-path-simplify'));

(async () => {
  const mod = await import('svg-path-simplify');  // dynamic import works in CJS
  console.log('imported keys →', Object.keys(mod));
  console.log('default keys →', mod.default && Object.keys(mod.default));
})();
