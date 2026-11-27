import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  BookOpen,
  Clock3,
  Heart,
  ImagePlus,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import RecipeOrbit from '../ui/RecipeOrbit'

// ==========================================
// TYPES
// ==========================================

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
  emoji: string
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
  emoji: string
}

// ==========================================
// DATA
// ==========================================

// Photos live in  public/recipes/  (e.g. public/recipes/adobo.png).
// BASE_URL keeps the path working on localhost and on GitHub Pages.
// If a photo is missing, the food emoji is shown instead.
const photo = (file: string) => `${import.meta.env.BASE_URL}recipes/${file}`

const builtIn: Recipe[] = [
  {
    id: 'adobo',
    name: 'Chicken Adobo',
    category: 'Main Dish',
    emoji: '🍗',
    description: 'The Philippines’ best-known dish: chicken simmered in vinegar, soy sauce, garlic, and bay leaves.',
    time: 55,
    servings: 4,
    ingredients: [
      '500 g chicken, cut into pieces',
      '1/4 cup low-sodium soy sauce',
      '1/4 cup cane vinegar',
      '5 cloves garlic, crushed',
      '2 bay leaves',
      '1 tsp whole peppercorns',
      '1/2 cup water',
      '1 tsp cooking oil',
    ],
    instructions: [
      'Combine chicken, soy sauce, and garlic; marinate for 15–30 minutes if time allows.',
      'Heat oil and lightly brown the chicken.',
      'Add the marinade, water, bay leaves, and peppercorns.',
      'Bring to a simmer, then add vinegar without stirring for the first few minutes.',
      'Cook until the chicken is tender and the sauce has reduced.',
      'Serve with rice and steamed vegetables.',
    ],
    image: photo('adobo.png'),
    custom: false,
  },
  {
    id: 'sinigang',
    name: 'Sinigang na Hipon',
    category: 'Soup',
    emoji: '🍲',
    description: 'A sour tamarind soup with shrimp and vegetables — a comforting everyday favorite.',
    time: 35,
    servings: 4,
    ingredients: [
      '300 g shrimp, cleaned',
      '6 cups water',
      '1 pack tamarind soup base or 200 g fresh sampalok',
      '2 tomatoes, quartered',
      '1 onion, quartered',
      '1 radish (labanos), sliced',
      '1 cup sitaw (string beans), cut',
      '2 cups kangkong',
      '2 green chili (siling haba)',
      'Fish sauce, to taste (use sparingly)',
    ],
    instructions: [
      'Boil water with tomatoes and onion until soft.',
      'Add tamarind and radish; simmer for 5 minutes.',
      'Add string beans and green chili; cook for 3 minutes.',
      'Add shrimp and cook just until pink.',
      'Season lightly with fish sauce.',
      'Turn off the heat, add kangkong, and serve hot.',
    ],
    image: photo('sinigang.png'),
    custom: false,
  },
  {
    id: 'tinola',
    name: 'Chicken Tinola',
    category: 'Soup',
    emoji: '🥣',
    description: 'A gentle ginger chicken soup with green papaya and malunggay leaves.',
    time: 45,
    servings: 4,
    ingredients: [
      '500 g chicken, cut into serving pieces',
      '1 thumb-sized ginger, sliced',
      '1 onion, sliced',
      '3 cloves garlic, minced',
      '1 green papaya, peeled and sliced',
      '2 cups malunggay or chili leaves',
      '4 cups water or low-sodium chicken broth',
      '1 tbsp cooking oil',
      'Fish sauce and pepper, to taste',
    ],
    instructions: [
      'Heat oil and sauté garlic, onion, and ginger until fragrant.',
      'Add chicken and cook until lightly browned.',
      'Pour in water or broth, bring to a boil, then simmer until the chicken is cooked through.',
      'Add green papaya and cook until tender.',
      'Season lightly with fish sauce and pepper.',
      'Stir in the leafy greens, cook briefly, and serve warm.',
    ],
    image: photo('tinola.png'),
    custom: false,
  },
  {
    id: 'kare-kare',
    name: 'Kare-Kare',
    category: 'Main Dish',
    emoji: '🥜',
    description: 'A rich peanut stew with oxtail or beef and vegetables, traditionally served with bagoong.',
    time: 120,
    servings: 5,
    ingredients: [
      '800 g oxtail or beef shank',
      '1/2 cup peanut butter (unsweetened)',
      '1/4 cup ground toasted rice',
      '1 tbsp annatto (atsuete) powder',
      '1 bundle pechay',
      '1 cup sitaw (string beans)',
      '1 eggplant, sliced',
      '1 banana heart (puso ng saging), sliced',
      '1 onion and 4 cloves garlic',
      'Bagoong, on the side (small amount)',
    ],
    instructions: [
      'Boil the meat until tender (about 1.5 hours); keep the broth.',
      'Sauté garlic and onion, then add the meat and about 4 cups of broth.',
      'Stir in peanut butter, annatto, and ground rice until the sauce thickens.',
      'Blanch the vegetables separately so they stay bright.',
      'Arrange vegetables on top of the stew.',
      'Serve with a small amount of bagoong on the side.',
    ],
    image: photo('kare-kare.png'),
    custom: false,
  },
  {
    id: 'pinakbet',
    name: 'Pinakbet',
    category: 'Vegetable',
    emoji: '🥘',
    description: 'An Ilocano vegetable stew with squash, eggplant, okra, ampalaya, and string beans.',
    time: 35,
    servings: 4,
    ingredients: [
      '1 small eggplant, sliced',
      '1 cup squash, cubed',
      '1 ampalaya (bitter melon), sliced',
      '1 cup okra',
      '1 cup string beans',
      '2 tomatoes, chopped',
      '1 onion, chopped',
      '3 cloves garlic, minced',
      '1 tbsp cooking oil',
      '1 tbsp bagoong (or a low-sodium seasoning)',
    ],
    instructions: [
      'Wash and prepare all vegetables.',
      'Heat oil and sauté garlic, onion, and tomatoes.',
      'Add bagoong and squash with 1 cup water; simmer until partly tender.',
      'Add eggplant, string beans, okra, and ampalaya.',
      'Cover and cook until tender but not mushy.',
      'Serve warm.',
    ],
    image: photo('pinakbet.png'),
    custom: false,
  },
  {
    id: 'monggo',
    name: 'Ginisang Monggo',
    category: 'Vegetable',
    emoji: '🫘',
    description: 'Sautéed mung bean stew with malunggay — a high-fiber Friday staple.',
    time: 50,
    servings: 4,
    ingredients: [
      '1 cup mung beans (monggo), rinsed',
      '5 cups water',
      '3 cloves garlic, minced',
      '1 onion, chopped',
      '1 tomato, chopped',
      '100 g pork or shrimp (optional)',
      '2 cups malunggay or ampalaya leaves',
      '1 tbsp cooking oil',
      'Salt or fish sauce, to taste',
    ],
    instructions: [
      'Boil mung beans in water until soft and starting to split (about 30 minutes).',
      'In another pan, sauté garlic, onion, and tomato; add pork or shrimp if using.',
      'Pour the cooked mung beans into the pan and simmer for 5 minutes.',
      'Season lightly.',
      'Add the leaves, cook for 1 minute, and serve.',
    ],
    image: photo('monggo.png'),
    custom: false,
  },
  {
    id: 'pancit',
    name: 'Pancit Bihon',
    category: 'Noodles',
    emoji: '🍜',
    description: 'Stir-fried rice noodles with chicken and vegetables — served at birthdays for long life.',
    time: 40,
    servings: 5,
    ingredients: [
      '250 g bihon (rice noodles)',
      '200 g chicken breast, sliced thin',
      '1 carrot, julienned',
      '2 cups cabbage, shredded',
      '1 cup snow peas (sitsaro)',
      '1 onion and 4 cloves garlic',
      '2 cups low-sodium chicken broth',
      '2 tbsp low-sodium soy sauce',
      'Calamansi, for serving',
    ],
    instructions: [
      'Soak the bihon in water for 10 minutes, then drain.',
      'Sauté garlic and onion, then cook the chicken.',
      'Add carrot and snow peas; cook for 2 minutes.',
      'Pour in broth and soy sauce; bring to a boil.',
      'Add the noodles and toss until the liquid is absorbed.',
      'Fold in the cabbage and serve with calamansi.',
    ],
    image: photo('pancit.png'),
    custom: false,
  },
  {
    id: 'inasal',
    name: 'Chicken Inasal',
    category: 'Main Dish',
    emoji: '🍢',
    description: 'Bacolod-style grilled chicken marinated in calamansi, lemongrass, and garlic.',
    time: 60,
    servings: 4,
    ingredients: [
      '4 chicken legs or thighs',
      '1/2 cup calamansi juice',
      '1/4 cup cane vinegar',
      '2 stalks lemongrass (tanglad), pounded',
      '1 head garlic, minced',
      '1 thumb ginger, grated',
      '1 tsp black pepper',
      '2 tbsp annatto oil, for basting',
    ],
    instructions: [
      'Mix calamansi, vinegar, lemongrass, garlic, ginger, and pepper.',
      'Marinate the chicken for at least 1 hour (overnight is best).',
      'Grill over medium heat, turning often.',
      'Baste with annatto oil while grilling.',
      'Cook until the juices run clear.',
      'Serve with rice and a fresh vegetable side.',
    ],
    image: photo('inasal.png'),
    custom: false,
  },
]

const RECIPE_KEY = 'sustansyabox_recipes'
const FAVORITE_KEY = 'sustansyabox_recipe_favorites'
const PHOTO_KEY = 'sustansyabox_recipe_photos'
const RATING_KEY = 'sustansyabox_recipe_ratings'

const CATEGORY_OPTIONS = ['Main Dish', 'Soup', 'Vegetable', 'Noodles']
const categories = ['All Recipes', ...CATEGORY_OPTIONS, 'Favorites', 'My Recipes']
const EMOJIS = ['🍗', '🍲', '🥣', '🥘', '🫘', '🍜', '🍢', '🐟', '🍳', '🥗']

const DEFAULT_EMOJI: Record<string, string> = {
  'Main Dish': '🍗',
  Soup: '🍲',
  Vegetable: '🥘',
  Noodles: '🍜',
}

const defaultEmoji = (category: string) => DEFAULT_EMOJI[category] ?? '🍽️'

// Older saved recipes used Filipino / Meal Prep / Vegetarian
const LEGACY_CATEGORY: Record<string, string> = {
  Filipino: 'Main Dish',
  'Meal Prep': 'Main Dish',
  Vegetarian: 'Vegetable',
}

const blankForm: RecipeForm = {
  name: '',
  category: 'Main Dish',
  description: '',
  time: '30',
  servings: '2',
  ingredients: '',
  instructions: '',
  image: '',
  emoji: '🍗',
}

// ==========================================
// STORAGE
// ==========================================

function stored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function loadRecipes(): Recipe[] {
  const saved = stored<Recipe[]>(RECIPE_KEY, [])
  const custom = Array.isArray(saved)
    ? saved
        .filter(recipe => recipe && recipe.custom)
        .map(recipe => {
          const category = LEGACY_CATEGORY[recipe.category] ?? recipe.category
          return { ...recipe, category, emoji: recipe.emoji || defaultEmoji(category) }
        })
    : []

  return [...builtIn, ...custom]
}

function loadFavorites(): string[] {
  const value = stored<string[]>(FAVORITE_KEY, [])
  return Array.isArray(value) ? value : []
}

function loadRatings(): Record<string, number> {
  const value = stored<Record<string, number>>(RATING_KEY, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function loadPhotos(): Record<string, string> {
  const value = stored<Record<string, string>>(PHOTO_KEY, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

// ==========================================
// PHOTO (falls back to the food emoji)
// ==========================================

function RecipePhoto({ image, name, emoji }: { image: string; name: string; emoji: string }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [image])

  return (
    <div className="rc-photo">
      {image && !failed ? (
        <img src={image} alt={name} onError={() => setFailed(true)} />
      ) : (
        <span className="rc-photo-plate" role="img" aria-label={name}>
          {emoji}
        </span>
      )}
    </div>
  )
}

// ==========================================
// RECIPES PAGE
// ==========================================

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes)
  const [photos, setPhotos] = useState<Record<string, string>>(loadPhotos)
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)
  const [ratings, setRatings] = useState<Record<string, number>>(loadRatings)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All Recipes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RecipeForm>(blankForm)
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(
        RECIPE_KEY,
        JSON.stringify(recipes.filter(recipe => recipe.custom).map(recipe => ({ ...recipe, image: '' })))
      )
    } catch {
      /* storage full or blocked */
    }
  }, [recipes])

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites))
    } catch {
      /* storage full or blocked */
    }
  }, [favorites])

  useEffect(() => {
    try {
      localStorage.setItem(PHOTO_KEY, JSON.stringify(photos))
    } catch {
      /* storage full or blocked */
    }
  }, [photos])

  useEffect(() => {
    try {
      localStorage.setItem(RATING_KEY, JSON.stringify(ratings))
    } catch {
      /* storage full or blocked */
    }
  }, [ratings])

  // Close dialogs with Escape
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setFormOpen(false)
      setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const inCategory = (recipe: Recipe, category: string) =>
    category === 'All Recipes' ||
    (category === 'Favorites' && favorites.includes(recipe.id)) ||
    (category === 'My Recipes' && recipe.custom) ||
    recipe.category === category

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return recipes.filter(recipe => {
      const match =
        !query ||
        [recipe.name, recipe.description, ...recipe.ingredients].some(value =>
          value.toLowerCase().includes(query)
        )
      return match && inCategory(recipe, filter)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, search, filter, favorites])

  const selected = recipes.find(recipe => recipe.id === selectedId) ?? null

  const toggleFavorite = (id: string) =>
    setFavorites(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  // Tap the same star again to clear the rating
  const rate = (id: string, stars: number) =>
    setRatings(prev => {
      const next = { ...prev }
      if (next[id] === stars) delete next[id]
      else next[id] = stars
      return next
    })

  const openNew = () => {
    setEditingId(null)
    setForm({ ...blankForm })
    setPhotoError('')
    setFormOpen(true)
  }

  const edit = (recipe: Recipe) => {
    if (!recipe.custom) return

    setEditingId(recipe.id)
    setForm({
      name: recipe.name,
      category: recipe.category,
      description: recipe.description,
      time: String(recipe.time),
      servings: String(recipe.servings),
      ingredients: recipe.ingredients.join('\n'),
      instructions: recipe.instructions.join('\n'),
      image: photos[recipe.id] || recipe.image || '',
      emoji: recipe.emoji,
    })
    setPhotoError('')
    setSelectedId(null)
    setFormOpen(true)
  }

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > 1024 * 1024) {
      setPhotoError('Choose an image smaller than 1 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm(prev => ({ ...prev, image: reader.result as string }))
        setPhotoError('')
      }
    }
    reader.onerror = () => setPhotoError('Unable to read this image.')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = form.name.trim()
    if (!name) return

    const id =
      editingId ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `custom-${Date.now()}`)

    const recipe: Recipe = {
      id,
      name,
      category: form.category,
      description: form.description.trim(),
      time: Math.max(1, Number(form.time) || 1),
      servings: Math.max(1, Number(form.servings) || 1),
      ingredients: form.ingredients.split('\n').map(s => s.trim()).filter(Boolean),
      instructions: form.instructions.split('\n').map(s => s.trim()).filter(Boolean),
      image: '',
      emoji: form.emoji || defaultEmoji(form.category),
      custom: true,
    }

    setRecipes(prev => (editingId ? prev.map(r => (r.id === id ? recipe : r)) : [...prev, recipe]))
    setPhotos(prev => {
      const next = { ...prev }
      if (form.image) next[id] = form.image
      else delete next[id]
      return next
    })
    setFormOpen(false)
    setEditingId(null)
    setFilter('My Recipes')
    setSearch('')
  }

  const remove = (id: string) => {
    if (!window.confirm('Delete this recipe?')) return

    setRecipes(prev => prev.filter(r => !(r.id === id && r.custom)))
    setFavorites(prev => prev.filter(x => x !== id))
    setRatings(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setPhotos(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSelectedId(null)
  }

  const isSaved = selected ? favorites.includes(selected.id) : false

  return (
    <MotionConfig reducedMotion="user">
      <div className="rc-page">
        <style>{`
          /* ================= THEME ================= */
          .rc-page {
            --rc-text: var(--text, #203a2e);
            --rc-muted: var(--muted, #6f8176);
            --rc-border: var(--border, #e2eadc);
            --rc-surface: var(--surface, #ffffff);
            --rc-primary: var(--primary, #376b50);

            --rc-ink: #1f3d2c;
            --rc-glass: rgba(255, 255, 255, 0.86);
            --rc-soft: #e9f1e8;
            --rc-tile: #f6f7f3;
            --rc-plate: #f3eedf;
            --rc-plate-rim: #fbf8ef;
            --rc-danger: #b94c4c;
            --rc-overlay: rgba(20, 35, 22, 0.55);
            --rc-on-primary: #ffffff;
          }

          [data-theme="dark"] .rc-page {
            --rc-ink: #eef6e6;
            --rc-glass: rgba(22, 36, 29, 0.82);
            --rc-soft: #27412f;
            --rc-tile: #22372b;
            --rc-plate: #2c4033;
            --rc-plate-rim: #34493b;
            --rc-danger: #ee8b80;
            --rc-overlay: rgba(4, 10, 6, 0.7);
          }

          /* ================= SHELL ================= */
          .rc-page {
            width: 100%;
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: hidden;
            color: var(--rc-text);
          }

          .rc-page *,
          .rc-page *::before,
          .rc-page *::after {
            box-sizing: border-box;
          }

          .rc-page button,
          .rc-page input,
          .rc-page select,
          .rc-page textarea {
            font: inherit;
          }

          .rc-page button {
            cursor: pointer;
          }

          .rc-page button:focus-visible,
          .rc-page input:focus-visible,
          .rc-page select:focus-visible,
          .rc-page textarea:focus-visible {
            outline: 2px solid var(--rc-primary);
            outline-offset: 2px;
          }

          /* ================= HEADER ================= */
          .rc-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            flex-shrink: 0;
          }

          .rc-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 12px;
            border: 1px solid var(--rc-border);
            background: var(--rc-surface);
            color: var(--rc-text);
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
            transition: transform 0.2s ease, background-color 0.2s ease;
          }

          .rc-btn:hover {
            transform: translateY(-1px);
          }

          .rc-btn.primary {
            border-color: var(--rc-primary);
            background: var(--rc-primary);
            color: var(--rc-on-primary);
          }

          .rc-btn.danger {
            color: var(--rc-danger);
          }

          .rc-btn.icon {
            width: 38px;
            height: 38px;
            padding: 0;
          }

          /* ================= TOOLBAR ================= */
          .rc-toolbar {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            flex-shrink: 0;
            padding: 8px;
            border-radius: 16px;
            border: 1px solid var(--rc-border);
            background: var(--rc-glass);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }

          .rc-search {
            position: relative;
            flex: 1 1 220px;
            max-width: 320px;
          }

          .rc-search svg {
            position: absolute;
            top: 50%;
            left: 12px;
            transform: translateY(-50%);
            color: var(--rc-muted);
          }

          .rc-search input {
            width: 100%;
            padding: 9px 12px 9px 36px;
            border-radius: 11px;
            border: 1px solid var(--rc-border);
            background: var(--rc-surface);
            color: var(--rc-text);
            font-size: 13px;
          }

          .rc-pills {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
          }

          .rc-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 99px;
            border: 1px solid transparent;
            background: transparent;
            color: var(--rc-text);
            font-size: 12px;
            font-weight: 700;
            transition: background-color 0.2s ease, color 0.2s ease;
          }

          .rc-pill:hover {
            background: var(--rc-soft);
          }

          .rc-pill b {
            min-width: 18px;
            padding: 1px 5px;
            border-radius: 99px;
            background: var(--rc-soft);
            color: var(--rc-muted);
            font-size: 10px;
          }

          .rc-pill.on {
            background: var(--rc-primary);
            color: var(--rc-on-primary);
          }

          .rc-pill.on b {
            background: rgba(255, 255, 255, 0.22);
            color: inherit;
          }

          /* ================= STAGE ================= */
          .rc-stage {
            flex: 1 1 0;
            min-height: 0;
            width: 100%;
            display: flex;
            overflow: hidden;
          }

          .rc-empty {
            flex: 1;
            display: grid;
            place-items: center;
            text-align: center;
            padding: 24px;
            border-radius: 22px;
            border: 1.5px dashed var(--rc-border);
            background: var(--rc-glass);
            color: var(--rc-muted);
          }

          .rc-empty-emoji {
            font-size: 48px;
          }

          .rc-empty h3 {
            margin: 8px 0 4px;
            font-family: Georgia, 'Times New Roman', serif;
            color: var(--rc-ink);
          }

          .rc-empty p {
            margin: 0 0 14px;
            font-size: 13px;
          }

          /* ================= DIALOGS ================= */
          .rc-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: grid;
            place-items: center;
            padding: 16px;
            background: var(--rc-overlay);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }

          .rc-dialog {
            width: min(900px, 100%);
            max-height: min(88dvh, 720px);
            display: grid;
            grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
            overflow: hidden;
            border-radius: 24px;
            border: 1px solid var(--rc-border);
            background: var(--rc-surface);
            color: var(--rc-text);
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
          }

          .rc-dialog-side {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 18px;
            background: var(--rc-tile);
            border-right: 1px solid var(--rc-border);
            overflow-y: auto;
          }

          .rc-photo {
            aspect-ratio: 1;
            width: 100%;
            display: grid;
            place-items: center;
            overflow: hidden;
            border-radius: 18px;
            background: var(--rc-soft);
          }

          .rc-photo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 6px;
            filter: drop-shadow(0 14px 14px rgba(0, 0, 0, 0.16));
          }

          .rc-photo-plate {
            width: 78%;
            aspect-ratio: 1;
            display: grid;
            place-items: center;
            border-radius: 50%;
            border: 12px solid var(--rc-plate-rim);
            background: radial-gradient(circle, var(--rc-plate) 0%, var(--rc-plate-rim) 100%);
            box-shadow: 0 16px 26px rgba(30, 55, 35, 0.16);
            font-size: clamp(56px, 7vw, 92px);
          }

          .rc-facts {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .rc-fact {
            padding: 10px;
            border-radius: 12px;
            border: 1px solid var(--rc-border);
            background: var(--rc-surface);
          }

          .rc-fact span {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 10px;
            font-weight: 700;
            color: var(--rc-muted);
          }

          .rc-fact strong {
            display: block;
            margin-top: 3px;
            font-size: 15px;
            color: var(--rc-ink);
          }

          .rc-rating {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid var(--rc-border);
            background: var(--rc-surface);
          }

          .rc-rating > span {
            font-size: 11px;
            font-weight: 700;
            color: var(--rc-muted);
          }

          .rc-rating div {
            display: flex;
            gap: 2px;
          }

          .rc-rating button {
            display: grid;
            place-items: center;
            padding: 1px;
            border: 0;
            background: transparent;
            color: #d9a441;
            transition: transform 0.15s ease;
          }

          .rc-rating button:hover {
            transform: scale(1.2);
          }

          .rc-rating button.off {
            color: var(--rc-border);
          }

          [data-theme="dark"] .rc-rating button.off {
            color: #4a6352;
          }

          .rc-side-actions {
            display: grid;
            gap: 8px;
            margin-top: auto;
          }

          .rc-side-actions .rc-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .rc-dialog-main {
            min-height: 0;
            display: flex;
            flex-direction: column;
            padding: 22px 24px;
            overflow-y: auto;
          }

          .rc-dialog-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .rc-chip {
            display: inline-block;
            padding: 3px 9px;
            border-radius: 99px;
            background: var(--rc-soft);
            color: var(--rc-primary);
            font-size: 11px;
            font-weight: 800;
          }

          [data-theme="dark"] .rc-chip {
            color: #a1d7ae;
          }

          .rc-dialog h2 {
            margin: 8px 0 6px;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: clamp(24px, 2.4vw, 32px);
            letter-spacing: -0.5px;
            color: var(--rc-ink);
          }

          .rc-desc {
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: var(--rc-muted);
          }

          .rc-section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 18px 0 10px;
            font-size: 14px;
            font-weight: 800;
            color: var(--rc-ink);
          }

          .rc-ingredients {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px 14px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          .rc-ingredients li {
            display: flex;
            gap: 8px;
            font-size: 12.5px;
            line-height: 1.45;
          }

          .rc-ingredients li::before {
            content: '';
            width: 6px;
            height: 6px;
            margin-top: 6px;
            flex-shrink: 0;
            border-radius: 50%;
            background: var(--rc-primary);
          }

          [data-theme="dark"] .rc-ingredients li::before {
            background: #a1d7ae;
          }

          .rc-steps {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
            counter-reset: step;
          }

          .rc-steps li {
            counter-increment: step;
            display: flex;
            gap: 10px;
            font-size: 12.5px;
            line-height: 1.5;
          }

          .rc-steps li::before {
            content: counter(step);
            width: 22px;
            height: 22px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: var(--rc-soft);
            color: var(--rc-ink);
            font-size: 11px;
            font-weight: 800;
          }

          .rc-note {
            margin: 16px 0 0;
            font-size: 11px;
            color: var(--rc-muted);
          }

          /* ---------- form ---------- */
          .rc-form {
            width: min(640px, 100%);
            max-height: 88dvh;
            display: grid;
            gap: 13px;
            padding: 22px 24px;
            overflow-y: auto;
            border-radius: 24px;
            border: 1px solid var(--rc-border);
            background: var(--rc-surface);
            color: var(--rc-text);
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
          }

          .rc-form h2 {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 24px;
            color: var(--rc-ink);
          }

          .rc-field {
            display: grid;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
          }

          .rc-field input,
          .rc-field select,
          .rc-field textarea {
            width: 100%;
            padding: 10px 12px;
            border-radius: 11px;
            border: 1px solid var(--rc-border);
            background: var(--rc-tile);
            color: var(--rc-text);
            font-size: 13px;
            font-weight: 500;
            resize: vertical;
          }

          .rc-two {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .rc-three {
            display: grid;
            grid-template-columns: 1.4fr 1fr 1fr;
            gap: 12px;
          }

          .rc-upload {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            border-radius: 14px;
            border: 1.5px dashed var(--rc-border);
          }

          .rc-upload-preview {
            width: 64px;
            height: 64px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            overflow: hidden;
            border-radius: 12px;
            background: var(--rc-soft);
            font-size: 32px;
            color: var(--rc-muted);
          }

          .rc-upload-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .rc-upload-text {
            flex: 1;
            min-width: 0;
            font-size: 11px;
            font-weight: 500;
            color: var(--rc-muted);
          }

          .rc-upload-text input {
            display: block;
            margin-top: 6px;
            max-width: 100%;
            font-size: 11px;
          }

          .rc-emoji-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .rc-emoji-row button {
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            border-radius: 11px;
            border: 1px solid var(--rc-border);
            background: var(--rc-tile);
            font-size: 19px;
            transition: transform 0.15s ease;
          }

          .rc-emoji-row button:hover {
            transform: translateY(-2px);
          }

          .rc-emoji-row button.on {
            border-color: var(--rc-primary);
            background: var(--rc-soft);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--rc-primary) 30%, transparent);
          }

          .rc-error {
            margin: 0;
            font-size: 12px;
            color: var(--rc-danger);
          }

          /* ================= RESPONSIVE ================= */
          @media (max-width: 760px) {
            .rc-header { align-items: flex-start; flex-direction: column; }
            .rc-dialog { grid-template-columns: 1fr; overflow-y: auto; }
            .rc-dialog-side { border-right: 0; border-bottom: 1px solid var(--rc-border); overflow: visible; }
            .rc-dialog-main { overflow: visible; }
            .rc-photo { aspect-ratio: 16 / 9; }
            .rc-ingredients { grid-template-columns: 1fr; }
            .rc-three { grid-template-columns: 1fr 1fr; }
          }

          /* ===== PHONE: page scrolls, orbit uses the tall layout ===== */
          @media (max-width: 800px) {
            .rc-page { height: auto; overflow: visible; }
            .rc-stage { flex: 0 0 auto; overflow: visible; }
            .rc-header .rc-btn { width: 100%; }
            .rc-search { flex: 1 1 100%; max-width: none; }
            .rc-pills {
              flex-wrap: nowrap;
              width: 100%;
              overflow-x: auto;
              padding-bottom: 4px;
              scrollbar-width: none;
            }
            .rc-pills::-webkit-scrollbar { display: none; }
            .rc-pill { flex-shrink: 0; white-space: nowrap; }
            .rc-overlay { z-index: 1200; padding: 8px; }
            .rc-dialog-main { padding: 18px 16px; }
            .rc-form { padding: 18px 16px; }
            .rc-two { grid-template-columns: 1fr; }
            .rc-search input,
            .rc-field input,
            .rc-field select,
            .rc-field textarea { font-size: 16px; }
          }

          @media (prefers-reduced-motion: reduce) {
            .rc-page *,
            .rc-page *::before,
            .rc-page *::after {
              transition: none !important;
            }
          }
        `}</style>

        {/* ================= HEADER ================= */}
        <header className="rc-header">
          <div>
            <p className="sb-hero-eyebrow">Healthy eating</p>
            <h2 className="sb-hero-title">Discover Recipes</h2>
            <p className="sb-hero-sub">
              Famous Filipino dishes you can cook at home and pack in your lunchbox.
            </p>
          </div>

          <button type="button" className="rc-btn primary" onClick={openNew}>
            <Plus size={17} /> Create Recipe
          </button>
        </header>

        {/* ================= TOOLBAR ================= */}
        <div className="rc-toolbar">
          <div className="rc-search">
            <Search size={16} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search recipes or ingredients"
              aria-label="Search recipes"
            />
          </div>

          <div className="rc-pills" role="group" aria-label="Recipe categories">
            {categories.map(category => (
              <button
                type="button"
                key={category}
                className={`rc-pill ${filter === category ? 'on' : ''}`}
                aria-pressed={filter === category}
                onClick={() => setFilter(category)}
              >
                {category}
                <b>{recipes.filter(recipe => inCategory(recipe, category)).length}</b>
              </button>
            ))}
          </div>
        </div>

        {/* ================= CAROUSEL ================= */}
        <div className="rc-stage">
          {filtered.length > 0 ? (
            <RecipeOrbit
              recipes={filtered.map(recipe => ({ ...recipe, image: photos[recipe.id] || recipe.image }))}
              favorites={favorites}
              onFavorite={toggleFavorite}
              onView={setSelectedId}
              ratings={ratings}
              onRate={rate}
            />
          ) : (
            <div className="rc-empty">
              <div>
                <span className="rc-empty-emoji" aria-hidden="true">
                  🥄
                </span>
                <h3>No recipes found</h3>
                <p>
                  {filter === 'Favorites'
                    ? 'Tap “Save” on a recipe to add it to your favorites.'
                    : filter === 'My Recipes'
                      ? 'Recipes you create will appear here.'
                      : 'Try another search or category.'}
                </p>
                <button
                  type="button"
                  className="rc-btn"
                  onClick={() => {
                    setSearch('')
                    setFilter('All Recipes')
                  }}
                >
                  Show all recipes
                </button>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {/* ================= DETAILS ================= */}
          {selected && (
            <motion.div
              key="details"
              className="rc-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={event => {
                if (event.target === event.currentTarget) setSelectedId(null)
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={`${selected.name} recipe`}
                className="rc-dialog"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15 }}
              >
                <aside className="rc-dialog-side">
                  <RecipePhoto
                    image={photos[selected.id] || selected.image}
                    name={selected.name}
                    emoji={selected.emoji}
                  />

                  <div className="rc-facts">
                    <div className="rc-fact">
                      <span>
                        <Clock3 size={12} /> Time
                      </span>
                      <strong>{selected.time} min</strong>
                    </div>
                    <div className="rc-fact">
                      <span>
                        <Users size={12} /> Servings
                      </span>
                      <strong>{selected.servings}</strong>
                    </div>
                  </div>

                  <div className="rc-rating">
                    <span>{ratings[selected.id] ? `Your rating · ${ratings[selected.id]}/5` : 'Rate this recipe'}</span>
                    <div role="group" aria-label={`Your rating for ${selected.name}`}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={n <= (ratings[selected.id] ?? 0) ? '' : 'off'}
                          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                          aria-pressed={n <= (ratings[selected.id] ?? 0)}
                          onClick={() => rate(selected.id, n)}
                        >
                          <Star size={17} fill="currentColor" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rc-side-actions">
                    <button
                      type="button"
                      className={`rc-btn ${isSaved ? 'primary' : ''}`}
                      aria-pressed={isSaved}
                      onClick={() => toggleFavorite(selected.id)}
                    >
                      <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} />
                      {isSaved ? 'Saved to favorites' : 'Save to favorites'}
                    </button>

                    {selected.custom && (
                      <div className="rc-row">
                        <button type="button" className="rc-btn" onClick={() => edit(selected)}>
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          type="button"
                          className="rc-btn danger"
                          onClick={() => remove(selected.id)}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </aside>

                <div className="rc-dialog-main">
                  <div className="rc-dialog-top">
                    <span className="rc-chip">{selected.category}</span>
                    <button
                      type="button"
                      className="rc-btn icon"
                      onClick={() => setSelectedId(null)}
                      aria-label="Close details"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <h2>{selected.name}</h2>
                  <p className="rc-desc">{selected.description}</p>

                  <h3 className="rc-section-title">
                    <BookOpen size={17} /> Ingredients
                  </h3>
                  <ul className="rc-ingredients">
                    {selected.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>

                  <h3 className="rc-section-title">
                    <ListChecks size={17} /> Preparation
                  </h3>
                  <ol className="rc-steps">
                    {selected.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>

                  <p className="rc-note">
                    Nutrition values will be shown when verified nutritional data is connected.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ================= CREATE / EDIT FORM ================= */}
          {formOpen && (
            <motion.div
              key="form"
              className="rc-overlay"
              style={{ zIndex: 1201 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={event => {
                if (event.target === event.currentTarget) setFormOpen(false)
              }}
            >
              <motion.form
                role="dialog"
                aria-modal="true"
                aria-label={editingId ? 'Edit recipe' : 'Create recipe'}
                className="rc-form"
                onSubmit={save}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                <div className="rc-dialog-top">
                  <h2>{editingId ? 'Edit Recipe' : 'Create Recipe'}</h2>
                  <button
                    type="button"
                    className="rc-btn icon"
                    onClick={() => setFormOpen(false)}
                    aria-label="Close form"
                  >
                    <X size={18} />
                  </button>
                </div>

                <label className="rc-field">
                  Recipe Name
                  <input
                    required
                    value={form.name}
                    onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                  />
                </label>

                <div className="rc-field">
                  Icon
                  <div className="rc-emoji-row" role="group" aria-label="Recipe icon">
                    {EMOJIS.map(emoji => (
                      <button
                        type="button"
                        key={emoji}
                        className={form.emoji === emoji ? 'on' : ''}
                        aria-pressed={form.emoji === emoji}
                        aria-label={`Use ${emoji} icon`}
                        onClick={() => setForm(prev => ({ ...prev, emoji }))}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rc-field">
                  Recipe Photo (optional)
                  <div className="rc-upload">
                    <div className="rc-upload-preview">
                      {form.image ? (
                        <img src={form.image} alt="Recipe preview" />
                      ) : form.emoji ? (
                        form.emoji
                      ) : (
                        <ImagePlus size={26} />
                      )}
                    </div>
                    <div className="rc-upload-text">
                      JPG, PNG, or WebP, up to 1 MB. Without a photo, the icon is shown.
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />
                    </div>
                    {form.image && (
                      <button
                        type="button"
                        className="rc-btn icon"
                        aria-label="Remove photo"
                        onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {photoError && (
                  <p role="alert" className="rc-error">
                    {photoError}
                  </p>
                )}

                <div className="rc-three">
                  <label className="rc-field">
                    Category
                    <select
                      value={form.category}
                      onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))}
                    >
                      {CATEGORY_OPTIONS.map(option => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="rc-field">
                    Time (min)
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.time}
                      onChange={event => setForm(prev => ({ ...prev, time: event.target.value }))}
                    />
                  </label>
                  <label className="rc-field">
                    Servings
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.servings}
                      onChange={event => setForm(prev => ({ ...prev, servings: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="rc-field">
                  Description
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
                  />
                </label>

                <div className="rc-two">
                  <label className="rc-field">
                    Ingredients (one per line)
                    <textarea
                      rows={5}
                      required
                      value={form.ingredients}
                      onChange={event => setForm(prev => ({ ...prev, ingredients: event.target.value }))}
                    />
                  </label>
                  <label className="rc-field">
                    Instructions (one step per line)
                    <textarea
                      rows={5}
                      required
                      value={form.instructions}
                      onChange={event => setForm(prev => ({ ...prev, instructions: event.target.value }))}
                    />
                  </label>
                </div>

                <button type="submit" className="rc-btn primary">
                  {editingId ? 'Save Changes' : 'Create Recipe'}
                </button>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}