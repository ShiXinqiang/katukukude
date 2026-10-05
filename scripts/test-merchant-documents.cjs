// Real database-readback fixture bytes; auth and database are isolated mocks.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
const {File}=require('node:buffer');
const fixtures=JSON.parse(fs.readFileSync('scripts/fixtures/merchant-proof.json','utf8'));
function load(path,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>{if(n in deps)return deps[n];throw Error(n)},Request,Response,File,Buffer,Uint8Array,URL,console});return exports;}
class NextResponse extends Response{static json(x,init){return new NextResponse(JSON.stringify(x),init);}}
let user={id:'fixture-owner',role:'user'},count=0,inserted,record;
const db={query:async(sql,args)=>{
 if(sql.includes('COUNT(*)'))return{rows:[{count:String(count)}]};
 if(sql.includes('INSERT INTO merchant_application_documents')){inserted=args;return{rows:[]}};
 if(sql.startsWith('SELECT user_id'))return{rows:record?[record]:[]};
 throw Error('Unexpected SQL');
}};
const deps={'next/server':{NextResponse},'../../../../../lib/auth':{getCurrentUser:async()=>user},'../../../../../lib/merchant':{ensureMerchantSchema:async()=>db,createCommerceId:()=> 'fixture-document'}};
const post=load('app/api/merchant/application/documents/route.ts',deps).POST;
const get=load('app/api/merchant/application/documents/[id]/route.ts',{'next/server':{NextResponse},'../../../../../../lib/auth':deps['../../../../../lib/auth'],'../../../../../../lib/merchant':deps['../../../../../lib/merchant']}).GET;
function request(bytes,type,kind,name='fixture.bin'){
 const boundary='fixture-boundary';const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\n${kind}\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${type}\r\n\r\n`),bytes,Buffer.from(`\r\n--${boundary}--\r\n`)]);
 return new Request('https://test.invalid/api/merchant/application/documents',{method:'POST',headers:{'content-type':`multipart/form-data; boundary=${boundary}`},body});
}
(async()=>{
 for(const f of fixtures){
  const bytes=Buffer.from(f.payload,'base64');assert.equal(bytes.length,f.file_size);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);
  const response=await post(request(bytes,f.mime_type,f.kind,f.file_name));assert.equal(response.status,201);assert.equal(inserted[1],user.id);assert.equal(Buffer.compare(inserted[6],bytes),0);
  record={user_id:user.id,file_name:f.file_name,mime_type:f.mime_type,content:bytes};
  const result=await get(new Request('https://test.invalid'),{params:{id:f.id}});assert.equal(result.status,200);assert.equal(result.headers.get('content-type'),f.mime_type);assert.equal(result.headers.get('cache-control'),'private, no-store');assert.equal(Buffer.compare(Buffer.from(await result.arrayBuffer()),bytes),0);
 }
 assert.equal((await post(request(Buffer.from('x'),'text/plain','store_photo'))).status,400);
 assert.equal((await post(request(Buffer.alloc(0),'image/jpeg','store_photo'))).status,400);
 assert.equal((await post(request(Buffer.alloc(8*1024*1024+1),'image/jpeg','store_photo'))).status,400);
 assert.equal((await post(request(Buffer.alloc(30*1024*1024+1),'video/mp4','store_video'))).status,400);
 count=1;assert.equal((await post(request(Buffer.from('x'),'video/mp4','store_video'))).status,409);
 count=4;assert.equal((await post(request(Buffer.from('x'),'image/jpeg','store_photo'))).status,409);
 user={id:'other-user',role:'user'};assert.equal((await get(new Request('https://test.invalid'),{params:{id:'test'}})).status,404);
 user={id:'admin',role:'admin'};assert.equal((await get(new Request('https://test.invalid'),{params:{id:'test'}})).status,200);
 user=null;assert.equal((await get(new Request('https://test.invalid'),{params:{id:'test'}})).status,401);assert.equal((await post(request(Buffer.from('x'),'image/jpeg','store_photo'))).status,401);
 console.log('PASS: 3 DB-readback fixtures, POST/GET byte fidelity, MIME/empty/size/quota guards, owner/admin/private-cache rules, unauthenticated and cross-user denial. Route auth/database mocked; no browser upload claim.');
})().catch(e=>{console.error(e);process.exitCode=1});
