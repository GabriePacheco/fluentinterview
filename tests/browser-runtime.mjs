import {createRequire} from 'node:module';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const require=createRequire(import.meta.url);let playwright;
if(process.env.PLAYWRIGHT_MODULE)playwright=require(process.env.PLAYWRIGHT_MODULE);
else{try{playwright=require('playwright')}catch{const root=path.join(os.homedir(),'AppData/Local/OpenAI/Codex/runtimes/cua_node');for(const folder of fs.readdirSync(root).filter(x=>!x.startsWith('.'))){const candidate=path.join(root,folder,'bin/node_modules/playwright');if(fs.existsSync(candidate)){playwright=require(candidate);break}}}}
if(!playwright)throw Error('Set PLAYWRIGHT_MODULE to the installed Playwright module.');
export const chromium=playwright.chromium;
export const executablePath=process.env.CHROMIUM_PATH||path.join(os.homedir(),'AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe');
