import fs from 'node:fs';
import path from 'node:path';

// Deliberately over-reserves every request; unknown failures are never refunded.
// This is an application allowance, not a provider/account billing limit.
export const RESERVATION_MICRO_USD=50_000;
export class BudgetLedger {
  constructor(directory,limitUsd=0){
    if(!Number.isFinite(limitUsd)||limitUsd<0||limitUsd>6)throw new Error('AI_BUDGET_USD debe estar entre 0 y 6.00.');
    fs.mkdirSync(directory,{recursive:true});
    this.file=path.join(directory,'budget.json');this.lock=path.join(directory,'budget.lock');
    this.limit=Math.floor(limitUsd*1e6);
    try{fs.mkdirSync(this.lock)}catch{throw new Error('Otro servidor usa este presupuesto, o quedó un bloqueo tras un cierre inesperado. Revisa .local/budget.lock antes de reiniciar.')}
    try{
      this.data=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{reserved:0,attempts:0,usageEstimate:0};
      if(!Number.isSafeInteger(this.data.reserved)||this.data.reserved<0||!Number.isSafeInteger(this.data.attempts)||this.data.attempts<0||!Number.isFinite(this.data.usageEstimate)||this.data.usageEstimate<0)throw new Error('El registro de presupuesto no es válido. No se harán llamadas.');
    }catch(error){this.close();throw error}
  }
  write(){const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify(this.data),{flush:true});fs.renameSync(temp,this.file)}
  reserve(){
    if(this.data.reserved+RESERVATION_MICRO_USD>this.limit){const error=new Error('Límite local de pruebas alcanzado. No se realizó la llamada.');error.status=402;throw error}
    this.data.reserved+=RESERVATION_MICRO_USD;this.data.attempts++;this.write();
  }
  recordUsage(usage){
    if(!Number.isInteger(usage?.prompt_tokens)||!Number.isInteger(usage?.completion_tokens)||usage.prompt_tokens<0||usage.completion_tokens<0)return;
    // USD/million tokens, verified 2026-10-17. Ignore caching discounts conservatively.
    this.data.usageEstimate+=(usage.prompt_tokens*.40+usage.completion_tokens*1.60)/1e6;
    this.write();
  }
  snapshot(){return {limitUsd:this.limit/1e6,reservedUsd:this.data.reserved/1e6,estimatedUsageUsd:this.data.usageEstimate,attempts:this.data.attempts,reservationPerCallUsd:.05,remainingCalls:Math.max(0,Math.floor((this.limit-this.data.reserved)/RESERVATION_MICRO_USD))}}
  close(){if(fs.existsSync(this.lock))fs.rmdirSync(this.lock)}
}
