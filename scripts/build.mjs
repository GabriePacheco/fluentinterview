import {build} from 'esbuild';
await build({entryPoints:['src/account.js'],bundle:true,outfile:'public/account.bundle.js',format:'iife',target:['chrome110','edge110','safari16'],minify:true,legalComments:'none',sourcemap:false});
console.log('Interfaz de cuentas compilada.');
