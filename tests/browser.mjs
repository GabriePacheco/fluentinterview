import {createRequire} from 'node:module';
import fs from 'node:fs';import path from 'node:path';
import assert from 'node:assert/strict';
import {createApplication} from '../server/index.mjs';
const {chromium,executablePath}=await import('./browser-runtime.mjs');
fs.mkdirSync('qa',{recursive:true});
const app=createApplication({directory:'.local/browser-test',emulator:true,mode:'mock',budgetUsd:0});await app.listen(0);
const base=`http://127.0.0.1:${app.server.address().port}`;
const browser=await chromium.launch({executablePath,headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
const unique=Date.now(),email=`learner-${unique}@example.invalid`,password='Test-only-strong-753!';
try{
 await page.goto(base);await page.getByRole('button',{name:'Entrar a mi espacio'}).waitFor();checks.push('Logged-out routes require login');
 await page.screenshot({path:'qa/day1-login-desktop.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await page.locator('[name=name]').fill('Alicia');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Crear mi cuenta'}).click();
 await page.getByRole('heading',{name:'Vamos paso a paso, Alicia.'}).waitFor();checks.push('Register and create private profile');
 await page.evaluate(()=>location.hash='/perfil');await page.locator('[name=role]').fill('Data Analyst');await page.locator('[name=experience]').fill('Experiencia privada de Alicia.');await page.getByRole('button',{name:'Guardar mi objetivo'}).click();await page.getByText('Tu objetivo se guardó en tu cuenta.').waitFor();
 await page.reload();await page.locator('[name=role]').waitFor();assert.equal(await page.locator('[name=role]').inputValue(),'Data Analyst');checks.push('Cloud profile persists after reload');
 await page.locator('[data-account=logout]').first().click();await page.getByRole('button',{name:'Entrar a mi espacio'}).waitFor();
 await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill('Wrong-password-753');await page.getByRole('button',{name:'Entrar a mi espacio'}).click();await page.locator('#account-error').filter({hasText:'no son correctos'}).waitFor();checks.push('Invalid credentials show useful error');
 await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await page.locator('[name=name]').fill('Bruno');await page.locator('[name=email]').fill(`second-${unique}@example.invalid`);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Crear mi cuenta'}).click();await page.locator('[name=role]').waitFor();assert.equal(await page.locator('[name=role]').inputValue(),'');assert.equal(await page.locator('[name=experience]').inputValue(),'');checks.push('Second account never inherits first profile');
 await page.locator('[data-account=logout]').first().click();await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Entrar a mi espacio'}).click();await page.locator('[name=role]').waitFor();assert.equal(await page.locator('[name=role]').inputValue(),'Data Analyst');checks.push('Login restores the right account');
 await page.evaluate(()=>location.hash='/inicio');await page.getByRole('heading',{name:'Vamos paso a paso, Alicia.'}).waitFor();await page.screenshot({path:'qa/day1-home-desktop.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});for(const route of ['inicio','perfil','progreso','planes']){await page.evaluate(r=>location.hash='/'+r,route);await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow: ${route}`)}checks.push('Mobile layout has no horizontal overflow');
 await page.screenshot({path:'qa/day1-mobile.png',fullPage:true});await page.locator('[data-account=logout]').first().click();await page.getByRole('button',{name:'Olvidé mi contraseña'}).click();await page.locator('[name=email]').fill(email);await page.getByRole('button',{name:'Enviar enlace'}).click();await page.getByText('Si este correo tiene una cuenta, recibirás un enlace para recuperar el acceso.').waitFor();
 const oob=await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-fluentinterview/oobCodes').then(r=>r.json());assert.ok(oob.oobCodes.some(x=>x.email===email&&x.requestType==='PASSWORD_RESET'));checks.push('Password reset generated in emulator, no real email sent');
 assert.deepEqual(errors,[]);fs.writeFileSync('qa/day1-browser.json',JSON.stringify({checks,errors,mode:'Firebase emulators; no paid API'},null,2));console.log(JSON.stringify({checks,errors}));
}finally{await browser.close();await app.close()}
