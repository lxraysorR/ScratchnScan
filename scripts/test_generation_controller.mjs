import assert from 'node:assert/strict';
import { runGenerationFlow } from '../app/js/generationController.js';
import { buildDeterministicScratchRecipe } from '../app/js/manualRecipe.js';

globalThis.sessionStorage = { _m:new Map(), getItem(k){return this._m.get(k)||null;}, setItem(k,v){this._m.set(k,String(v));}, removeItem(k){this._m.delete(k);} };

function baseCallbacks(log){
  return {
    onProgressStart:()=>log.push('start'),
    onProgressStop:()=>log.push('stop'),
    onNavigateResult:()=>log.push('navigate'),
    onRefreshBarcode:()=>log.push('refresh'),
    onClearDraftBarcode:()=>log.push('clear'),
    onSessionRecord:()=>log.push('record'),
  };
}

const okAI = async ()=>({ recipe:{ product:{name:'Photo Snack', category:'snack', confidence:'high', detectedIngredients:['corn']}, homemadeAlternative:{ title:'Snack', whyCleaner:[], ingredients:[{item:'corn'}], steps:['mix'], tips:[] } } });

{
  const log=[]; let counted=0;
  const res = await runGenerationFlow({
    input:{ productName:'Granola', inputIngredients:'oats', dietaryPreference:'', barcode:null, hasTypedContext:true },
    photos:{ frontImagePreviewDataUrl:null, backImagePreviewDataUrl:null },
    services:{ generateScratchRecipe:okAI, buildDeterministicScratchRecipe, recordSuccessfulGeneration:async()=>{counted++;}, refreshUsageStrips:async()=>{} },
    callbacks: baseCallbacks(log),
    options:{ timeoutMs:1000 },
  });
  assert.equal(res.status,'success'); assert.equal(counted,1); assert.ok(log.includes('start')&&log.includes('stop'));
}

{
  const log=[];
  const res = await runGenerationFlow({
    input:{ productName:'Granola', inputIngredients:'oats', dietaryPreference:'', barcode:null, hasTypedContext:true },
    photos:{ frontImagePreviewDataUrl:null, backImagePreviewDataUrl:null },
    services:{ generateScratchRecipe:async()=>{throw new Error('down');}, buildDeterministicScratchRecipe, recordSuccessfulGeneration:async()=>{}, refreshUsageStrips:async()=>{} },
    callbacks: baseCallbacks(log),
    options:{ timeoutMs:1000 },
  });
  assert.equal(res.status,'success'); assert.equal(res.source,'fallback');
}

{
  const res = await runGenerationFlow({
    input:{ productName:'', inputIngredients:'', dietaryPreference:'', barcode:null, hasTypedContext:false },
    photos:{ frontImagePreviewDataUrl:'data:front', backImagePreviewDataUrl:null },
    services:{ generateScratchRecipe:async()=>({ recipe:{ product:{ confidence:'low' } } }), buildDeterministicScratchRecipe, recordSuccessfulGeneration:async()=>{}, refreshUsageStrips:async()=>{} },
    callbacks: baseCallbacks([]),
    options:{ timeoutMs:1000 },
  });
  assert.equal(res.status,'correction-needed');
}

{
  const res = await runGenerationFlow({
    input:{ productName:'', inputIngredients:'', dietaryPreference:'', barcode:null, hasTypedContext:false },
    photos:{ frontImagePreviewDataUrl:'data:front', backImagePreviewDataUrl:'data:back' },
    services:{ generateScratchRecipe:okAI, buildDeterministicScratchRecipe, recordSuccessfulGeneration:async()=>{}, refreshUsageStrips:async()=>{} },
    callbacks: baseCallbacks([]),
    options:{ timeoutMs:1000 },
  });
  assert.equal(res.status,'success');
}

console.log('Generation controller tests passed.');
