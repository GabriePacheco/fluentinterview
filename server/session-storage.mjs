import fs from 'node:fs';import path from 'node:path';
export class LocalSessionStorage{
 constructor(directory){this.file=path.join(directory,'sessions.json');this.values=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{};this.queue=Promise.resolve()}
 async get(key){return structuredClone(this.values[key])}
 async transaction(fn){
  const task=this.queue.then(async()=>{const next=structuredClone(this.values);const result=await fn({get:async key=>structuredClone(next[key]),put:async(key,value)=>{next[key]=structuredClone(value)},delete:async key=>{delete next[key]}});fs.writeFileSync(this.file+'.tmp',JSON.stringify(next),{flush:true});fs.renameSync(this.file+'.tmp',this.file);this.values=next;return result});
  this.queue=task.catch(()=>{});return task;
 }
}
