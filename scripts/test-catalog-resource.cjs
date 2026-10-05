const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
let effects=[],timers=[],pending=[],updates=[],overrideSnapshot;
const react={useState:f=>[overrideSnapshot||f(),v=>updates.push(v)],useEffect:f=>effects.push(f)};
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/use-catalog-resource.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsObject,require:()=>react,AbortController,setTimeout:f=>(timers.push(f),timers.length),clearTimeout(){},fetch:(url,opts)=>new Promise(resolve=>pending.push({url,opts,resolve}))});
const mount=url=>{effects=[];const initial=exportsObject.useCatalogResource(url);const cleanup=effects[0]();timers.shift()();return{initial,cleanup}};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
(async()=>{
 const first=mount('/api/catalog?q=a');assert.equal(first.initial.loading,true);pending.shift().resolve({ok:true,json:async()=>({products:[{id:'a'}]})});await flush();first.cleanup();
 overrideSnapshot={url:'/api/catalog?q=other',data:undefined,loading:false,error:''};
 const switched=exportsObject.useCatalogResource('/api/catalog?q=a');assert.equal(switched.loading,false,'cached category must not flash loading on the first render after switching');assert.equal(switched.data.products[0].id,'a');overrideSnapshot=undefined;
 const back=mount('/api/catalog?q=a');assert.equal(back.initial.loading,false);assert.equal(back.initial.data.products[0].id,'a');pending.shift().resolve({ok:true,json:async()=>({products:[]})});await flush();assert.equal(updates.at(-1).data.products.length,0,'revalidation removes archived item');back.cleanup();
 const abandoned=mount('/api/catalog?q=old');const old=pending.shift();abandoned.cleanup();const count=updates.length;old.resolve({ok:true,json:async()=>({products:[{id:'old'}]})});await flush();assert.equal(updates.length,count,'aborted response cannot overwrite next screen');
 const failure=mount('/api/catalog?q=error');pending.shift().resolve({ok:false});await flush();assert.ok(updates.at(-1).error);assert.equal(updates.at(-1).loading,false);failure.cleanup();
 console.log('PASS: cached return without skeleton, live revalidation, stale-response isolation, explicit network error. Mock fetch, not live UI.');
})().catch(e=>{console.error(e);process.exitCode=1});
