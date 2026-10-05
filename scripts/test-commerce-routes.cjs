const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(path,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>n in deps?deps[n]:require(n),Request,Response,console});return exports;}
class NextResponse extends Response{static json(x,init){return new NextResponse(JSON.stringify(x),init);}}
const next={'next/server':{NextResponse}},clean=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'',rules=load('lib/order-rules.ts');
const request=x=>new Request('https://test.example/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});
(async()=>{
 let rows=[{id:'a',price:'1200',stock:5,merchant_id:'m',shipping_fee:'500',free_shipping:false},{id:'b',price:'2000',stock:5,merchant_id:'m',shipping_fee:'0',free_shipping:true}];
 const quote=load('app/api/orders/quote/route.ts',{...next,'../../../../lib/merchant':{ensureMerchantSchema:async()=>({query:async()=>({rows})})},'../../../../lib/order-rules':rules});
 const q=await quote.POST(request({items:[{id:'a::x',quantity:2},{id:'b::x',quantity:1}]}));assert.equal(q.status,200);assert.deepEqual(await q.json(),{subtotal:4400,shipping:500,total:4900});
 rows[1].merchant_id='m2';rows[1].free_shipping=false;rows[1].shipping_fee='300';assert.equal((await (await quote.POST(request({items:[{id:'a',quantity:2},{id:'b',quantity:1}]}))).json()).total,5200);
 rows[0].stock=1;assert.equal((await quote.POST(request({items:[{id:'a',quantity:2},{id:'b',quantity:1}]}))).status,400);
 let user={id:'ordinary-test-user',role:'user'},existing=[],documents=[{id:'p1',kind:'store_photo'},{id:'p2',kind:'store_photo'},{id:'v',kind:'store_video'}],savedValues;
 const stamp=new Date('2026-10-05T00:00:00Z');
 const db={query:async(sql,args)=>{if(sql.startsWith('SELECT id, kind')){assert.equal(args[0],user.id);return{rows:documents}}if(sql.startsWith('SELECT id, status'))return{rows:existing};if(sql.includes('INSERT INTO merchant_applications')){assert.ok(sql.includes("WHERE merchant_applications.status = 'rejected'"));savedValues=args;return{rows:[{id:'app',status:'pending',documentIds:['p1','p2','v'],submittedAt:stamp,updatedAt:stamp,reviewedAt:null}]}}return{rows:[]}}};
 const app=load('app/api/merchant/application/route.ts',{...next,'../../../../lib/auth':{getCurrentUser:async()=>user},'../../../../lib/merchant':{cleanText:clean,cleanOptionalText:(v,m)=>clean(v,m)||null,createCommerceId:()=> 'app',ensureMerchantSchema:async()=>db}});
 const form={storeNameCn:'测试店铺',phone:'13800000000',businessType:'超市',stateRegion:'仰光',city:'仰光',township:'市中心',address:'测试地址',description:'仅供接口测试的店铺资料说明',locationLat:'',locationLng:'',documentIds:['p1','p2','v']};
 assert.equal((await app.POST(request(form))).status,201);assert.equal(savedValues[14],null);assert.equal(savedValues[15],null);
 existing=[{id:'app',status:'pending'}];assert.equal((await app.POST(request(form))).status,409);
 existing=[{id:'app',status:'approved'}];assert.equal((await app.POST(request(form))).status,409);
 existing=[{id:'app',status:'rejected'}];assert.equal((await app.POST(request(form))).status,200);
 assert.equal((await app.POST(request({...form,description:'短'}))).status,400);
 documents=[];assert.equal((await app.POST(request(form))).status,400);user=null;assert.equal((await app.POST(request(form))).status,401);
 let admin=true,order={id:'o',orderNo:'TEST',userId:'u',status:'pending',paymentStatus:'unpaid',totalAmount:'2900',createdAt:stamp,updatedAt:stamp},updates=0,notifications=0;
 const client={query:async(sql,args)=>{if(sql.includes('FROM orders'))return{rows:[order]};if(sql.includes('UPDATE orders')){updates++;order={...order,status:'paid',paymentStatus:'paid',paidAmount:args[1]};return{rows:[order]}}if(sql.includes('INSERT INTO notifications'))notifications++;return{rows:[]}},release(){}};
 const payment=load('app/api/admin/orders/[id]/payment/route.ts',{...next,'../../../../../../lib/admin':{getCurrentAdmin:async()=>admin?{id:'admin'}:null,ensureAdminSchema:async()=>({connect:async()=>client})}});
 const pay=amount=>payment.POST(request({amount,transactionId:'TEST-ONLY'}),{params:{id:'o'}});
 assert.equal((await pay(2800)).status,400);assert.equal(updates,0);assert.equal((await pay(2900)).status,200);assert.equal(order.status,'paid');assert.equal(notifications,1);assert.equal((await pay(2900)).status,200);assert.equal(updates,1);assert.equal(notifications,1);
 order={...order,status:'cancelled',paymentStatus:'unpaid'};assert.equal((await pay(2900)).status,409);admin=false;assert.equal((await pay(2900)).status,401);
 console.log('PASS: quote fees/stock; ordinary-user application submit/reject-resubmit/locks/proof ownership/missing coordinates; payment amount/auth/idempotency/cancellation guards. All database and authentication are mocked; no real payment.');
})().catch(e=>{console.error(e);process.exitCode=1});
