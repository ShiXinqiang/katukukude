const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,deps,extra={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>deps[n]||require(n),console,URL,Response,Request,ReadableStream,TextEncoder,Date,...extra});return exports}
(async()=>{
 let allowed=true,active=true,duplicate=false,count=0,calls=[],self=false;
 const query=async(sql,p)=>{calls.push({sql,p});if(/^(BEGIN|COMMIT|ROLLBACK)/.test(sql))return{rows:[]};if(sql.includes('FOR UPDATE OF c'))return{rows:allowed?[{id:'thread',status:active?'active':'paused'}]:[]};if(sql.startsWith('SELECT c.*'))return{rows:allowed?[{id:'thread',buyer_id:'buyer',seller_id:'seller',store:'测试店铺',store_status:'active',buyer_name:'买家',context:{kind:'order'},buyer_read_seq:0,seller_read_seq:0}]:[]};if(sql.startsWith('SELECT p.id')||sql.startsWith('SELECT o.id'))return{rows:allowed?[{id:'product',merchant_id:'store',seller_id:self?'buyer':'seller',context:{kind:'product',title:'商品'}}]:[]};if(sql.includes('client_nonce=$3'))return{rows:duplicate?[{id:'prior',seq:'9'}]:[]};if(sql.includes('count(*)::int AS count'))return{rows:[{count}]};if(sql.startsWith('INSERT INTO shop_conversations'))return{rows:[{id:'thread'}]};if(sql.startsWith('INSERT INTO shop_messages'))return{rows:[{id:'message',seq:'10',content:p[4]}]};return{rows:[]}};
 const client={query,release(){}},db={query,connect:async()=>client};const service=load('lib/conversations.ts',{'./merchant':{ensureMerchantSchema:async()=>db}});
 await assert.rejects(service.openConversation('buyer',{userId:'someone'}),/商品或本人订单/);self=true;await assert.rejects(service.openConversation('buyer',{productId:'p'}),/自己的店铺/);self=false;allowed=false;await assert.rejects(service.openConversation('buyer',{orderId:'other-order'}));assert.ok(calls.at(-1).sql.includes('o.user_id=$2'));allowed=true;
 assert.equal((await service.openConversation('buyer',{productId:'p'})).id,'thread');assert.ok(calls.at(-1).sql.includes('ON CONFLICT(buyer_id,merchant_id) WHERE merged_into IS NULL'));
 allowed=false;await assert.rejects(service.readMessages('intruder','thread'),/无权/);allowed=true;
 const body={content:'请问这笔订单什么时候发货？',nonce:'12345678-1234-1234-1234-123456789012'};
 allowed=false;await assert.rejects(service.sendMessage('intruder','thread',body),/无权/);allowed=true;active=false;await assert.rejects(service.sendMessage('buyer','thread',body),/暂停/);active=true;
 calls=[];await service.sendMessage('buyer','thread',body);assert.ok(calls.some(c=>c.sql.includes('FOR UPDATE OF c')));assert.ok(calls.find(c=>c.sql.startsWith('INSERT INTO shop_messages')).p.includes(body.content));
 duplicate=true;calls=[];assert.equal((await service.sendMessage('buyer','thread',body)).id,'prior');assert.ok(!calls.some(c=>c.sql.startsWith('INSERT')));duplicate=false;count=30;await assert.rejects(service.sendMessage('buyer','thread',body),/频繁/);count=0;
 await assert.rejects(service.sendMessage('buyer','thread',{...body,content:''}));assert.throws(()=>service.cursor('-1'));
 calls=[];await service.markConversationRead('buyer','thread','10');assert.ok(calls.at(-1).sql.includes('buyer_read_seq=GREATEST'));assert.ok(calls.at(-1).sql.includes('conversation_id=$1 AND seq<='));
 await service.markConversationRead('seller','thread','10');assert.ok(calls.at(-1).sql.includes('seller_read_seq=GREATEST'));
 await service.listConversations('seller','merchant',2);assert.ok(calls.at(-1).sql.includes('m.user_id=$1'));assert.equal(calls.at(-1).p[1],30);
 // Exercise the actual event-stream route with controlled authentication and scheduler.
 let ticks=[],authenticated=true,seenCursor;
 const streamService={...service,readMessages:async(_u,_id,after)=>{seenCursor=after;return {messages:[{id:'x',seq:'11',content:'回复'}],hasMore:false,title:'店铺',context:{},canSend:true,peerReadSeq:'0'}}};
 const deps={'../../../../../lib/auth':{getCurrentUser:async()=>authenticated?{id:'buyer'}:null},'../../../../../lib/conversations':streamService,'../../../../../lib/chat-response':{chatFailure:e=>new Response(e.message,{status:e.status||503})}};
 const events=load('app/api/conversations/[id]/events/route.ts',deps,{setTimeout:f=>(ticks.push(f),ticks.length),clearTimeout(){}});
 const abort=new AbortController();const r=await events.GET(new Request('https://test.example/events?after=2',{headers:{'last-event-id':'10'},signal:abort.signal}),{params:{id:'thread'}});assert.equal(r.headers.get('Content-Type'),'text/event-stream');assert.equal(seenCursor,'10');const reader=r.body.getReader();assert.match(new TextDecoder().decode((await reader.read()).value),/event: messages/);
 authenticated=false;await ticks.shift()();assert.match(new TextDecoder().decode((await reader.read()).value),/event: accessError/);assert.equal((await reader.read()).done,true);
 const denied=await events.GET(new Request('https://test.example/events'),{params:{id:'thread'}});assert.equal(denied.status,401);
 console.log('PASS: buyer/store scope, own-order entry, no user DMs, self-chat rejection, transaction ordering, retry idempotency, rate cap, read receipts, SSE cursor/revocation/closure. Isolated DB/auth.');
})().catch(e=>{console.error(e);process.exitCode=1});
