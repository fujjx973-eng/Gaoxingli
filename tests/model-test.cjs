const assert=require('node:assert/strict');
const M=require('../model.js');
let passed=0;
function test(name,fn){fn();passed++;process.stdout.write('PASS '+name+'\n');}
const data={experience:'telling',date:'2026-10-20',people:2,needs:'希望节奏慢一点',ack:true};
const pending=()=>M.createInquiry(M.initial(),data,'2026-10-12','q1','2026-10-12T00:00:00Z');
const offer={date:'2026-10-21',time:'10:30',reply:'建议改为次日交流。',today:'2026-10-12',now:'2026-10-12T01:00:00Z'};
test('empty trip and card',()=>assert.deepEqual(M.cardData(M.initial()),{places:[],inquiries:[]}));
test('place de-duplication and immutable input',()=>{let a=M.initial(),b=M.addPlace(M.addPlace(a,'museum'),'museum');assert.equal(a.trip.length,0);assert.deepEqual(b.trip,['museum']);});
test('reorder and remove reflected in card',()=>{let a=M.addPlace(M.addPlace(M.initial(),'museum'),'stone');a=M.movePlace(a,'stone',-1);assert.equal(M.cardData(a).places[0].id,'stone');a=M.removePlace(a,'museum');assert.equal(M.cardData(a).places.length,1);});
test('invalid calendar dates rejected',()=>{assert.equal(M.isDate('2026-02-30'),false);assert.equal(M.isDate('2028-02-29'),true);});
test('past dates and invalid people rejected',()=>{assert.ok(M.validate({...data,date:'2026-10-11'},'2026-10-12'));for(const n of [0,21,1.5,NaN])assert.ok(M.validate({...data,people:n},'2026-10-12'));});
test('acknowledgment required',()=>assert.ok(M.validate({...data,ack:false},'2026-10-12')));
test('submit is pending, not confirmed',()=>assert.equal(pending().inquiries[0].status,'pending'));
test('pending cannot confirm directly',()=>assert.throws(()=>M.transition(pending(),'q1','confirm')));
test('offer requires valid time and explanation',()=>{assert.throws(()=>M.transition(pending(),'q1','offer',{...offer,time:'25:00'}));assert.throws(()=>M.transition(pending(),'q1','offer',{...offer,reply:''}));});
test('full offer-confirm flow',()=>{let a=M.transition(pending(),'q1','offer',offer);assert.equal(a.inquiries[0].status,'offered');a=M.transition(a,'q1','confirm',{today:'2026-10-12'});assert.equal(a.inquiries[0].status,'confirmed');assert.equal(M.cardData(a).inquiries[0].offeredDate,'2026-10-21');});
test('confirmed reschedule must be accepted again',()=>{let a=M.transition(M.transition(pending(),'q1','offer',offer),'q1','confirm',{today:'2026-10-12'});a=M.transition(a,'q1','offer',{...offer,date:'2026-10-22'});assert.equal(a.inquiries[0].status,'offered');assert.equal(M.cardData(a).inquiries[0].statusName,'待你确认');});
test('expired proposal cannot be confirmed',()=>assert.throws(()=>M.transition(M.transition(pending(),'q1','offer',offer),'q1','confirm',{today:'2026-10-22'})));
test('declined requests excluded from card with history retained',()=>{let a=M.transition(pending(),'q1','decline',{reply:'当天无法接待'});assert.equal(M.cardData(a).inquiries.length,0);assert.equal(a.inquiries[0].history.length,2);assert.throws(()=>M.transition(a,'q1','offer',offer));});
test('cancelled requests excluded and cannot revive',()=>{let a=M.transition(pending(),'q1','cancel');assert.equal(M.cardData(a).inquiries.length,0);assert.throws(()=>M.transition(a,'q1','confirm'));});
test('storage corruption falls back without crash',()=>{assert.deepEqual(M.hydrate('{broken'),M.initial());assert.deepEqual(M.hydrate(JSON.stringify({version:42})),M.initial());});
test('stored state reload retains order and status',()=>{let a=M.addPlace(M.transition(pending(),'q1','offer',offer),'museum');assert.deepEqual(M.hydrate(JSON.stringify(a)),a);});
test('unknown places and corrupt proposals dropped',()=>{let a=M.initial();a.trip=['unknown','museum','museum'];a.inquiries=[{...pending().inquiries[0],status:'confirmed',offeredDate:'not-a-date'}];let b=M.hydrate(JSON.stringify(a));assert.deepEqual(b.trip,['museum']);assert.deepEqual(b.inquiries,[]);});
process.stdout.write('\n'+passed+' meaningful state and validation checks passed.\n');

