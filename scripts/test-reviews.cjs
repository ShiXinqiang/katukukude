const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>deps[n]||require(n),URL,console});return exports}
(async()=>{
 let user=null,calls=[],insertAllowed=false,merchantError=false;
 const db={query:async(sql,params)=>{calls.push({sql,params});return {rows:sql.startsWith('INSERT')?(insertAllowed?[{id:'review'}]:[]):sql.includes('count(*)')?[{total:0,average:null}]:[]}}};
 const merchant={ensureMerchantSchema:async()=>db,requireMerchant:async()=>{if(merchantError)throw Error('MERCHANT_REQUIRED');return {merchant:{id:'store'}}},isMerchantRequiredError:e=>e.message==='MERCHANT_REQUIRED'};
 const route=load('app/api/reviews/route.ts',{'../../../lib/auth':{getCurrentUser:async()=>user},'../../../lib/merchant':merchant});
 const get=q=>route.GET(new Request('https://test.example/api/reviews?'+q));
 assert.equal((await get('mine=true')).status,401);assert.equal((await get('productId=p&page=0')).status,400);
 user={id:'buyer',role:'user'};await get('mine=true');assert.ok(calls.some(c=>c.sql.includes('WHERE user_id=$1')&&c.params[0]==='buyer'));assert.ok(calls.some(c=>c.sql.includes("o.status='completed'")&&c.sql.includes("o.payment_status='paid'")));
 calls=[];const publicBody=await (await get('productId=p')).json();assert.equal(publicBody.total,0);assert.ok(calls[0].sql.includes('product_id=$1'));assert.ok(!calls[0].sql.includes('SELECT *'),'public response excludes purchaser identity');
 const post=b=>route.POST(new Request('https://test.example/api/reviews',{method:'POST',body:JSON.stringify(b)}));
 const valid={orderId:'order',productId:'p',rating:4,content:'这是实际购买后的使用评价'};
 assert.equal((await post({...valid,rating:6})).status,400);assert.equal((await post(valid)).status,409);insertAllowed=true;assert.equal((await post(valid)).status,201);
 const insertion=calls.find(c=>c.sql.startsWith('INSERT'));assert.ok(insertion.sql.includes('o.user_id=$6'));assert.ok(insertion.sql.includes('ON CONFLICT(order_id,product_id) DO NOTHING'));assert.equal(insertion.params[5],'buyer');
 const after=load('app/api/after-sales/route.ts',{'../../../lib/auth':{getCurrentUser:async()=>user},'../../../lib/merchant':merchant,'../../../lib/after-sales':{}});
 assert.equal((await after.GET(new Request('https://test.example/api/after-sales?mode=admin'))).status,403);
 merchantError=true;assert.equal((await after.GET(new Request('https://test.example/api/after-sales?mode=merchant'))).status,403);
 user={id:'admin',role:'admin'};const r=await after.GET(new Request('https://test.example/api/after-sales?mode=admin'));assert.equal(r.status,200);
 // Concurrent requests share one schema initialization; a failed initialization can retry.
 let attempts=0,release,fail=true;const schema=load('lib/admin.ts',{'./auth':{ensureAuthSchema:async()=>({query:()=>{attempts++;return new Promise((resolve,reject)=>{release=()=>fail?reject(Error('temporary')):resolve()})}})}});
 const a=schema.ensureAdminSchema(),b=schema.ensureAdminSchema();assert.equal(a,b);await new Promise(resolve=>setImmediate(resolve));assert.equal(attempts,1);release();await assert.rejects(a);fail=false;const c=schema.ensureAdminSchema();await new Promise(resolve=>setImmediate(resolve));release();await c;await schema.ensureAdminSchema();assert.equal(attempts,2);
 console.log('PASS: review ownership, completed/paid eligibility, validation, duplicate guard, private/public scope; after-sales role errors; single-flight schema setup and retry. Mock DB.');
})().catch(e=>{console.error(e);process.exitCode=1});
