(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GaoxingModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const places = {
    museum: {id:'museum',name:'红军长征邛崃纪念馆',type:'文化参访',note:'已见公开资料记载；当前开放时间及入馆方式待核实。'},
    stone: {id:'stone',name:'石塔区苏维埃政府旧址',type:'历史地点',note:'已见公开资料记载；开放范围、步行连接与通行条件待核实。'}
  };
  const experiences = {
    telling:{id:'telling',name:'听一位本地人，讲高兴的故事',category:'讲述',type:'本地讲述',duration:'约 45 分钟 · 设计设想',intro:'从一根扁担的故事开始，听一段有出处的村庄记忆，也留一点时间，问你真正好奇的问题。',art:'bamboo',who:'本地讲述者角色（待对接）',items:['以“红军扁担”相关史料为讲述基础','围绕人物、实物与村庄关系展开交流','根据参与者兴趣安排提问与讨论']},
    meal:{id:'meal',name:'留在村里，好好吃一顿饭',category:'餐食',type:'乡村餐食',duration:'时间由双方协商',intro:'把人数、用餐时间和饮食需求提前说清楚，让来访者与接待者都有从容准备的时间。',art:'meal',who:'本地餐食提供者角色（待对接）',items:['先说明人数和饮食需求','具体菜单、价格与接待条件由提供者确认','不将示意图片作为实际菜品承诺']},
    culture:{id:'culture',name:'相聚的时候，听见村庄',category:'文化活动',type:'村民文化活动',duration:'以实际活动安排为准',intro:'认识村民怎样参与文化表达。是否有公开活动、可否旁听或交流，都需要先向当地确认。',art:'theatre',who:'本地文化活动协调者角色（待对接）',items:['了解村民参与文化创作的公开资料','咨询是否有适合来访者参与的活动','尊重参与者意愿，拍摄与记录需事先征得同意']}
  };
  const statusNames={pending:'待回复',offered:'待你确认',confirmed:'已确认',declined:'无法接待',cancelled:'已取消'};
  const allowed={pending:['offer','decline','cancel'],offered:['offer','confirm','decline','cancel'],confirmed:['offer','decline','cancel'],declined:[],cancelled:[]};
  function initial(){return {version:1,large:false,trip:[],inquiries:[]};}
  function clone(s){return JSON.parse(JSON.stringify(s));}
  function isDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===value;}
  function validate(input,today){
    if(!experiences[input.experience])return '请选择有效的体验。';
    if(!isDate(input.date))return '请选择有效的希望到访日期。';
    if(today&&input.date<today)return '希望到访日期不能早于今天。';
    if(!Number.isInteger(Number(input.people))||Number(input.people)<1||Number(input.people)>20)return '演示咨询人数请输入 1 至 20 的整数；这不是实际接待上限。';
    if((input.needs||'').length>300)return '补充需求请控制在 300 字以内。';
    if(!input.ack)return '请先确认你理解这是模拟咨询。';
    return '';
  }
  function addPlace(s,id){if(!places[id])throw new Error('地点不存在');const n=clone(s);if(!n.trip.includes(id))n.trip.push(id);return n;}
  function removePlace(s,id){const n=clone(s);n.trip=n.trip.filter(x=>x!==id);return n;}
  function movePlace(s,id,delta){const n=clone(s),i=n.trip.indexOf(id),j=i+delta;if(i>=0&&j>=0&&j<n.trip.length)[n.trip[i],n.trip[j]]=[n.trip[j],n.trip[i]];return n;}
  function createInquiry(s,input,today,id,now){const error=validate(input,today);if(error)throw new Error(error);const n=clone(s);if(n.inquiries.some(q=>q.id===id))throw new Error('咨询编号重复');n.inquiries.push({id,experience:input.experience,date:input.date,people:Number(input.people),needs:(input.needs||'').trim(),status:'pending',created:now,reply:'',offeredDate:'',offeredTime:'',updated:now,history:[{status:'pending',at:now,message:'游客提出模拟咨询'}]});return n;}
  function transition(s,id,action,payload={}){const n=clone(s),q=n.inquiries.find(x=>x.id===id);if(!q)throw new Error('咨询不存在');if(!allowed[q.status].includes(action))throw new Error('当前状态不支持此操作');if(action==='offer'){
      if(!isDate(payload.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(payload.time||''))throw new Error('请填写有效的建议日期与时间');
      if(payload.today&&payload.date<payload.today)throw new Error('建议日期不能早于今天');
      if(!(payload.reply||'').trim()||payload.reply.length>500)throw new Error('请填写 1 至 500 字的接待说明');
      q.offeredDate=payload.date;q.offeredTime=payload.time;q.reply=payload.reply.trim();q.status='offered';
    }else if(action==='confirm'){if(payload.today&&q.offeredDate<payload.today)throw new Error('建议日期已过，请联系接待者重新安排');q.status='confirmed';}
    else if(action==='decline'){if(!(payload.reply||'').trim()||payload.reply.length>500)throw new Error('请填写 1 至 500 字的无法接待说明');q.reply=payload.reply.trim();q.status='declined';}
    else if(action==='cancel')q.status='cancelled';
    q.updated=payload.now||new Date().toISOString();q.history.push({status:q.status,at:q.updated,message:action==='offer'||action==='decline'?q.reply:action==='confirm'?'游客确认模拟安排':'游客取消咨询'});return n;
  }
  function hydrate(raw){const n=initial();try{const s=JSON.parse(raw);if(!s||s.version!==1)return n;n.large=!!s.large;n.trip=[...new Set((Array.isArray(s.trip)?s.trip:[]).filter(id=>places[id]))];n.inquiries=(Array.isArray(s.inquiries)?s.inquiries:[]).filter(q=>q&&typeof q.id==='string'&&q.id.length<100&&experiences[q.experience]&&statusNames[q.status]&&isDate(q.date)&&Number.isInteger(q.people)&&q.people>=1&&q.people<=20&&(q.status!=='offered'&&q.status!=='confirmed'||isDate(q.offeredDate)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(q.offeredTime))).map(q=>({...q,needs:String(q.needs||'').slice(0,300),reply:String(q.reply||'').slice(0,500),history:Array.isArray(q.history)?q.history:[]}));}catch{}return n;}
  function cardData(s){return {places:s.trip.map(id=>places[id]),inquiries:s.inquiries.filter(q=>q.status==='pending'||q.status==='offered'||q.status==='confirmed').map(q=>({...q,name:experiences[q.experience].name,statusName:statusNames[q.status]}))};}
  return {places,experiences,statusNames,initial,validate,isDate,addPlace,removePlace,movePlace,createInquiry,transition,hydrate,cardData};
});
