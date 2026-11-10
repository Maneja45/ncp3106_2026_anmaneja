import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, ChefHat, Clock3, Heart, ImagePlus, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import RecipeOrbit from '../ui/RecipeOrbit'

type Recipe = {
  id: string
  name: string
  category: string
  description: string
  time: number
  servings: number
  ingredients: string[]
  instructions: string[]
  image: string
  custom: boolean
}
type RecipeForm = {
  name: string
  category: string
  description: string
  time: string
  servings: string
  ingredients: string
  instructions: string
  image: string
}

const builtIn: Recipe[] = [
  {id:'tinola',name:'Chicken Tinola',category:'Filipino',description:'A comforting Filipino ginger chicken soup with green papaya and leafy greens.',time:45,servings:4,ingredients:['500 g chicken, cut into serving pieces','1 thumb-sized ginger, sliced','1 onion, sliced','3 cloves garlic, minced','1 green papaya, peeled and sliced','2 cups malunggay or chili leaves','4 cups water or low-sodium chicken broth','1 tbsp cooking oil','Fish sauce and pepper, to taste'],instructions:['Heat oil and sauté garlic, onion, and ginger until fragrant.','Add chicken and cook until lightly browned.','Pour in water or broth, bring to a boil, then simmer until chicken is cooked through.','Add green papaya and cook until tender.','Season lightly with fish sauce and pepper.','Stir in leafy greens, cook briefly, and serve warm.'],image:'',custom:false},
  {id:'adobo',name:'Chicken Adobo',category:'Filipino',description:'A classic savory Filipino chicken dish simmered in vinegar, soy sauce, garlic, and bay leaves.',time:55,servings:4,ingredients:['500 g chicken','1/4 cup soy sauce','1/4 cup vinegar','5 cloves garlic, crushed','2 bay leaves','1 tsp whole peppercorns','1/2 cup water','1 tsp cooking oil'],instructions:['Combine chicken, soy sauce, and garlic; marinate briefly if time allows.','Heat oil and lightly brown chicken.','Add marinade, water, bay leaves, and peppercorns.','Bring to a simmer, then add vinegar without stirring for the first few minutes.','Cook until the chicken is tender and the sauce has reduced.','Serve with rice and vegetables.'],image:'',custom:false},
  {id:'pinakbet',name:'Vegetable Pinakbet',category:'Vegetarian',description:'A vegetable-rich Filipino dish for meal preparation.',time:35,servings:4,ingredients:['1 small eggplant, sliced','1 cup squash, cubed','1 bitter melon, sliced','1 cup okra','1 cup string beans','2 tomatoes, chopped','1 onion, chopped','3 cloves garlic, minced','1 tbsp cooking oil','1 cup water','Salt or a preferred low-sodium seasoning, to taste'],instructions:['Wash and prepare all vegetables.','Heat oil and sauté garlic, onion, and tomatoes.','Add squash and water, then simmer until partly tender.','Add eggplant, string beans, okra, and bitter melon.','Cover and cook until vegetables are tender but not mushy.','Season lightly and serve warm.'],image:'',custom:false},
  {id:'rice-bowl',name:'Chicken Rice Bowl',category:'Meal Prep',description:'A balanced rice bowl with chicken and colorful vegetables for easy meal prep.',time:30,servings:2,ingredients:['250 g boneless chicken breast','2 cups cooked rice','1 cup broccoli','1 carrot, sliced','1 tbsp cooking oil','1 clove garlic, minced','Black pepper, to taste','Lemon or calamansi juice, to taste'],instructions:['Cook rice according to package instructions.','Season chicken with garlic, pepper, and citrus juice.','Cook chicken in a pan until fully cooked, then slice.','Steam broccoli and carrots until tender-crisp.','Divide rice, chicken, and vegetables into two bowls.','Cool promptly before storing any portions for later.'],image:'',custom:false},
]

const RECIPE_KEY='sustansyabox_recipes'
const FAVORITE_KEY='sustansyabox_recipe_favorites'
const PHOTO_KEY='sustansyabox_recipe_photos'
const categories=['All Recipes','Filipino','Meal Prep','Vegetarian','Favorites','My Recipes']
const blankForm:RecipeForm={name:'',category:'Meal Prep',description:'',time:'30',servings:'2',ingredients:'',instructions:'',image:''}

function stored<T>(key:string,fallback:T):T {
  try {const value=localStorage.getItem(key);return value?JSON.parse(value) as T:fallback}
  catch {return fallback}
}
function loadRecipes():Recipe[]{
  const saved=stored<Recipe[]>(RECIPE_KEY,[])
  return [...builtIn,...(Array.isArray(saved)?saved.filter(r=>r&&r.custom):[])]
}
function loadFavorites():string[]{const v=stored<string[]>(FAVORITE_KEY,[]);return Array.isArray(v)?v:[]}
function loadPhotos():Record<string,string>{const v=stored<Record<string,string>>(PHOTO_KEY,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}

const input:CSSProperties={width:'100%',border:'1px solid var(--border,#dce2d6)',background:'var(--surface,#fffdf7)',color:'var(--text,#263729)',borderRadius:12,padding:'11px 13px',font:'inherit',boxSizing:'border-box'}
const primary:CSSProperties={border:0,borderRadius:12,background:'var(--primary,#66835c)',color:'#fff',padding:'11px 16px',font:'inherit',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,justifyContent:'center'}
const secondary:CSSProperties={...primary,background:'var(--surface,#fffdf7)',color:'var(--text,#263729)',border:'1px solid var(--border,#dce2d6)'}
const fieldLabel:CSSProperties={display:'grid',gap:7,fontSize:13,fontWeight:700}

function RecipePhoto({image,name}:{image:string;name:string}){
  const [failed,setFailed]=useState(false)
  useEffect(()=>setFailed(false),[image])
  return <div style={{height:200,background:'#f0ecdF',display:'grid',placeItems:'center',overflow:'hidden'}}>
    {image&&!failed?<img src={image} alt={name} onError={()=>setFailed(true)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<ChefHat size={65} color="#91a383"/>}
  </div>
}

export default function Recipes(){
  const [recipes,setRecipes]=useState<Recipe[]>(loadRecipes)
  const [photos,setPhotos]=useState<Record<string,string>>(loadPhotos)
  const [favorites,setFavorites]=useState<string[]>(loadFavorites)
  const [search,setSearch]=useState('')
  const [filter,setFilter]=useState('All Recipes')
  const [selectedId,setSelectedId]=useState<string|null>(null)
  const [formOpen,setFormOpen]=useState(false)
  const [editingId,setEditingId]=useState<string|null>(null)
  const [form,setForm]=useState<RecipeForm>(blankForm)
  const [photoError,setPhotoError]=useState('')

  useEffect(()=>{try{localStorage.setItem(RECIPE_KEY,JSON.stringify(recipes.filter(r=>r.custom).map(r=>({...r,image:''}))))}catch{}},[recipes])
  useEffect(()=>{try{localStorage.setItem(FAVORITE_KEY,JSON.stringify(favorites))}catch{}},[favorites])
  useEffect(()=>{try{localStorage.setItem(PHOTO_KEY,JSON.stringify(photos))}catch{}},[photos])

  const filtered=useMemo(()=>recipes.filter(recipe=>{
    const q=search.trim().toLowerCase()
    const match=!q||[recipe.name,recipe.description,...recipe.ingredients].some(value=>value.toLowerCase().includes(q))
    const category=filter==='All Recipes'||filter==='Favorites'&&favorites.includes(recipe.id)||filter==='My Recipes'&&recipe.custom||recipe.category===filter
    return match&&category
  }),[recipes,search,filter,favorites])
  const selected=recipes.find(r=>r.id===selectedId)??null
  const toggleFavorite=(id:string)=>setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])
  const openNew=()=>{setEditingId(null);setForm({...blankForm});setPhotoError('');setFormOpen(true)}
  const edit=(recipe:Recipe)=>{
    if(!recipe.custom)return
    setEditingId(recipe.id)
    setForm({name:recipe.name,category:recipe.category,description:recipe.description,time:String(recipe.time),servings:String(recipe.servings),ingredients:recipe.ingredients.join('\n'),instructions:recipe.instructions.join('\n'),image:photos[recipe.id]||recipe.image||''})
    setPhotoError('');setSelectedId(null);setFormOpen(true)
  }
  const upload=(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0]
    if(!file)return
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setPhotoError('Choose a JPG, PNG, or WebP image.');event.target.value='';return}
    if(file.size>1024*1024){setPhotoError('Choose an image smaller than 1 MB.');event.target.value='';return}
    const reader=new FileReader()
    reader.onload=()=>{if(typeof reader.result==='string'){setForm(prev=>({...prev,image:reader.result as string}));setPhotoError('')}}
    reader.onerror=()=>setPhotoError('Unable to read this image.')
    reader.readAsDataURL(file)
    event.target.value=''
  }
  const save=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    const name=form.name.trim()
    if(!name)return
    const id=editingId??(typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`custom-${Date.now()}`)
    const recipe:Recipe={id,name,category:form.category,description:form.description.trim(),time:Math.max(1,Number(form.time)||1),servings:Math.max(1,Number(form.servings)||1),ingredients:form.ingredients.split('\n').map(s=>s.trim()).filter(Boolean),instructions:form.instructions.split('\n').map(s=>s.trim()).filter(Boolean),image:'',custom:true}
    setRecipes(prev=>editingId?prev.map(r=>r.id===id?recipe:r):[...prev,recipe])
    setPhotos(prev=>{const next={...prev};if(form.image)next[id]=form.image;else delete next[id];return next})
    setFormOpen(false);setEditingId(null);setFilter('My Recipes');setSearch('')
  }
  const remove=(id:string)=>{
    if(!window.confirm('Delete this recipe?'))return
    setRecipes(prev=>prev.filter(r=>!(r.id===id&&r.custom)))
    setFavorites(prev=>prev.filter(x=>x!==id))
    setPhotos(prev=>{const next={...prev};delete next[id];return next})
    setSelectedId(null)
  }

  return <div style={{height:'100%',minHeight:0,width:'100%',display:'flex',flexDirection:'column',overflow:'hidden',gap:12,boxSizing:'border-box',padding:'clamp(10px,1.5vh,20px)'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexShrink:0}}>
      <div><div style={{fontSize:11,letterSpacing:'.15em',color:'var(--primary,#66835c)',fontWeight:800}}>SUSTANSYABOX / HEALTHY EATING</div><h1 style={{fontSize:'clamp(22px,2.5vw,34px)',margin:'3px 0 0',lineHeight:1.1,color:'var(--text,#263729)'}}>Discover Recipes</h1></div>
      <button type="button" style={primary} onClick={openNew}><Plus size={17}/> Create Recipe</button>
    </div>
    <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:9,flexShrink:0}}>
      <div style={{position:'relative',flex:'1 1 190px',maxWidth:320}}><Search size={17} style={{position:'absolute',top:'50%',left:12,transform:'translateY(-50%)',color:'var(--muted,#778172)'}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search recipes or ingredients" aria-label="Search recipes" style={{...input,paddingLeft:38}}/></div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{categories.map(category=><button type="button" key={category} onClick={()=>setFilter(category)} style={{...secondary,padding:'9px 12px',borderRadius:999,fontSize:12,background:filter===category?'var(--primary,#66835c)':'var(--surface,#fffdf7)',color:filter===category?'white':'var(--text,#263729)'}}>{category}</button>)}</div>
    </div>
    <div style={{flex:'1 1 0',minHeight:0,width:'100%',display:'flex',overflow:'hidden'}}>
      {filtered.length>0?<RecipeOrbit recipes={filtered.map(r=>({...r,image:photos[r.id]||r.image}))} favorites={favorites} onFavorite={toggleFavorite} onView={setSelectedId}/>:<div style={{flex:1,border:'1px solid var(--border,#dce2d6)',borderRadius:22,display:'grid',placeItems:'center',textAlign:'center',color:'var(--muted,#778172)',padding:24}}><div><ChefHat size={45}/><h3>No recipes found</h3><p>Try another search or category.</p><button type="button" style={secondary} onClick={()=>{setSearch('');setFilter('All Recipes')}}>Show all recipes</button></div></div>}
    </div>
    <AnimatePresence>
      {selected&&<motion.div key="details" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedId(null)}} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(20,35,22,.55)',display:'grid',placeItems:'center',padding:16}}>
        <motion.div role="dialog" aria-modal="true" aria-label={`${selected.name} recipe`} initial={{opacity:0,y:20,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:15}} style={{width:'min(690px,100%)',maxHeight:'min(88dvh,850px)',overflowY:'auto',borderRadius:22,background:'var(--surface,#fffdf7)',color:'var(--text,#263729)',boxShadow:'0 25px 70px rgba(0,0,0,.25)'}}>
          <RecipePhoto image={photos[selected.id]||selected.image} name={selected.name}/>
          <div style={{padding:25}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><span style={{fontSize:12,fontWeight:800,color:'var(--primary,#66835c)'}}>{selected.category}</span><button type="button" style={secondary} onClick={()=>setSelectedId(null)} aria-label="Close details"><X size={18}/></button></div>
            <h2 style={{fontSize:30,margin:'8px 0'}}>{selected.name}</h2><p style={{lineHeight:1.6,color:'var(--muted,#778172)'}}>{selected.description}</p>
            <div style={{display:'flex',gap:18,alignItems:'center',fontSize:13,margin:'18px 0'}}><span style={{display:'flex',gap:6,alignItems:'center'}}><Clock3 size={16}/>{selected.time} min</span><span style={{display:'flex',gap:6,alignItems:'center'}}><Users size={16}/>{selected.servings} servings</span><button type="button" style={{...secondary,padding:'7px 11px'}} onClick={()=>toggleFavorite(selected.id)}><Heart size={15} fill={favorites.includes(selected.id)?'currentColor':'none'}/>{favorites.includes(selected.id)?'Saved':'Save'}</button></div>
            <h3 style={{display:'flex',alignItems:'center',gap:8}}><BookOpen size={19}/> Ingredients</h3><ul style={{paddingLeft:22,lineHeight:1.9}}>{selected.ingredients.map((ingredient,i)=><li key={i}>{ingredient}</li>)}</ul>
            <h3>Preparation Instructions</h3><ol style={{paddingLeft:22,lineHeight:1.9}}>{selected.instructions.map((instruction,i)=><li key={i}>{instruction}</li>)}</ol>
            <p style={{fontSize:12,color:'var(--muted,#778172)'}}>Nutrition values will be shown when verified nutritional data is connected.</p>
            {selected.custom&&<div style={{display:'flex',gap:9,marginTop:18}}><button type="button" style={secondary} onClick={()=>edit(selected)}><Pencil size={16}/> Edit Recipe</button><button type="button" style={{...secondary,color:'#b94c4c'}} onClick={()=>remove(selected.id)}><Trash2 size={16}/> Delete</button></div>}
          </div>
        </motion.div>
      </motion.div>}
      {formOpen&&<motion.div key="form" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>{if(e.target===e.currentTarget)setFormOpen(false)}} style={{position:'fixed',inset:0,zIndex:1001,background:'rgba(20,35,22,.55)',display:'grid',placeItems:'center',padding:16}}>
        <motion.form role="dialog" aria-modal="true" aria-label={editingId?'Edit recipe':'Create recipe'} onSubmit={save} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}} style={{width:'min(610px,100%)',maxHeight:'88dvh',overflowY:'auto',borderRadius:22,background:'var(--surface,#fffdf7)',color:'var(--text,#263729)',padding:25,display:'grid',gap:15,boxSizing:'border-box'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={{margin:0}}>{editingId?'Edit Recipe':'Create Recipe'}</h2><button type="button" style={secondary} onClick={()=>setFormOpen(false)} aria-label="Close form"><X size={18}/></button></div>
          <label style={fieldLabel}>Recipe Photo <div style={{border:'1px dashed var(--border,#dce2d6)',borderRadius:13,minHeight:95,display:'grid',placeItems:'center',overflow:'hidden'}}>{form.image?<img src={form.image} alt="Recipe preview" style={{maxHeight:170,maxWidth:'100%',objectFit:'contain'}}/>:<ImagePlus size={32} color="#91a383"/>}</div><input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></label>
          {photoError&&<p role="alert" style={{color:'#b94c4c',fontSize:12,margin:0}}>{photoError}</p>}
          <label style={fieldLabel}>Recipe Name <input style={input} required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></label>
          <label style={fieldLabel}>Category <select style={input} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}><option>Filipino</option><option>Meal Prep</option><option>Vegetarian</option></select></label>
          <label style={fieldLabel}>Description <textarea style={input} rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><label style={fieldLabel}>Time (minutes) <input style={input} type="number" min={1} required value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/></label><label style={fieldLabel}>Servings <input style={input} type="number" min={1} required value={form.servings} onChange={e=>setForm(p=>({...p,servings:e.target.value}))}/></label></div>
          <label style={fieldLabel}>Ingredients (one per line) <textarea style={input} rows={4} required value={form.ingredients} onChange={e=>setForm(p=>({...p,ingredients:e.target.value}))}/></label>
          <label style={fieldLabel}>Instructions (one step per line) <textarea style={input} rows={4} required value={form.instructions} onChange={e=>setForm(p=>({...p,instructions:e.target.value}))}/></label>
          <button type="submit" style={primary}>{editingId?'Save Changes':'Create Recipe'}</button>
        </motion.form>
      </motion.div>}
    </AnimatePresence>
  </div>
}
