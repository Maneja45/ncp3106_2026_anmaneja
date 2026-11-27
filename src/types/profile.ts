import { NUTRITION_REFERENCE } from '../services/nutrition'

// All values are strings because they come from form inputs.
export type ProfileData = {
  fullName: string
  email: string
  age: string
  height: string
  weight: string
  /** 'male' | 'female' | '' (empty for older accounts) */
  sex: string
  /** 'sedentary' | 'moderate' | 'vigorous' */
  activity: string
  calories: string
  sugar: string
  sodium: string
}

export const initialProfile: ProfileData = {
  fullName: '',
  email: '',
  age: '',
  height: '',
  weight: '',
  sex: '',
  activity: 'sedentary',
  calories: String(NUTRITION_REFERENCE.calories),
  sugar: String(NUTRITION_REFERENCE.sugar),
  sodium: String(NUTRITION_REFERENCE.sodium),
}