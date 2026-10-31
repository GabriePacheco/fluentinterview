// Read the existing private key in memory. Never echo it or place it in argv.
import fs from 'node:fs';import {parseEnv} from 'node:util';import {spawn} from 'node:child_process';
const file=process.argv[2];if(!file)throw Error('Indica el archivo privado que contiene la clave.');
const config=parseEnv(fs.readFileSync(file,'utf8'));
const key=config.OPENAI_API_KEY||config.VITE_OPENAI_API_KEY;
if(!/^sk-[A-Za-z0-9_-]{20,}$/.test(key||''))throw Error('No se encontró una clave válida en el archivo.');
const check=await fetch('https://api.openai.com/v1/models/gpt-4.1-mini-2025-04-14',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
if(!check.ok){console.log(JSON.stringify({keyCheckStatus:check.status,installed:false}));process.exit(1)}
console.log('Clave aceptada para consultar el modelo. Esta comprobación no genera texto ni valida el saldo.');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','put','OPENAI_API_KEY'],{stdio:['pipe','pipe','pipe'],env:{...process.env,NODE_USE_SYSTEM_CA:'1',WRANGLER_SEND_METRICS:'false'}});
let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);child.stdin.end(key+'\n');
const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});
// Only output a status; tool diagnostics may contain sensitive data.
console.log(JSON.stringify({secretInstalled:code===0,exitCode:code}));process.exitCode=code||0;
