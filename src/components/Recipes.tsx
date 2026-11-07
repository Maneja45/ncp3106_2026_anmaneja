
import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, Heart, Clock3, ChefHat, Plus, X,
  Trash2, Pencil, ArrowLeft, BookOpen,
  ImagePlus, ImageOff, Users, Upload
} from 'lucide-react'

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

const initialRecipes: Recipe[] = [
  {
    id: 'tinola',
    name: 'Chicken Tinola',
    category: 'Filipino',
    description: 'A comforting ginger-based chicken soup with vegetables.',
    time: 45,
    servings: 4,
    ingredients: [
      '500 g chicken',
      '1 small green papaya, sliced',
      '1 cup malunggay leaves',
      '1 thumb ginger, sliced',
      '1 onion',
      '3 cloves garlic',
      '4 cups water',
      'Fish sauce or salt, measured to taste'
    ],
    instructions: [
      'Prepare and wash the ingredients.',
      'Saute garlic, onion, and ginger.',
      'Add chicken and cook until lightly browned.',
      'Add water and simmer until the chicken is cooked.',
      'Add papaya and cook until tender.',
      'Add malunggay and season carefully.',
      'Serve warm.'
    ],
    image: '',
    custom: false
  },
  {
    id: 'adobo',
    name: 'Chicken Adobo',
    category: 'Filipino',
    description: 'A classic Filipino chicken dish with garlic and vinegar.',
    time: 50,
    servings: 4,
    ingredients: [
      '500 g chicken',
      '3 tbsp soy sauce',
      '3 tbsp vinegar',
      '5 cloves garlic',
      '2 bay leaves',
      'Black pepper',
      '1/2 cup water'
    ],
    instructions: [
      'Combine chicken, soy sauce, garlic, and pepper.',
      'Marinate briefly.',
      'Simmer with vinegar, bay leaves, and water.',
      'Cook until chicken is fully done.',
      'Reduce sauce to the desired consistency.',
      'Divide into meal-prep portions.'
    ],
    image: '',
    custom: false
  },
  {
    id: 'pinakbet',
    name: 'Vegetable Pinakbet',
    category: 'Vegetarian',
    description: 'A vegetable-rich Filipino dish for meal preparation.',
    time: 35,
    servings: 4,
    ingredients: [
      '1 cup squash',
      '1 eggplant',
      '1 cup okra',
      '1 bitter melon',
      '2 tomatoes',
      '1 onion',
      '2 cloves garlic',
      'Measured seasoning to taste'
    ],
    instructions: [
      'Wash and cut all vegetables.',
      'Saute garlic, onion, and tomatoes.',
      'Add squash and a little water.',
      'Add remaining vegetables.',
      'Cook until tender but not mushy.',
      'Season and divide into portions.'
    ],
    image: '',
    custom: false
  },
  {
    id: 'chicken-bowl',
    name: 'Chicken Rice Bowl',
    category: 'Meal Prep',
    description: 'A simple balanced bowl with chicken, rice, and vegetables.',
    time: 30,
    servings: 2,
    ingredients: [
      '300 g chicken breast',
      '2 cups cooked rice',
      '1 cup broccoli',
      '1 carrot',
      '1 tbsp cooking oil',
      'Garlic and pepper'
    ],
    instructions: [
      'Season and cook chicken thoroughly.',
      'Steam broccoli and carrots.',
      'Prepare cooked rice.',
      'Divide ingredients into two meal containers.',
      'Allow to cool safely before refrigerating.'
    ],
    image: '',
    custom: false
  }
]

const STORAGE_KEY = 'sustansyabox_recipes'
const FAVORITES_KEY = 'sustansyabox_recipe_favorites'
const PHOTOS_KEY = 'sustansyabox_recipe_photos'

const categories = [
  'All Recipes',
  'Filipino',
  'Meal Prep',
  'Vegetarian',
  'Favorites',
  'My Recipes'
]

const emptyForm: RecipeForm = {
  name: '',
  category: 'Meal Prep',
  description: '',
  time: '30',
  servings: '2',
  ingredients: '',
  instructions: '',
  image: ''
}

const cardStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  overflow: 'hidden'
}

const buttonStyle: CSSProperties = {
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '12px 18px',
  cursor: 'pointer',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 13,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  font: 'inherit'
}

const secondaryButton: CSSProperties = {
  ...buttonStyle,
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)'
}

function readStoredArray<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key)
    const parsed: unknown = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}

function readStoredPhotos(): Record<string, string> {
  try {
    const value = localStorage.getItem(PHOTOS_KEY)
    const parsed: unknown = value ? JSON.parse(value) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, string>
      : {}
  } catch {
    return {}
  }
}

function RecipePhoto({
  image,
  name,
  height = 175
}: {
  image: string
  name: string
  height?: number
}) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [image])

  return (
    <div style={{
      height,
      width: '100%',
      background: 'var(--border)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {image && !broken ? (
        <img
          src={image}
          alt={name}
          loading="lazy"
          onError={() => setBroken(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          color: 'var(--muted)'
        }}>
          <ChefHat size={43} color="var(--primary)" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            No recipe photo yet
          </span>
        </div>
      )}
    </div>
  )
}

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = readStoredArray<Recipe>(STORAGE_KEY)
    return [...initialRecipes, ...saved.filter(r => r.custom)]
  })

  const [photos, setPhotos] = useState<Record<string, string>>(
    readStoredPhotos
  )

  const [favorites, setFavorites] = useState<string[]>(() =>
    readStoredArray<string>(FAVORITES_KEY)
  )

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All Recipes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RecipeForm>(emptyForm)
  const [photoError, setPhotoError] = useState('')

  const selected = recipes.find(r => r.id === selectedId) ?? null

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          recipes
            .filter(r => r.custom)
            .map(r => ({ ...r, image: '' }))
        )
      )
    } catch {
      // Local storage may be unavailable.
    }
  }, [recipes])

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch {
      // Local storage may be unavailable.
    }
  }, [favorites])

  useEffect(() => {
    try {
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos))
    } catch {
      // Images may exceed the browser storage quota.
    }
  }, [photos])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return recipes.filter(recipe => {
      const matchesSearch =
        recipe.name.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.ingredients.some(item =>
          item.toLowerCase().includes(query)
        )

      const matchesFilter =
        filter === 'All Recipes' ||
        (filter === 'Favorites' && favorites.includes(recipe.id)) ||
        (filter === 'My Recipes' && recipe.custom) ||
        recipe.category === filter

      return matchesSearch && matchesFilter
    })
  }, [recipes, search, filter, favorites])

  const toggleFavorite = (id: string) => {
    setFavorites(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    )
  }

  const openNewRecipe = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setPhotoError('')
    setShowForm(true)
  }

  const editRecipe = (recipe: Recipe) => {
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
      image: photos[recipe.id] || recipe.image || ''
    })

    setPhotoError('')
    setSelectedId(null)
    setShowForm(true)
  }

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowed.includes(file.type)) {
      setPhotoError('Please choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > 1024 * 1024) {
      setPhotoError('Please use an image smaller than 1 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm(previous => ({
          ...previous,
          image: reader.result as string
        }))
        setPhotoError('')
      }
    }

    reader.onerror = () => {
      setPhotoError('Unable to read the selected image.')
    }

    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const saveRecipe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = form.name.trim()
    if (!name) return

    const id = editingId ?? crypto.randomUUID()

    const recipe: Recipe = {
      id,
      name,
      category: form.category,
      description: form.description.trim(),
      time: Math.max(1, Number(form.time) || 1),
      servings: Math.max(1, Number(form.servings) || 1),
      ingredients: form.ingredients
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      instructions: form.instructions
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      image: '',
      custom: true
    }

    if (editingId) {
      setRecipes(previous =>
        previous.map(r => r.id === editingId ? recipe : r)
      )
    } else {
      setRecipes(previous => [...previous, recipe])
    }

    setPhotos(previous => {
      const next = { ...previous }

      if (form.image) {
        next[id] = form.image
      } else {
        delete next[id]
      }

      return next
    })

    setShowForm(false)
    setEditingId(null)
    setFilter('My Recipes')
  }

  const deleteRecipe = (id: string) => {
    if (!window.confirm('Delete this recipe?')) return

    setRecipes(previous =>
      previous.filter(r => !(r.id === id && r.custom))
    )

    setFavorites(previous =>
      previous.filter(item => item !== id)
    )

    setPhotos(previous => {
      const next = { ...previous }
      delete next[id]
      return next
    })

    setSelectedId(null)
  }

  return (
    <div style={{
      color: 'var(--text)',
      paddingBottom: 50
    }}>
      {/* PAGE INTRODUCTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 28
        }}>
          <div>
            <p style={{
              color: 'var(--muted)',
              fontSize: 13,
              margin: '0 0 8px'
            }}>
              YOUR MEAL PREPARATION COLLECTION
            </p>

            <h2 style={{
              fontSize: 27,
              margin: '0 0 8px'
            }}>
              Discover Recipes
            </h2>

            <p style={{
              color: 'var(--muted)',
              margin: 0
            }}>
              Explore meals, save favorites, and create your own recipes.
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={openNewRecipe}
            style={buttonStyle}
          >
            <Plus size={18} />
            Create Recipe
          </motion.button>
        </div>

        {/* SEARCH AND FILTERS */}
        <div style={{
          ...cardStyle,
          padding: 20,
          marginBottom: 28
        }}>
          <div style={{
            position: 'relative',
            marginBottom: 18
          }}>
            <Search
              size={19}
              color="var(--muted)"
              style={{
                position: 'absolute',
                top: 15,
                left: 15
              }}
            />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes or ingredients..."
              aria-label="Search recipes"
              style={{
                ...inputStyle,
                paddingLeft: 45
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 9
          }}>
            {categories.map(category => (
              <button
                type="button"
                key={category}
                onClick={() => setFilter(category)}
                aria-pressed={filter === category}
                style={{
                  padding: '10px 15px',
                  borderRadius: 30,
                  border: '1px solid var(--border)',
                  background: filter === category
                    ? 'var(--primary)'
                    : 'var(--surface)',
                  color: filter === category
                    ? '#fff'
                    : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RECIPE CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
        gap: 22
      }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((recipe, index) => (
            <motion.article
              key={recipe.id}
              layout
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.35,
                delay: index * 0.04
              }}
              whileHover={{ y: -5 }}
              style={{
                ...cardStyle,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedId(recipe.id)}
            >
              <div style={{
                position: 'relative',
                overflow: 'hidden'
              }}>
                <RecipePhoto
                  image={photos[recipe.id] || recipe.image}
                  name={recipe.name}
                />

                <button
                  type="button"
                  aria-label={
                    favorites.includes(recipe.id)
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                  onClick={e => {
                    e.stopPropagation()
                    toggleFavorite(recipe.id)
                  }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    border: 'none',
                    borderRadius: '50%',
                    width: 38,
                    height: 38,
                    background: 'var(--surface)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Heart
                    size={19}
                    color="#C47778"
                    fill={
                      favorites.includes(recipe.id)
                        ? '#C47778'
                        : 'none'
                    }
                  />
                </button>
              </div>

              <div style={{ padding: 20 }}>
                <span style={{
                  color: 'var(--primary)',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {recipe.category.toUpperCase()}
                </span>

                <h3 style={{
                  margin: '10px 0',
                  fontSize: 20
                }}>
                  {recipe.name}
                </h3>

                <p style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  minHeight: 45
                }}>
                  {recipe.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 18
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--muted)',
                    fontSize: 13
                  }}>
                    <Clock3 size={15} />
                    {recipe.time} min
                  </span>

                  <span style={{
                    color: 'var(--primary)',
                    fontSize: 13,
                    fontWeight: 700
                  }}>
                    View Recipe →
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {/* EMPTY SEARCH RESULTS */}
      {filtered.length === 0 && (
        <div style={{
          ...cardStyle,
          padding: 55,
          textAlign: 'center',
          marginTop: 20
        }}>
          <BookOpen
            size={38}
            color="var(--primary)"
          />

          <h3>No recipes found</h3>

          <p style={{ color: 'var(--muted)' }}>
            Try another search or create your own recipe.
          </p>
        </div>
      )}

      <AnimatePresence>
        {/* RECIPE DETAILS */}
        {selected && (
          <motion.div
            key="recipe-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0,0,0,0.55)',
              display: 'grid',
              placeItems: 'center',
              padding: 18
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selected.name}
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 25
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                scale: 0.94
              }}
              onClick={e => e.stopPropagation()}
              style={{
                ...cardStyle,
                width: '100%',
                maxWidth: 680,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}
            >
              <RecipePhoto
                image={photos[selected.id] || selected.image}
                name={selected.name}
                height={230}
              />

              <div style={{ padding: 28 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    style={{
                      ...secondaryButton,
                      padding: 8
                    }}
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label="Close"
                    style={{
                      ...secondaryButton,
                      padding: 8
                    }}
                  >
                    <X size={22} />
                  </button>
                </div>

                <h2 style={{
                  fontSize: 28,
                  marginBottom: 8
                }}>
                  {selected.name}
                </h2>

                <p style={{
                  color: 'var(--muted)',
                  lineHeight: 1.7
                }}>
                  {selected.description}
                </p>

                <div style={{
                  display: 'flex',
                  gap: 18,
                  color: 'var(--primary)',
                  marginBottom: 25
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Clock3 size={17} />
                    {selected.time} minutes
                  </span>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Users size={17} />
                    {selected.servings} servings
                  </span>
                </div>

                <h3>Ingredients</h3>

                <ul style={{
                  lineHeight: 2,
                  color: 'var(--text)'
                }}>
                  {selected.ingredients.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                <h3>Preparation Instructions</h3>

                <ol style={{
                  lineHeight: 2,
                  color: 'var(--text)'
                }}>
                  {selected.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>

                <div style={{
                  background: 'var(--border)',
                  borderRadius: 14,
                  padding: 16,
                  marginTop: 20
                }}>
                  <p style={{
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    Nutrition estimates for calories, sugar,
                    and sodium will be added after we connect
                    verified recipe data.
                  </p>
                </div>

                {selected.custom && (
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 22
                  }}>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => editRecipe(selected)}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      style={{
                        ...buttonStyle,
                        background: '#A65353'
                      }}
                      onClick={() => deleteRecipe(selected.id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* CREATE / EDIT RECIPE FORM */}
        {showForm && (
          <motion.div
            key="recipe-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1100,
              background: 'rgba(0,0,0,0.55)',
              display: 'grid',
              placeItems: 'center',
              padding: 18
            }}
          >
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-label={
                editingId ? 'Edit recipe' : 'Create recipe'
              }
              initial={{
                opacity: 0,
                y: 25,
                scale: 0.96
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                y: 15
              }}
              onSubmit={saveRecipe}
              onClick={e => e.stopPropagation()}
              style={{
                ...cardStyle,
                padding: 28,
                width: '100%',
                maxWidth: 600,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxSizing: 'border-box',
                display: 'grid',
                gap: 15
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0 }}>
                  {editingId
                    ? 'Edit Recipe'
                    : 'Create Recipe'}
                </h2>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    ...secondaryButton,
                    padding: 6
                  }}
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>

              {/* RECIPE PHOTO UPLOAD */}
              <div>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: 10
                }}>
                  Recipe Photo
                </label>

                <div style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'var(--surface)'
                }}>
                  {form.image ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={form.image}
                        alt="Recipe preview"
                        style={{
                          width: '100%',
                          height: 180,
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm(previous => ({
                            ...previous,
                            image: ''
                          }))
                        }
                        style={{
                          ...secondaryButton,
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          padding: 9
                        }}
                      >
                        <ImageOff size={16} />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: 25,
                      color: 'var(--muted)'
                    }}>
                      <ImagePlus
                        size={35}
                        color="var(--primary)"
                      />
                      <span>No photo selected</span>
                    </div>
                  )}
                </div>

                <label style={{
                  ...secondaryButton,
                  display: 'inline-flex',
                  marginTop: 12,
                  cursor: 'pointer'
                }}>
                  <Upload size={17} />
                  Choose Image

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                <p style={{
                  color: 'var(--muted)',
                  fontSize: 12,
                  marginBottom: 0
                }}>
                  JPG, PNG or WebP. Maximum 1 MB.
                </p>

                {photoError && (
                  <p style={{
                    color: '#B45353',
                    fontSize: 13
                  }}>
                    {photoError}
                  </p>
                )}
              </div>

              <label>
                Recipe Name
                <input
                  required
                  value={form.name}
                  onChange={e =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                  style={{
                    ...inputStyle,
                    marginTop: 7
                  }}
                  placeholder="Enter recipe name"
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={e =>
                    setForm({
                      ...form,
                      category: e.target.value
                    })
                  }
                  style={{
                    ...inputStyle,
                    marginTop: 7
                  }}
                >
                  <option>Filipino</option>
                  <option>Meal Prep</option>
                  <option>Vegetarian</option>
                </select>
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={e =>
                    setForm({
                      ...form,
                      description: e.target.value
                    })
                  }
                  style={{
                    ...inputStyle,
                    marginTop: 7
                  }}
                  rows={3}
                  placeholder="Describe your recipe..."
                />
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12
              }}>
                <label>
                  Time (minutes)
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.time}
                    onChange={e =>
                      setForm({
                        ...form,
                        time: e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      marginTop: 7
                    }}
                  />
                </label>

                <label>
                  Servings
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.servings}
                    onChange={e =>
                      setForm({
                        ...form,
                        servings: e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      marginTop: 7
                    }}
                  />
                </label>
              </div>

              <label>
                Ingredients (one per line)
                <textarea
                  required
                  rows={5}
                  value={form.ingredients}
                  onChange={e =>
                    setForm({
                      ...form,
                      ingredients: e.target.value
                    })
                  }
                  style={{
                    ...inputStyle,
                    marginTop: 7
                  }}
                  placeholder={
                    '200 g chicken\n100 g vegetables'
                  }
                />
              </label>

              <label>
                Instructions (one step per line)
                <textarea
                  required
                  rows={5}
                  value={form.instructions}
                  onChange={e =>
                    setForm({
                      ...form,
                      instructions: e.target.value
                    })
                  }
                  style={{
                    ...inputStyle,
                    marginTop: 7
                  }}
                  placeholder={
                    'Prepare the ingredients\nCook the chicken'
                  }
                />
              </label>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={buttonStyle}
              >
                {editingId
                  ? 'Save Changes'
                  : 'Create Recipe'}
              </motion.button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Recipes
