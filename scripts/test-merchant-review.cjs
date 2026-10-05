// Exercises real route functions with isolated shared state; no production approval.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(path,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>n in deps?deps[n]:require(n),Request,Response,console:{error(){}},Buffer});return exports;}
class NextResponse extends Response{static json(x,init){return new NextResponse(JSON.stringify(x),init)}}
const next={'next/server':{NextResponse}},clean=(x,m=200)=>typeof x==='string'?x.trim().slice(0,m):'';
const fixture=JSON.parse(fs.readFileSync('scripts/fixtures/merchant-proof.json','utf8'));
const docs=fixture.map(x=>({id:x.id,kind:x.kind,fileName:x.file_name}));
let user={id:'owner',role:'user',status:'active'},admin={id:'admin'},application=null,merchant=null,notifications=[],snapshot,failNotification=false;
const serialized=()=>({...application,userId:application.user_id,documentIds:application.document_ids,submittedAt:new Date(),updatedAt:new Date(),reviewedAt:application.status==='pending'?null:new Date()});
const db={connect:async()=>db,release(){},query:async(sql,args=[])=>{
 if(sql==='BEGIN'){snapshot=structuredClone({user,application,merchant,notifications});return{rows:[]}}
 if(sql==='ROLLBACK'){({user,application,merchant,notifications}=snapshot);return{rows:[]}}
 if(sql==='COMMIT')return{rows:[]};
 if(sql.startsWith('SELECT * FROM merchant_applications'))return{rows:application?[application]:[]};
 if(sql.startsWith('SELECT id, status'))return{rows:application?[application]:[]};
 if(sql.startsWith('SELECT id, user_id'))return{rows:application?[serialized()]:[]};
 if(sql.includes('FROM merchant_application_documents')){
  assert.equal(args[0],'owner');
  if(sql.includes('file_name AS'))assert.ok(sql.includes('application_id IS NULL'),'draft uploads must survive re-entry');
  return{rows:sql.includes('file_name AS')?docs:docs.filter(d=>args[1].includes(d.id))};
 }
 if(sql.includes('INSERT INTO merchant_applications')){
  application={id:args[0],user_id:args[1],store_name_cn:args[2],phone:args[4],business_type:args[8],state_region:args[9],city:args[10],township:args[11],address:args[12],description:args[16],document_ids:JSON.parse(args[17]),status:'pending'};
  return{rows:[serialized()]};
 }
 if(sql.startsWith('UPDATE merchant_application_documents'))return{rows:[]};
 if(sql.includes('UPDATE merchant_applications')){application.status=args[1];application.review_note=args[2];return{rows:[]}}
 if(sql.includes('INSERT INTO merchants')){merchant={user_id:args[1],status:'active'};return{rows:[]}}
 if(sql.startsWith('UPDATE users')){user.role=user.role==='admin'?'admin':'merchant';return{rows:[]}}
 if(sql.includes('INSERT INTO notifications')){if(failNotification)throw Error('injected notification failure');notifications.push(args);return{rows:[]}}
 throw Error('Unexpected query '+sql);
}};
const applicationRoute=load('app/api/merchant/application/route.ts',{...next,'../../../../lib/auth':{getCurrentUser:async()=>user},'../../../../lib/merchant':{cleanText:clean,cleanOptionalText:(x,m)=>clean(x,m)||null,createCommerceId:()=> 'application',ensureMerchantSchema:async()=>db}});
const reviewRoute=load('app/api/admin/merchant-applications/[id]/route.ts',{...next,'../../../../../lib/admin':{getCurrentAdmin:async()=>admin},'../../../../../lib/merchant':{cleanText:clean,ensureMerchantSchema:async()=>db}});
const req=x=>new Request('https://test.invalid',{method:'POST',body:JSON.stringify(x),headers:{'content-type':'application/json'}});
const form={storeNameCn:'测试勿用',phone:'09000000000',businessType:'其他',stateRegion:'仰光',city:'仰光',township:'测试',address:'测试地址不配送',description:'仅供隔离测试的店铺申请资料',documentIds:docs.map(x=>x.id)};
const submit=()=>applicationRoute.POST(req(form));const review=(status,reviewNote='')=>reviewRoute.PATCH(req({status,reviewNote}),{params:{id:'application'}});
(async()=>{
 assert.equal((await (await applicationRoute.GET()).json()).documents.length,3,'load drafts before first submit');
 assert.equal((await submit()).status,201);assert.equal(application.status,'pending');assert.equal((await submit()).status,409);
 assert.equal((await review('rejected')).status,400);assert.equal((await review('rejected','测试驳回原因')).status,200);assert.equal(user.role,'user');assert.equal(merchant,null);
 assert.equal((await (await applicationRoute.GET()).json()).application.status,'rejected');assert.equal((await review('approved')).status,409);
 assert.equal((await submit()).status,200);assert.equal(application.status,'pending');
 const missing=docs.pop();assert.equal((await review('approved')).status,400);docs.push(missing);
 failNotification=true;assert.equal((await review('approved')).status,500);assert.equal(application.status,'pending');assert.equal(user.role,'user');assert.equal(merchant,null);assert.equal(notifications.length,1);failNotification=false;
 assert.equal((await review('approved')).status,200);assert.equal(user.role,'merchant');assert.equal(merchant.status,'active');assert.equal(application.status,'approved');assert.equal(notifications.length,2);
 assert.equal((await review('approved')).status,409);assert.equal(notifications.length,2);assert.equal((await submit()).status,409);
 admin=null;assert.equal((await review('approved')).status,401);
 console.log('PASS: draft recovery → submit → pending lock → rejection/reason → resubmit → missing proof denial → approval rollback → approval/merchant/notification → duplicate and unauthorized denial. Isolated auth/database, no production role changes.');
})().catch(e=>{console.error(e);process.exitCode=1});
