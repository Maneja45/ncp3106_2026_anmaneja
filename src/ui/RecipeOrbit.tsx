import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Heart, Star, Users } from 'lucide-react'

export type OrbitRecipe = {
  id: string
  name: string
  category: string
  description: string
  time: number
  servings: number
  ingredients: string[]
  image: string
  emoji?: string
}

type Props = {
  recipes: OrbitRecipe[]
  favorites: string[]
  onFavorite: (id: string) => void
  onView: (id: string) => void
  ratings?: Record<string, number>
  onRate?: (id: string, stars: number) => void
}

const css = `
.recipe-orbit {
  --ro-ink:#1f3d2c; --ro-glass:rgba(255,255,255,.86); --ro-tile:#ffffff; --ro-soft:#e9f1e8;
  --ro-plate:#f3eedf; --ro-plate-rim:#fbf8ef; --ro-accent-text:var(--primary,#376b50);
  position:relative; width:100%; height:100%; min-height:0; overflow:hidden; isolation:isolate;
  border:1px solid var(--border,#e2eadc); border-radius:22px; background:var(--ro-glass);
  backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); color:var(--text,#203a2e);
  box-shadow:0 5px 17px rgba(30,60,40,.05);
}
[data-theme="dark"] .recipe-orbit {
  --ro-ink:#eef6e6; --ro-glass:rgba(22,36,29,.82); --ro-tile:#22372b; --ro-soft:#27412f;
  --ro-plate:#2c4033; --ro-plate-rim:#34493b; --ro-accent-text:#a1d7ae;
}
.recipe-orbit * { box-sizing:border-box; }
.recipe-orbit button { font:inherit; cursor:pointer; }
.recipe-orbit button:focus-visible { outline:2px solid var(--primary,#66835c); outline-offset:3px; }
.ro-stage { position:absolute; width:1000px; height:540px; top:50%; left:50%; transform:translate(-50%,-50%) scale(var(--ro-scale,1)); transform-origin:center; }
.ro-swoosh { position:absolute; inset:0; width:1000px; height:540px; pointer-events:none; opacity:.32; }
[data-theme="dark"] .ro-swoosh { opacity:.18; }
.ro-kicker { position:absolute; top:30px; left:70px; font-size:11px; letter-spacing:.22em; font-weight:800; color:var(--ro-accent-text); }
.ro-plate-area { position:absolute; left:104px; top:62px; width:310px; height:310px; touch-action:pan-y; }
.ro-plate { position:absolute; inset:0; visibility:hidden; transform-origin:65% -195%; }
.ro-food { width:310px; height:310px; object-fit:contain; filter:drop-shadow(0 22px 19px rgba(0,0,0,.17)); }
.ro-placeholder { width:285px; height:285px; margin:12px; display:grid; place-items:center; border:14px solid var(--ro-plate-rim); border-radius:50%; background:radial-gradient(circle,var(--ro-plate) 0%,var(--ro-plate) 62%,var(--ro-plate-rim) 100%); box-shadow:0 20px 28px rgba(39,58,37,.15), inset 0 6px 14px rgba(0,0,0,.05); font-size:128px; line-height:1; user-select:none; }
.ro-placeholder span { filter:drop-shadow(0 12px 10px rgba(0,0,0,.18)); }
.ro-title-area { position:absolute; top:95px; left:430px; width:340px; height:170px; }
.ro-title-item { position:absolute; inset:0; visibility:hidden; }
.ro-eyebrow { margin:0 0 12px; color:var(--ro-accent-text); font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
.ro-title-light,.ro-title-heavy { display:block; line-height:1.05; white-space:nowrap; font-family:Georgia,'Times New Roman',serif; letter-spacing:-.025em; color:var(--ro-ink); }
.ro-title-light { font-weight:400; font-style:italic; opacity:.72; } .ro-title-heavy { font-weight:700; }
.ro-actions { position:absolute; left:430px; top:290px; display:flex; align-items:center; gap:12px; }
.ro-primary,.ro-secondary { display:flex; align-items:center; gap:8px; border-radius:999px; padding:12px 18px; font-size:12px!important; font-weight:750!important; transition:transform .2s; }
.ro-primary { background:var(--primary,#376b50); color:#fff; border:1px solid var(--primary,#376b50); }
.ro-secondary { background:var(--ro-tile); color:var(--text,#203a2e); border:1px solid var(--border,#e2eadc); }
.ro-secondary[aria-pressed="true"] { color:#c4544c; }
[data-theme="dark"] .ro-secondary[aria-pressed="true"] { color:#ee8b80; }
.ro-primary:hover,.ro-secondary:hover { transform:translateY(-2px); }
.ro-info-box { position:absolute; top:92px; left:785px; width:195px; padding:18px; border-radius:19px; border:1px solid var(--border,#e2eadc); background:var(--ro-tile); box-shadow:0 18px 42px rgba(20,45,20,.06); }
.ro-info-label { font-size:10px; font-weight:850; letter-spacing:.1em; color:var(--ro-accent-text); margin-bottom:12px; }
.ro-info-area { position:relative; height:226px; }
.ro-info-item { position:absolute; inset:0; visibility:hidden; display:flex; flex-direction:column; }
.ro-info-item h3 { margin:0 0 7px; font-size:17px; line-height:1.2; font-family:Georgia,'Times New Roman',serif; color:var(--ro-ink); }
.ro-info-chip { display:inline-block; align-self:flex-start; margin-bottom:9px; padding:2px 8px; border-radius:99px; background:var(--ro-soft); color:var(--ro-accent-text); font-size:10px; font-weight:800; }
.ro-info-meta { display:flex; align-items:center; gap:7px; font-size:11px; color:var(--muted,#748173); margin-bottom:12px; }
.ro-info-item p { font-size:12px; line-height:1.5; margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.ro-stars { display:flex; align-items:center; gap:2px; margin:-4px 0 10px; }
.ro-stars button { border:0; padding:1px; background:transparent; color:#d9a441; display:grid; place-items:center; transition:transform .15s; }
.ro-stars button:hover { transform:scale(1.2); }
.ro-stars button.off { color:var(--border,#d5ddd0); }
[data-theme="dark"] .ro-stars button.off { color:#4a6352; }
.ro-stars small { margin-left:6px; font-size:10px; font-weight:700; color:var(--muted,#748173); }
.ro-info-link { border:0; padding:0; margin-top:auto; align-self:flex-start; background:transparent; color:var(--ro-accent-text); font-size:11px!important; font-weight:800!important; }
.ro-bottom { position:absolute; left:120px; top:395px; display:flex; align-items:center; gap:10px; }
.ro-arrow { display:grid; place-items:center; width:38px; height:38px; flex:0 0 38px; border:1px solid var(--border,#e2eadc); border-radius:50%; color:var(--text,#203a2e); background:var(--ro-tile); transition:background-color .2s,color .2s; }
.ro-arrow:hover { background:var(--primary,#376b50); color:#fff; }
.ro-thumbs { width:520px; height:115px; overflow:hidden; }
.ro-track { display:flex; transition:transform .55s cubic-bezier(.65,0,.35,1); }
.ro-thumb { flex:0 0 130px; width:130px; height:112px; padding:0 6px; }
.ro-thumb button { width:100%; height:100%; border:1px solid transparent; border-radius:16px; background:transparent; transition:background-color .2s,transform .2s; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:7px; color:var(--text,#263729); }
.ro-thumb button:hover { transform:translateY(-2px); }
.ro-thumb button.active { background:var(--ro-soft); border-color:var(--border,#e2eadc); }
.ro-thumb img { width:62px; height:62px; object-fit:contain; }
.ro-thumb-placeholder { width:62px; height:62px; display:grid; place-items:center; border-radius:50%; border:4px solid var(--ro-plate-rim); background:var(--ro-plate); font-size:30px; line-height:1; }
.ro-thumb > button > span { font-size:10.5px; font-weight:700; max-width:110px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ro-count { position:absolute; bottom:23px; right:45px; color:var(--muted,#748173); font-size:12px; font-weight:800; letter-spacing:.12em; }
.ro-dots { position:absolute; top:194px; left:61px; display:flex; flex-direction:column; gap:11px; }
.ro-dot { border:0; width:15px; height:15px; display:grid; place-items:center; background:transparent; padding:0; }
.ro-dot span { display:block; width:5px; height:5px; border-radius:8px; background:var(--ro-accent-text); opacity:.4; transition:height .3s,opacity .3s; }
.ro-dot.active span { height:16px; opacity:1; }
@media (prefers-reduced-motion:reduce) { .ro-track { transition:none; } }

/* ===== PHONE LAYOUT: tall 400 x 930 design, scaled to the screen width ===== */
.recipe-orbit.ro-compact { height:auto; min-height:0; aspect-ratio:400/930; }
.ro-compact .ro-stage { width:400px; height:930px; }
.ro-compact .ro-swoosh { transform-origin:0 0; transform:scale(.55); }
.ro-compact .ro-kicker { top:16px; left:24px; font-size:10px; }
.ro-compact .ro-count { top:14px; right:24px; bottom:auto; }
.ro-compact .ro-dots { display:none; }
.ro-compact .ro-plate-area { left:50px; top:40px; width:300px; height:300px; }
.ro-compact .ro-food { width:300px; height:300px; }
.ro-compact .ro-placeholder { width:276px; height:276px; margin:12px; font-size:120px; }
.ro-compact .ro-title-area { left:28px; top:352px; width:344px; height:160px; }
.ro-compact .ro-actions { left:28px; top:522px; width:344px; flex-wrap:wrap; gap:10px; }
.ro-compact .ro-primary,.ro-compact .ro-secondary { font-size:13px!important; padding:12px 16px; }
.ro-compact .ro-bottom { left:22px; top:584px; }
.ro-compact .ro-thumbs { width:260px; }
.ro-compact .ro-thumb > button > span { font-size:11.5px; }
.ro-compact .ro-info-box { left:24px; top:716px; width:352px; padding:18px; }
.ro-compact .ro-info-label { font-size:11px; }
.ro-compact .ro-info-area { height:150px; }
.ro-compact .ro-info-item h3 { font-size:19px; }
.ro-compact .ro-info-meta { font-size:12px; }
.ro-compact .ro-info-item p { display:none; }
.ro-compact .ro-info-link { font-size:12px!important; }
`

function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? [parts.slice(0,-1).join(' '),parts[parts.length-1]] : ['Fresh',parts[0] || 'Recipe']
}
function fontSize(text: string, max: number) { return Math.min(max, 340 / Math.max(text.length * .5,1)) }
function arcPath(start: number,end: number) {
  const outer: string[] = [], inner: string[] = []
  for(let i=0;i<=48;i++) {
    const t=i/48, angle=(start+(end-start)*t)*Math.PI/180
    const half=65*Math.pow(Math.sin(Math.PI*t),.45)
    const x=Math.cos(angle), y=Math.sin(angle)
    outer.push(`${(295+x*(660+half)).toFixed(1)},${(-450+y*(660+half)).toFixed(1)}`)
    inner.push(`${(295+x*(660-half)).toFixed(1)},${(-450+y*(660-half)).toFixed(1)}`)
  }
  return `M ${outer.join(' L ')} L ${inner.reverse().join(' L ')} Z`
}
function FoodImage({image,name,emoji,small=false}:{image:string;name:string;emoji?:string;small?:boolean}) {
  const [failed,setFailed]=useState(false)
  useEffect(()=>setFailed(false),[image])
  if(!image || failed) return <div className={small?'ro-thumb-placeholder':'ro-placeholder'} role={small?undefined:'img'} aria-label={small?undefined:name}><span aria-hidden="true">{emoji||'🍽️'}</span></div>
  return <img className={small?undefined:'ro-food'} src={image} alt={small?'':name} draggable={false} onError={()=>setFailed(true)}/>
}

type Parts={plate?:HTMLDivElement;heading?:HTMLDivElement;eyebrow?:HTMLElement;light?:HTMLElement;heavy?:HTMLElement;info?:HTMLDivElement}

export default function RecipeOrbit({recipes,favorites,onFavorite,onView,ratings={},onRate}:Props) {
  const [index,setIndex]=useState(0)
  const root=useRef<HTMLDivElement>(null)
  const plates=useRef<(HTMLDivElement|null)[]>([])
  const titles=useRef<(HTMLDivElement|null)[]>([])
  const infos=useRef<(HTMLDivElement|null)[]>([])
  const arc=useRef<SVGPathElement>(null)
  const active=useRef(-1)
  const indexRef=useRef(0)
  const direction=useRef<1|-1>(1)
  const timeline=useRef<gsap.core.Timeline|null>(null)
  const touchX=useRef<number|null>(null)
  const arcValues=useRef({start:45,end:120})
  const count=recipes.length

  useLayoutEffect(()=>{
    if(!root.current)return
    const el=root.current
    const resize=()=>{
      // Phones use a tall layout that fills the screen width.
      const compact=window.matchMedia('(max-width: 800px)').matches
      el.classList.toggle('ro-compact',compact)
      // Desktop: scale in both directions into the available space, never overflow it.
      const scale=compact
        ? Math.max(.1,el.clientWidth/400)
        : Math.max(.1,Math.min(el.clientWidth/1000,el.clientHeight/540))
      el.style.setProperty('--ro-scale',String(scale))
    }
    resize()
    const observer=new ResizeObserver(resize)
    observer.observe(el)
    return ()=>observer.disconnect()
  },[])

  useEffect(()=>{
    if(index>=count && count>0){active.current=-1;indexRef.current=0;setIndex(0)}
  },[count,index])

  useLayoutEffect(()=>{
    if(count===0||index>=count)return
    const get=(i:number):Parts=>{
      const heading=titles.current[i]??undefined
      return {
        plate:plates.current[i]??undefined,heading,
        eyebrow:heading?.querySelector<HTMLElement>('.ro-eyebrow')??undefined,
        light:heading?.querySelector<HTMLElement>('.ro-title-light')??undefined,
        heavy:heading?.querySelector<HTMLElement>('.ro-title-heavy')??undefined,
        info:infos.current[i]??undefined,
      }
    }
    const updateArc=()=>arc.current?.setAttribute('d',arcPath(arcValues.current.start,arcValues.current.end))
    timeline.current?.progress(1).kill()
    timeline.current=null
    const prev=active.current, incoming=get(index)
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const accent=['#a7bc91','#d6c4a1','#9cad8b','#c5cdaa'][index%4]
    if(prev<0||prev===index||reduced){
      for(let i=0;i<count;i++){
        const p=get(i)
        gsap.set([p.plate,p.heading,p.info].filter(Boolean),{autoAlpha:i===index?1:0,rotation:0,y:0})
      }
      gsap.set([incoming.eyebrow,incoming.light,incoming.heavy].filter(Boolean),{autoAlpha:1,clipPath:'inset(0 0 0 0)',y:0})
      arcValues.current.start=45;arcValues.current.end=120
      updateArc()
      if(arc.current)gsap.set(arc.current,{fill:accent})
      active.current=index
      return
    }
    const outgoing=get(prev), d=direction.current
    const tl=gsap.timeline({onComplete:()=>{timeline.current=null}})
    timeline.current=tl
    const to=(target:Element|undefined,vars:gsap.TweenVars,at:number)=>{if(target)tl.to(target,vars,at)}
    const fromTo=(target:Element|undefined,from:gsap.TweenVars,toVars:gsap.TweenVars,at:number)=>{if(target)tl.fromTo(target,from,toVars,at)}
    const set=(target:Element|undefined,vars:gsap.TweenVars,at:number)=>{if(target)tl.set(target,vars,at)}
    to(outgoing.plate,{rotation:55*d,duration:.65,ease:'power2.in'},0)
    set(outgoing.plate,{autoAlpha:0,rotation:0},.65)
    fromTo(incoming.plate,{autoAlpha:1,rotation:-55*d},{autoAlpha:1,rotation:0,duration:1,ease:'power3.out'},.28)
    to(outgoing.light,{clipPath:'inset(0 0 0 100%)',duration:.42},0)
    to(outgoing.heavy,{clipPath:'inset(0 100% 0 0)',duration:.42},.04)
    to(outgoing.eyebrow,{autoAlpha:0,duration:.25},0)
    set(outgoing.heading,{autoAlpha:0},.5)
    set(incoming.heading,{autoAlpha:1},.5)
    fromTo(incoming.eyebrow,{autoAlpha:0,y:8},{autoAlpha:1,y:0,duration:.45},.55)
    fromTo(incoming.light,{clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0)',duration:.75,ease:'power3.out'},.55)
    fromTo(incoming.heavy,{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)',duration:.75,ease:'power3.out'},.62)
    to(outgoing.info,{autoAlpha:0,y:-10,duration:.3},.05)
    fromTo(incoming.info,{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:.6},.45)
    tl.to(arcValues.current,{start:32,end:148,duration:.6,onUpdate:updateArc},0)
      .to(arcValues.current,{start:45,end:120,duration:.85,onUpdate:updateArc},.6)
    if(arc.current)tl.to(arc.current,{fill:accent,duration:1.1},.1)
    active.current=index
  },[index,count])

  useEffect(()=>()=>{timeline.current?.kill()},[])
  const go=(position:number,forced?:1|-1)=>{
    if(count<2)return
    const next=((position%count)+count)%count
    if(next===indexRef.current)return
    const forward=(next-indexRef.current+count)%count
    direction.current=forced??(forward<=count-forward?1:-1)
    indexRef.current=next
    setIndex(next)
  }
  const step=(d:1|-1)=>go(indexRef.current+d,d)
  if(count===0)return null
  const current=recipes[Math.min(index,count-1)]
  const start=count<=4?0:Math.max(0,Math.min(index-1,count-4))
  const style:CSSProperties={width:'100%',height:'100%',minHeight:0,minWidth:0,flex:'1 1 auto'}
  return <div style={style}>
    <div className="recipe-orbit" ref={root} role="region" aria-roledescription="carousel" aria-label="Featured recipes" tabIndex={0}
      onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}}}>
      <style>{css}</style>
      <div className="ro-stage">
        <svg className="ro-swoosh" viewBox="0 0 1000 540" aria-hidden="true"><path ref={arc}/></svg>
        <div className="ro-kicker">RECIPE COLLECTION</div>
        <div className="ro-dots">{recipes.map((r,i)=><button key={r.id} type="button" className={`ro-dot ${index===i?'active':''}`} aria-label={`Show ${r.name}`} onClick={()=>go(i)}><span/></button>)}</div>
        <div className="ro-plate-area" onPointerDown={e=>{touchX.current=e.clientX}} onPointerUp={e=>{if(touchX.current!==null){const delta=e.clientX-touchX.current;if(Math.abs(delta)>45)step(delta<0?1:-1)}touchX.current=null}} onPointerCancel={()=>{touchX.current=null}}>
          {recipes.map((r,i)=><div key={r.id} className="ro-plate" ref={el=>{plates.current[i]=el}} aria-hidden={i!==index}><FoodImage image={r.image} name={r.name} emoji={r.emoji}/></div>)}
        </div>
        <div className="ro-title-area">{recipes.map((r,i)=>{const [light,heavy]=splitName(r.name);return <div key={r.id} className="ro-title-item" ref={el=>{titles.current[i]=el}} aria-hidden={i!==index}>
          <p className="ro-eyebrow">{r.category} · {r.time} min · {r.servings} servings</p>
          <h2 style={{margin:0}}><span className="ro-title-light" style={{fontSize:fontSize(light,55)}}>{light}</span><span className="ro-title-heavy" style={{fontSize:fontSize(heavy,65)}}>{heavy}</span></h2>
        </div>})}</div>
        <div className="ro-actions"><button type="button" className="ro-primary" onClick={()=>onView(current.id)}><BookOpen size={16}/> Ingredients &amp; Steps</button><button type="button" className="ro-secondary" onClick={()=>onFavorite(current.id)} aria-pressed={favorites.includes(current.id)}><Heart size={16} fill={favorites.includes(current.id)?'currentColor':'none'}/>{favorites.includes(current.id)?'Saved':'Save'}</button></div>
        <div className="ro-info-box"><div className="ro-info-label">RECIPE OVERVIEW</div><div className="ro-info-area">{recipes.map((r,i)=><div key={r.id} className="ro-info-item" ref={el=>{infos.current[i]=el}} aria-hidden={i!==index}><span className="ro-info-chip">{r.category}</span><h3>{r.name}</h3><div className="ro-info-meta"><Clock3 size={13}/>{r.time} min <Users size={13}/>{r.servings} servings</div><div className="ro-stars" role="group" aria-label={`Your rating for ${r.name}`}>{[1,2,3,4,5].map(n=><button key={n} type="button" className={n<=(ratings[r.id]??0)?'':'off'} aria-label={`Rate ${n} star${n>1?'s':''}`} aria-pressed={n<=(ratings[r.id]??0)} disabled={!onRate} onClick={()=>onRate?.(r.id,n)}><Star size={15} fill="currentColor"/></button>)}<small>{ratings[r.id]?`${ratings[r.id]}/5 · your rating`:'Tap to rate'}</small></div><p>{r.description}</p><button type="button" className="ro-info-link" onClick={()=>onView(r.id)}>View Ingredients →</button></div>)}</div></div>
        <div className="ro-bottom"><button type="button" className="ro-arrow" onClick={()=>step(-1)} aria-label="Previous recipe"><ArrowLeft size={18}/></button><div className="ro-thumbs"><div className="ro-track" style={{transform:`translateX(${-start*130}px)`}}>{recipes.map((r,i)=><div className="ro-thumb" key={r.id}><button type="button" className={i===index?'active':''} onClick={()=>go(i)} aria-label={`Show ${r.name}`}><FoodImage image={r.image} name={r.name} emoji={r.emoji} small/><span>{r.name}</span></button></div>)}</div></div><button type="button" className="ro-arrow" onClick={()=>step(1)} aria-label="Next recipe"><ArrowRight size={18}/></button></div>
        <div className="ro-count">{String(index+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</div>
      </div>
    </div>
  </div>
}