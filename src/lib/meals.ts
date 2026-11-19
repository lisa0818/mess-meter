import { supabase } from './supabase';

export interface Meal {
  id?: string;
  hostel_id?: string | null;
  meal_date: string;
  meal_type: string;
  menu_items: string[];
}

export async function getMealsForDate(date: string, hostelId?: string | null): Promise<Meal[]> {
  let query = supabase
    .from('meals')
    .select('id, hostel_id, meal_date, meal_type, menu_items')
    .eq('meal_date', date);

  if (hostelId) {
    query = query.or(`hostel_id.eq.${hostelId},hostel_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertMeal(meal: {
  id?: string;
  hostel_id?: string | null;
  meal_date: string;
  meal_type: string;
  menu_items: string[];
}): Promise<void> {
  if (meal.id) {
    const { error } = await supabase
      .from('meals')
      .update({
        menu_items: meal.menu_items,
      })
      .eq('id', meal.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('meals').insert({
      hostel_id: meal.hostel_id ?? null,
      meal_date: meal.meal_date,
      meal_type: meal.meal_type,
      menu_items: meal.menu_items,
    });
    if (error) throw error;
  }
}

export async function deleteMeal(mealId: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', mealId);
  if (error) throw error;
}

export async function copyDayMenu(
  fromDate: string,
  toDate: string,
  hostelId?: string | null
): Promise<number> {
  const sourceMeals = await getMealsForDate(fromDate, hostelId);
  if (!sourceMeals.length) return 0;

  // Delete existing meals on target date first to prevent duplicates
  const targetMeals = await getMealsForDate(toDate, hostelId);
  for (const m of targetMeals) {
    if (m.id) await deleteMeal(m.id);
  }

  const toInsert = sourceMeals.map((m) => ({
    hostel_id: hostelId ?? m.hostel_id ?? null,
    meal_date: toDate,
    meal_type: m.meal_type,
    menu_items: m.menu_items,
  }));

  const { error } = await supabase.from('meals').insert(toInsert);
  if (error) throw error;
  return toInsert.length;
}
