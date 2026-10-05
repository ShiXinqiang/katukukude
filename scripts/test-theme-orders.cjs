const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const layout=fs.readFileSync('app/layout.tsx','utf8');
const script=layout.match(/__html: `([^`]+)`/)[1];
for(const surface of ['dark','light','invalid']){
 const root={dataset:{},style:{setProperty(k,v){this[k]=v}}};
 vm.runInNewContext(script,{document:{documentElement:root},localStorage:{getItem:k=>k.endsWith('surface')?surface:'clear'}});
 assert.equal(root.dataset.katuTheme,surface==='dark'?'dark':'light');
 assert.equal(root.style.backgroundColor,surface==='dark'?'#050506':'#edf0f3');assert.equal(root.style['--katu-glass-alpha'],'.58');
}
const root={dataset:{},style:{setProperty(){}}};vm.runInNewContext(script,{document:{documentElement:root},localStorage:{getItem(){throw Error('blocked')}}});assert.equal(root.dataset.katuTheme,'light');
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/order-rules.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsObject});
const next=exportsObject.nextOrderStatus;
assert.equal(next('pending','unpaid','cancel','customer'),'cancelled');assert.equal(next('paid','paid','accept','merchant'),'processing');assert.equal(next('processing','paid','ship','merchant'),'shipped');assert.equal(next('shipped','paid','complete','customer'),'completed');
for(const [s,p,a,actor] of [['pending','unpaid','ship','merchant'],['pending','unpaid','complete','customer'],['paid','paid','cancel','customer'],['completed','paid','ship','merchant'],['cancelled','unpaid','accept','merchant']])assert.throws(()=>next(s,p,a,actor));
assert.throws(()=>exportsObject.requestedItems([{id:'p::x',quantity:100}]));assert.equal(exportsObject.requestedItems([{id:'p::x',quantity:2,spec:'x'},{id:'p::x',quantity:3,spec:'x'}])[0].quantity,5);
console.log('PASS: pre-paint light/dark/blocked-storage bootstrap; cancel, paid-to-accept-to-ship-to-complete transitions; unpaid and invalid transition guards; quantities.');
