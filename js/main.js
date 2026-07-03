
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
    // Record load time for bot time-check
    const _lt=document.getElementById('_loadtime');
    if(_lt)_lt.value=Date.now();

    const SUCCESS_HTML=`<div style="text-align:center;padding:3rem 1rem"><div style="width:48px;height:48px;border-radius:50%;background:var(--olive-pale);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div><div style="font-family:'Fraunces',serif;font-size:1.5rem;font-weight:300;margin-bottom:.75rem;letter-spacing:-.02em">Request received.</div><p style="font-size:.9rem;color:var(--grey-4)">We'll review your project and follow up within one business day.</p></div>`;

    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const btn=form.querySelector('[type="submit"]');

      // ── Bot checks ──
      const honeypot=form.querySelector('input[name="_gotcha"]');
      const loadtime=parseInt(document.getElementById('_loadtime')?.value||'0');
      const elapsed=Date.now()-loadtime;
      if((honeypot&&honeypot.value)||elapsed<5000){
        // Silently fake success — don't tell bots they failed
        btn.textContent='Sending…';btn.disabled=true;
        setTimeout(()=>{form.innerHTML=SUCCESS_HTML;},900);
        return;
      }

      btn.textContent='Sending…';btn.disabled=true;
      try{
        const res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}});
        if(res.ok){form.innerHTML=SUCCESS_HTML;}
        else{btn.textContent='Try again';btn.disabled=false;}
      }catch{btn.textContent='Try again';btn.disabled=false;}
    });
  }
});


// Resources dropdown toggle (touch / keyboard)
document.querySelectorAll('.nav__dropdown-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const menu = btn.nextElementSibling;
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});
document.addEventListener('click', e => {
  if (!e.target.closest('.nav__has-dropdown')) {
    document.querySelectorAll('.nav__dropdown-menu.open').forEach(m => {
      m.classList.remove('open');
      m.previousElementSibling.setAttribute('aria-expanded', false);
    });
  }
});
