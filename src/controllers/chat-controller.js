import {createLeadSubmitter} from '../models/lead-client.js';
import {KB} from '../models/chat-knowledge.js';
import {PHONE_TXT, PHONE} from '../models/contact.js';
export function initChat() {

(function(){
  var fab=document.getElementById('yvChatFab'), panel=document.getElementById('yvChat'),
      msgs=document.getElementById('ycMsgs'), form=document.getElementById('ycForm'),
      input=document.getElementById('ycInput'), dot=document.getElementById('ycDot');
  if(!fab||!panel) return;
  var greeted=false, answered=0, nudged=false;
  var lead={interest:'',name:'',phone:'',email:'',city:''}, step=null;
  const submitLead = createLeadSubmitter();
  let leadSending = false;

  /* ---------- knowledge base ---------- */
  

  /* ---------- ui helpers ---------- */
  function scroll(){ msgs.scrollTop=msgs.scrollHeight; }
  function addMsg(t,who){ var d=document.createElement('div'); d.className='yc-m '+who; d.textContent=t; msgs.appendChild(d); scroll(); return d; }
  function clearChips(){ msgs.querySelectorAll('.yc-chips').forEach(function(x){x.remove();}); }
  function addChips(list){ clearChips(); var w=document.createElement('div'); w.className='yc-chips';
    list.forEach(function(ch){ var b=document.createElement('button'); b.type='button'; b.textContent=ch.t;
      b.addEventListener('click',function(){ clearChips(); addMsg(ch.t,'user'); ch.fn(); }); w.appendChild(b); });
    msgs.appendChild(w); scroll(); }
  function botSay(t,after){ var ty=document.createElement('div'); ty.className='yc-typing'; ty.innerHTML='<i></i><i></i><i></i>';
    msgs.appendChild(ty); scroll();
    setTimeout(function(){ ty.remove(); addMsg(t,'bot'); if(after) after(); }, Math.min(1100, 350+t.length*4)); }

  function mainChips(){ addChips([
    {t:'\uD83D\uDCB0 Pricing & sizes', fn:function(){ botSay(find('price').a, function(){ offerLead('a Yard Vault'); }); }},
    {t:'\uD83D\uDE9A Delivery area', fn:function(){ botSay(find('deliver').a, mainChips); }},
    {t:'\uD83D\uDCB3 Financing', fn:function(){ botSay(find('financ').a, mainChips); }},
    {t:'\uD83D\uDCAC Talk to a specialist', fn:function(){ startLead(); }}
  ]); }
  function find(k){ for(var i=0;i<KB.length;i++){ if(KB[i].k.indexOf(k)>-1) return KB[i]; } return KB[0]; }

  /* ---------- intent matching ---------- */
  function match(text){ var t=' '+text.toLowerCase()+' ', best=null, bs=0;
    KB.forEach(function(e){ var s=0; e.k.forEach(function(k){ if(t.indexOf(k)>-1) s+=k.length; }); if(s>bs){bs=s; best=e;} });
    return bs>=3?best:null; }

  /* ---------- lead capture ---------- */
  function startLead(){ step='interest';
    botSay("Happy to connect you. First \u2014 what are you most interested in?", function(){
      addChips([
        {t:'Storage unit',fn:function(){setInterest('Storage unit');}},
        {t:'Office unit',fn:function(){setInterest('Office unit');}},
        {t:'Retail kiosk',fn:function(){setInterest('Retail kiosk');}},
        {t:'Multi-unit building',fn:function(){setInterest('Multi-unit building');}},
        {t:'Shipping container',fn:function(){setInterest('Shipping container');}},
        {t:'Accessories',fn:function(){setInterest('Accessories');}},
        {t:'Not sure yet',fn:function(){setInterest('Not sure yet');}}
      ]); }); }
  function setInterest(v){ lead.interest=v; step='name'; botSay("Got it \u2014 "+v.toLowerCase()+". What\u2019s your name?"); }
  function askStep(){ var q={name:"What\u2019s your name?", phone:"Best phone number to reach you?",
      email:"And your email?", city:"Last one \u2014 what city and state are you in? (e.g., Gallup, NM)"};
    botSay(q[step]); }
  function validPhone(v){ var d=v.replace(/\D/g,''); return d.length>=10&&d.length<=11; }
  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
  function handleStep(text){
    if(step==='interest'){ lead.interest=text; step='name'; askStep(); return; }
    if(step==='name'){ if(text.length<2){ botSay("A name helps us know who to ask for \u2014 what should we call you?"); return; }
      lead.name=text; step='phone'; askStep(); return; }
    if(step==='phone'){ if(!validPhone(text)){ maybeAnswerThen("Hmm, that doesn\u2019t look like a full phone number \u2014 10 digits, like (505) 555-0134.", text); return; }
      lead.phone=text; step='email'; askStep(); return; }
    if(step==='email'){ if(!validEmail(text)){ maybeAnswerThen("That email doesn\u2019t look complete \u2014 mind double-checking it?", text); return; }
      lead.email=text.trim(); step='city'; askStep(); return; }
    if(step==='city'){ if(text.length<2){ botSay("Just your city and state \u2014 e.g., Farmington, NM."); return; }
      lead.city=text; step=null; finishLead(); return; }
  }
  function maybeAnswerThen(msg,text){ var m=match(text);
    if(m){ botSay(m.a, function(){ botSay("Back to it \u2014 "); askStep(); }); } else { botSay(msg); } }
  function finishLead(){
    var card=document.createElement('div'); card.className='yc-lead';
    card.innerHTML='<div class="lh">Your request</div>'
      +'<div class="lr"><span>Interest</span><b></b></div><div class="lr"><span>Name</span><b></b></div>'
      +'<div class="lr"><span>Phone</span><b></b></div><div class="lr"><span>Email</span><b></b></div>'
      +'<div class="lr"><span>City</span><b></b></div>';
    var bs=card.querySelectorAll('b');
    bs[0].textContent=lead.interest; bs[1].textContent=lead.name; bs[2].textContent=lead.phone;
    bs[3].textContent=lead.email; bs[4].textContent=lead.city;
    msgs.appendChild(card); scroll();
    botSay("Perfect, "+lead.name.split(' ')[0]+" \u2014 tap \u201cSend request\u201d to submit your "
      +lead.interest.toLowerCase()+". Or call us right now at "+PHONE_TXT+".", function(){
      addChips([
        {t:'Send request', fn:sendLead},
        {t:'\uD83D\uDCDE Call '+PHONE_TXT, fn:function(){ window.location.href=PHONE; }},
        {t:'Ask another question', fn:function(){ botSay("Sure \u2014 what would you like to know?"); }}
      ]); }); }

  async function sendLead() {
    if (leadSending) return;
    leadSending = true;
    try {
      const result = await submitLead({type:'chat', name:lead.name, phone:lead.phone, email:lead.email, interest:lead.interest, location:lead.city});
      botSay('Your request has been received. Reference: '+result.reference.slice(0,8)+'. Anything else I can answer?', mainChips);
    } catch(error) {
      botSay('We could not confirm your submission. Please try again or call '+PHONE_TXT+'.', function(){
        addChips([{t:'Try again',fn:sendLead},{t:'Call '+PHONE_TXT,fn:function(){window.location.href=PHONE;}}]);
      });
    } finally { leadSending = false; }
  }

  /* ---------- open/close ---------- */
  function openChat(){ panel.hidden=false; fab.setAttribute('aria-expanded','true'); if(dot) dot.remove();
    var t=document.getElementById('ycTeaser'); if(t) t.remove();
    if(!greeted){ greeted=true;
      botSay("Hey! I\u2019m the Vault Assistant \uD83D\uDC4B I can answer anything about our steel buildings \u2014 sizes, pricing, delivery, financing \u2014 or connect you with the team.", mainChips); }
    setTimeout(function(){ input.focus(); },150); }
  function closeChat(){ panel.hidden=true; fab.setAttribute('aria-expanded','false'); }
  fab.addEventListener('click',function(){ panel.hidden?openChat():closeChat(); });
  panel.querySelector('.yc-close').addEventListener('click',closeChat);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!panel.hidden) closeChat(); });

  /* teaser bubble, once per session */
  try{ if(!sessionStorage.getItem('ycTeased')){
    setTimeout(function(){ if(!panel.hidden||greeted) return;
      var t=document.createElement('div'); t.id='ycTeaser'; t.textContent='Questions about sizes or pricing? I can help \u2192';
      t.addEventListener('click',function(){ t.remove(); openChat(); });
      document.body.appendChild(t);
      setTimeout(function(){ if(t.parentNode) t.remove(); },9000);
    },7000);
    sessionStorage.setItem('ycTeased','1'); } }catch(e){}

  /* ---------- input ---------- */
  form.addEventListener('submit',function(e){ e.preventDefault();
    var v=input.value.trim(); if(!v) return; input.value='';
    clearChips(); addMsg(v,'user');
    if(step){ handleStep(v); return; }
    var m=match(v);
    if(m){ answered++;
      botSay(m.a, function(){
        if(m.chips){ mainChips(); return; }
        if(m.lead){ addChips([{t:'Yes \u2014 have someone reach out',fn:startLead},{t:'Just browsing for now',fn:function(){ botSay("No problem \u2014 ask me anything else.", null); }}]); return; }
        if(answered>=2&&!nudged&&!lead.name){ nudged=true;
          addChips([{t:'Get a tailored quote',fn:startLead},{t:'Keep browsing',fn:function(){}}]); }
      });
    } else {
      botSay("Good question \u2014 that one\u2019s best answered by a real person. Want me to take your info so a specialist can reach out? Or call "+PHONE_TXT+".", function(){
        addChips([{t:'Yes, take my info',fn:startLead},{t:'No thanks',fn:function(){ botSay("All good \u2014 try me on sizes, delivery, financing, security, or containers.", null); }}]); });
    }
  });
  function offerLead(what){ addChips([{t:'Get exact pricing',fn:startLead},{t:'Keep browsing',fn:function(){}}]); }
})();

}
