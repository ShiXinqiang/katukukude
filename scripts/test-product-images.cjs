// Route contract tests with mocked authentication/database; no production writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {File}=require('node:buffer');
function load(path,deps={}){
 const module={exports:{}};
 const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(js,{exports:module.exports,module,require:name=>{if(name in deps)return deps[name];throw Error(name)},Request,Response,File,Buffer,Uint8Array,URL,console});return module.exports;
}
class NextResponse extends Response{static json(body,init){return new NextResponse(JSON.stringify(body),{...init,headers:{'content-type':'application/json'}});}}
const {imageUrls}=load('lib/product-images.ts');
const long='https://example.com/'+ 'a'.repeat(130)+'.jpg';
assert.equal(imageUrls([long])[0],long,'preserve full image URL');
assert.equal(imageUrls(['javascript:alert(1)','http://example.com/a','data:image/png;base64,x','//example.com/a','https://user:pass@example.com/a']).length,0);
assert.equal(imageUrls([long,long]).length,1);
assert.equal(imageUrls(['https://example.com/'+ 'a'.repeat(2048)]).length,0);
assert.equal(imageUrls(['/api/product-images/12345678-1234-1234-1234-123456789abc']).length,1);
let allowed=true,count=0,queries=[];
const client={query:async(sql,args)=>{queries.push({sql,args});return{rows:sql.includes('COUNT(*)')?[{n:count}]:[]}},release(){}};
const merchant={requireMerchant:async()=>{if(!allowed)throw Error('MERCHANT_REQUIRED');return{merchant:{id:'merchant-1'}}},isMerchantRequiredError:e=>e.message==='MERCHANT_REQUIRED',ensureMerchantSchema:async()=>({connect:async()=>client}),createCommerceId:()=> '12345678-1234-1234-1234-123456789abc'};
const {POST}=load('app/api/merchant/product-images/route.ts',{'next/server':{NextResponse},'../../../../lib/merchant':merchant});
function upload(bytes,type='image/png'){
 const boundary='katu-test-boundary';
 const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: ${type}\r\n\r\n`),Buffer.from(bytes),Buffer.from(`\r\n--${boundary}--\r\n`)]);
 return new Request('https://example.com/api/merchant/product-images',{method:'POST',headers:{'content-type':`multipart/form-data; boundary=${boundary}`},body});
}
(async()=>{
 allowed=false;assert.equal((await POST(upload('bad'))).status,403);assert.equal(queries.length,0);
 allowed=true;assert.equal((await POST(upload('not an image'))).status,400);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=','base64');
 assert.equal((await POST(upload(png,'image/jpeg'))).status,400,'reject MIME mismatch');
 assert.equal((await POST(upload(Buffer.alloc(5*1024*1024+20000)))).status,413,'bound multipart body');
 const result=await POST(upload(png));assert.equal(result.status,201);assert.equal((await result.json()).url,'/api/product-images/12345678-1234-1234-1234-123456789abc');
 const insert=queries.find(q=>q.sql.startsWith('INSERT'));assert.ok(insert.args[5].equals(png),'persist exact uploaded bytes');assert.ok(queries.some(q=>q.sql==='COMMIT'));
 count=200;queries=[];assert.equal((await POST(upload(png))).status,400);assert.ok(queries.some(q=>q.sql==='ROLLBACK'));assert.ok(!queries.some(q=>q.sql.startsWith('INSERT')));
 let user=null,file={mime_type:'image/png',content:png,user_id:'owner',public:false};
 const {GET}=load('app/api/product-images/[id]/route.ts',{'next/server':{NextResponse},'../../../../lib/auth':{getCurrentUser:async()=>user},'../../../../lib/merchant':{ensureMerchantSchema:async()=>({query:async()=>({rows:file?[file]:[]})})}});
 const get=()=>GET(new Request('https://example.com/api/product-images/id'),{params:{id:'id'}});
 assert.equal((await get()).status,404,'draft image hidden from anonymous visitor');user={id:'other',role:'user'};assert.equal((await get()).status,404);
 user={id:'owner',role:'merchant'};assert.equal((await get()).status,200);user={id:'admin',role:'admin'};assert.equal((await get()).status,200);
 user=null;file.public=true;const publicImage=await get();assert.equal(publicImage.status,200);assert.equal(publicImage.headers.get('x-content-type-options'),'nosniff');assert.ok(Buffer.from(await publicImage.arrayBuffer()).equals(png));
 file=null;assert.equal((await get()).status,404);
 console.log('PASS: image URL preservation, unsafe URLs, upload auth/type/size/quota/bytes, transaction, draft privacy, owner/admin and public image reads.');
})().catch(e=>{console.error(e);process.exitCode=1});
