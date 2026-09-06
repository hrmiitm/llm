import assert from 'node:assert/strict';
import { attentionExample, ga2Config, parameterCounts, positional, softmax } from '../src/features/visual-lab/math.ts';
import { exercises, lessons } from '../src/features/visual-lab/content.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
const base=parameterCounts(ga2Config);
assert.equal(base.stack,230656);
assert.equal(base.total,486656);
assert.equal(base.mha,16384);
assert.equal(parameterCounts({...ga2Config,d:256,heads:4}).mha,262144);
assert.equal(parameterCounts({...ga2Config,heads:8}).mha,base.mha);
assert.equal(base.total-parameterCounts({...ga2Config,tied:true}).total,96000);
assert.equal(parameterCounts({...ga2Config,learnedPosition:true}).total-base.total,16384);
assert.equal(parameterCounts({...ga2Config,attentionBias:true,ffnBias:true,outputBias:true}).total-base.total,4316);
assert.equal(parameterCounts({...ga2Config,architecture:'gpt'}).stack,98816);
for(const d of [2,6,128,512])for(const p of [0,3,4,100])near(positional(p,d).reduce((s,v)=>s+v*v,0),d/2);
near(positional(4,6).reduce((s,v)=>s+v,0)+0.98,1.7455470829688235);
for(const causal of [false,true])for(const scaled of [false,true]) {
 const a=attentionExample(causal,scaled);
 assert.deepEqual(a.scores,[[1,0,1],[0,1,1],[1,1,2]]);
 a.weights.forEach((row,i)=>{near(row.reduce((s,v)=>s+v,0),1);row.forEach((v,j)=>{if(causal&&j>i)assert.equal(v,0);});});
 if(causal)assert.deepEqual(a.output[0],[0,1]);
}
assert.deepEqual(softmax([10000,10000]),[0.5,0.5]);
assert.equal(exercises.length,38);
for(let i=0;i<lessons.length;i++)assert.ok(exercises.some(q=>q.topic===i));
for(const q of exercises)assert.ok(q.answer&&q.solution&&q.hint);
console.log('Visual Lab: parameter ledgers, tying/bias/position deltas, attention, PE invariants and exercise coverage passed.');
