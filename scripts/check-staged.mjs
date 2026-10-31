import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const names=git('diff','--cached','--name-only','--diff-filter=ACMR','-z').toString().split('\0').filter(Boolean);
const privatePath=/(^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|\.local|\.firebase|\.wrangler|node_modules|qa|storage-export)(?:\/|$)|(?:^|\/)(?:credentials[^/]*|service-account[^/]*|serviceAccount[^/]*|[^/]*-firebase-adminsdk-[^/]*)\.json$|\.(?:pem|key|p12|pfx|sqlite|db|bundle)$|(?:^|\/)sessions\.json$/i;
const patterns=[
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
 ['OpenAI credential',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/],
 ['payment credential',/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/],
 ['GitHub credential',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
 ['JWT credential',/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{16,}\b/]
];
// Also reject exact private values configured locally; never print their values.
const localSecrets=[];
for(const file of ['.env','.env.lemon.local','.dev.vars']){
 if(!fs.existsSync(file))continue;
 for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);if(!m||!/KEY|TOKEN|SECRET|PASSWORD/.test(m[1])||/FIREBASE|PUBLIC/.test(m[1]))continue;
  const value=m[2].replace(/^(['"])(.*)\1$/,'$2');if(value.length>=12&&!/^(?:example|fixture|replace|your[_-]|<)/i.test(value))localSecrets.push(value);
 }
}
const failures=[];
for(const name of names){
 if(privatePath.test(name)&&name!=='.env.example'){failures.push([name,'private file']);continue}
 const bytes=git('show',':'+name);
 if(bytes.length>5*1024*1024){failures.push([name,'file exceeds 5 MiB']);continue}
 if(bytes.includes(0))continue;
 const content=bytes.toString('utf8');
 for(const [label,pattern] of patterns)if(pattern.test(content))failures.push([name,label]);
 if(localSecrets.some(value=>content.includes(value)))failures.push([name,'local secret value']);
}
if(failures.length){console.error('Commit bloqueado. Revisa estos archivos; no se muestran credenciales:');for(const [name,reason] of failures)console.error(`- ${name}: ${reason}`);process.exitCode=1}
else console.log(`Índice revisado: ${names.length} archivos; sin credenciales detectadas.`);
