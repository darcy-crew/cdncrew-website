const nav=document.querySelector('.nav');
if(nav)window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>10),{passive:true});
const burger=document.querySelector('.nav__burger');
const drawer=document.querySelector('.nav__drawer');
if(burger&&drawer)burger.addEventListener('click',()=>{burger.classList.toggle('open');drawer.classList.toggle('open');});
document.addEventListener('DOMContentLoaded',()=>{
  const path=window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav__links a,.nav__drawer a').forEach(a=>{
    const href=a.getAttribute('href')||'';
    if(href===path||href.endsWith('/'+path))a.classList.add('active');
  });
  const form=document.querySelector('.quote-form');
  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const btn=form.querySelector('[type="submit"]');
      btn.textContent='Sending…';btn.disabled=true;
      try{
        const res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}});
        if(res.ok){form.innerHTML=`<div style="text-align:center;padding:3rem 1rem"><div style="width:48px;height:48px;border-radius:50%;background:var(--olive-pale);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div><div style="font-family:'Fraunces',serif;font-size:1.5rem;font-weight:300;margin-bottom:.75rem;letter-spacing:-.02em">Request received.</div><p style="font-size:.9rem;color:var(--grey-4)">We'll review your project and follow up within one business day.</p></div>`;}
        else{btn.textContent='Try again';btn.disabled=false;}
      }catch{btn.textContent='Try again';btn.disabled=false;}
    });
  }
});
