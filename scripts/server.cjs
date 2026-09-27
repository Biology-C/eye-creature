const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.png':'image/png','.md':'text/plain'};
function createServer(){return http.createServer((req,res)=>{let rel;try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
 if(rel.startsWith('/eye-creature/'))rel=rel.slice('/eye-creature'.length);
 let file=path.resolve(root,'.'+rel);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)})})}
module.exports={createServer};if(require.main===module)createServer().listen(Number(process.env.PORT||8768),'127.0.0.1',()=>console.log('Eye Creature: http://127.0.0.1:'+(process.env.PORT||8768)));
