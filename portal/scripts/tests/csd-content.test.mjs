import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { scoreAttempt } from '../../src/lib/scoring.ts';
const root=new URL('../../public/',import.meta.url);
const expected=[
 ['A','A','B','A','B','B','8','E','1','3','111','32','10111010','B','0x18','22','0x2F46','1','E','1111','4'],
 ['A','A','B','A','B','B','10000010','E','7','5','3','101','16','0x06','1111','B','18','0x2EB3','E','4','0'],
];
for(let p=1;p<=2;p++){
 const pack=JSON.parse(readFileSync(new URL(`content/csd-pyq-${p}.json`,root)));
 test(`CSD ${p}: all source entries, marks, options, solutions and assets survive compilation`,()=>{
  assert.equal(pack.category,'CSD');assert.equal(pack.questions.length,21);
  assert.equal(pack.questions.reduce((s,q)=>s+q.marks.correct,0),50);
  for(const [i,q] of pack.questions.entries()){
   assert.equal(q.num,`Q${i+1}`);assert.equal(q.answerMatch,'exact');
   assert.equal(String(q.answer.value),expected[p-1][i]);
   const mcq=i<6||i===7||i===18||i===(p===1?13:15);
   assert.equal(q.options.length,mcq?(i<6?2:i===7||i===18?5:4):0);
   assert.match(q.solutionMd,/Step-by-step solution/);assert.match(q.solutionMd,/Printed PDF key/);
   assert.match(q.solutionMd,/Quick learning tip/);
   assert.match(q.bodyMd,/Source question ID/);assert.match(q.bodyMd,/PDF page\(s\)/);
   if (q.type==='numeric'||q.type==='text') assert.match(q.bodyMd,/Source response settings/);
   if (mcq) assert.equal(q.bodyMd.match(/Source option IDs \(A onward\):\*\* ([^\n]+)/)[1].match(/640653\d+/g).length,q.options.length);
   for(const part of [q.bodyMd,q.solutionMd,...q.options.map(o=>o.text)])
    for(const [,asset] of part.matchAll(/\]\((assets\/[^)]+)\)/g))assert.ok(existsSync(new URL(asset,root)),asset);
  }
 });
 test(`CSD ${p}: exact scoring accepts all corrected answers for 50 marks`,()=>{
  const attempt={attemptId:'audit',gaId:pack.id,questions:Object.fromEntries(pack.questions.map(q=>[q.id,{answer:q.answer.value}]))};
  const result=scoreAttempt(attempt,pack);assert.equal(result.totalMarks,50);assert.equal(result.correct,21);
 });
 test(`CSD ${p}: bit errors, hex suffixes and approximate integers are rejected`,()=>{
  for(const q of pack.questions.filter(q=>!q.options.length)){
   const value=String(q.answer.value);const wrong=value.startsWith('0x')?value+'9':q.type==='text'?value.slice(0,-1)+(value.endsWith('0')?'1':'0'):String(Number(value)+0.1);
   const result=scoreAttempt({attemptId:'audit',gaId:pack.id,questions:{[q.id]:{answer:wrong}}},pack);
   assert.equal(result.perQuestion.find(r=>r.questionId===q.id).isCorrect,false,`${q.id}: ${wrong}`);
  }
 });
}
test('Printed gate-selection options do not implement either target',()=>{
 const gate=(kind,a,b)=>kind==='OR'?a||b:kind==='AND'?a&&b:kind==='NAND'?!(a&&b):!(a||b);
 for(const p of [1,2]){
  const options=p===1?[['OR','NOR'],['OR','NAND'],['AND','NAND'],['AND','NOR']]:[['OR','NAND'],['OR','NOR'],['AND','NOR'],['AND','NAND']];
  for(const [gt1,gt2] of options){
   let mismatches=0;
   for(let n=0;n<16;n++){
    const [x,y,z,w]=[3,2,1,0].map(b=>Boolean(n&(1<<b)));
    const target=p===1?((x||!y)&&z&&w)||(!z&&w):(!x||!y)&&z&&w;
    const actual=gate(gt1,z,w)&&gate(gt2,!x,y&&z);
    mismatches+=Number(actual!==target);
   }
   assert.ok(mismatches>0);
  }
 }
});
test('Independent minterm and sequential-circuit evaluations',()=>{
 const terms=[];
 for(let n=0;n<16;n++){
  const [a,b,c,d]=[3,2,1,0].map(bit=>Boolean(n&(1<<bit)));const n1=!(a&&b),n2=!(n1&&c),n3=!(n1&&d);
  if(!(n2&&n3))terms.push(n);
 }
 assert.deepEqual(terms,[1,2,3,5,6,7,9,10,11]);
 let state=[1,0,1];const sequence=[];
 for(let i=0;i<5;i++){const [a,b,c]=state;state=[c,Number(!(a&&c)),b];sequence.push(state.join(''));}
 assert.deepEqual(sequence,['100','010','011','111','101']);
 assert.equal((80-150+256).toString(2),'10111010');assert.equal((180-50).toString(2),'10000010');
});
