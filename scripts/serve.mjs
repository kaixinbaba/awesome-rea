import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
const headers = (await readFile('dist/_headers','utf8')).split('\n').filter(l=>l.startsWith('  ')).map(l=>{const n=l.indexOf(':');return [l.slice(2,n),l.slice(n+1).trim()];});
const server=createServer(async (req,res)=>{
  try {
    let path;
    try { path = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    let file=resolve(root,`.${path}`);
    if (!file.startsWith(root+sep) && file!==root) {res.writeHead(403).end();return;}
    let status=200;
    try {if ((await stat(file)).isDirectory()) file=resolve(file,'index.html');await stat(file);} catch {file=resolve(root,path.startsWith('/zh/')?'zh/404.html':'404.html');status=404;}
    const data=await readFile(file);
    res.writeHead(status,{...Object.fromEntries(headers),'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:data);
  } catch { res.writeHead(500).end(); }
});
server.listen(Number(process.env.PORT||4387),'127.0.0.1',()=>console.log('Static preview: http://127.0.0.1:'+(process.env.PORT||4387)));
