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

export const DEMO_WEEK_MENU: {
  dayOffset: number;
  meals: { meal_type: 'breakfast' | 'lunch' | 'snacks' | 'dinner'; menu_items: string[] }[];
}[] = [
  {
    dayOffset: -1, // Yesterday
    meals: [
      { meal_type: 'breakfast', menu_items: ['Chole Bhature', 'Sweet Lassi', 'Banana', 'Masala Tea'] },
      { meal_type: 'lunch', menu_items: ['Veg Dum Biryani', 'Mirchi Ka Salan', 'Boondi Raita', 'Gulab Jamun'] },
      { meal_type: 'snacks', menu_items: ['Crispy Samosa with Mint Chutney', 'Cutting Chai', 'Biscuits'] },
      { meal_type: 'dinner', menu_items: ['Paneer Butter Masala', 'Butter Naan', 'Jeera Rice', 'Dal Tadka', 'Vanilla Ice Cream'] },
    ],
  },
  {
    dayOffset: 0, // Today
    meals: [
      { meal_type: 'breakfast', menu_items: ['Masala Dosa', 'Sambar', 'Coconut Chutney', 'Poha with Sev', 'Filter Coffee'] },
      { meal_type: 'lunch', menu_items: ['Rajma Masala', 'Steamed Basmati Rice', 'Butter Roti', 'Aloo Gobi Dry', 'Curd'] },
      { meal_type: 'snacks', menu_items: ['Bun Maska', 'Hot Bournvita', 'Roasted Peanuts'] },
      { meal_type: 'dinner', menu_items: ['Dal Makhani', 'Mix Veg Korma', 'Tawa Roti', 'Jeera Pulao', 'Kheer'] },
    ],
  },
  {
    dayOffset: 1, // Tomorrow
    meals: [
      { meal_type: 'breakfast', menu_items: ['Idli & Medu Vada', 'Tomato Chutney', 'Sambar', 'Rava Upma', 'Tea'] },
      { meal_type: 'lunch', menu_items: ['Kadhai Paneer', 'Yellow Dal Tadka', 'Phulka', 'Boondi Raita', 'Green Salad'] },
      { meal_type: 'snacks', menu_items: ['Veg Cutlet', 'Mint & Imli Chutney', 'Filter Coffee'] },
      { meal_type: 'dinner', menu_items: ['Malai Kofta', 'Steamed Basmati Rice', 'Plain Paratha', 'Moong Dal Fry'] },
    ],
  },
  {
    dayOffset: 2,
    meals: [
      { meal_type: 'breakfast', menu_items: ['Aloo Paratha with White Butter', 'Fresh Curd', 'Mixed Pickle', 'Masala Chai'] },
      { meal_type: 'lunch', menu_items: ['Sambar Rice', 'Bhindi Masala', 'Pepper Rasam', 'Appalam', 'Chapati'] },
      { meal_type: 'snacks', menu_items: ['Pav Bhaji with Extra Butter', 'Nimbu Paani', 'Chai'] },
      { meal_type: 'dinner', menu_items: ['Matar Paneer', 'Tandoori Roti', 'Ghee Rice', 'Panchmel Dal', 'Sewai Kheer'] },
    ],
  },
  {
    dayOffset: 3,
    meals: [
      { meal_type: 'breakfast', menu_items: ['Onion Uttapam', 'Gunpowder Podi & Ghee', 'Sambar', 'Sprouts Salad'] },
      { meal_type: 'lunch', menu_items: ['Amritsari Chana Masala', 'Jeera Rice', 'Fluffy Poori', 'Boondi Raita', 'Kachumber'] },
      { meal_type: 'snacks', menu_items: ['Peri Peri Maggi', 'Masala Sweet Corn', 'Hot Ginger Tea'] },
      { meal_type: 'dinner', menu_items: ['Paneer Tikka Masala', 'Missi Roti', 'Peas Pulao', 'Tadka Dal', 'Fruit Custard'] },
    ],
  },
  {
    dayOffset: 4,
    meals: [
      { meal_type: 'breakfast', menu_items: ['Poori Bhaji', 'Sooji Halwa', 'Seasonal Cut Fruits', 'Tea/Coffee'] },
      { meal_type: 'lunch', menu_items: ['Palak Paneer', 'Veg Pulao', 'Tawa Roti', 'Dal Makhani', 'Dahi Vada'] },
      { meal_type: 'snacks', menu_items: ['Bread Pakora', 'Tangy Imli Chutney', 'Elaichi Chai'] },
      { meal_type: 'dinner', menu_items: ['Hyderabadi Veg Biryani', 'Dum Aloo Kashmiri', 'Rumali Roti', 'Mix Raita', 'Rasgulla'] },
    ],
  },
  {
    dayOffset: 5,
    meals: [
      { meal_type: 'breakfast', menu_items: ['Methi Thepla', 'Dahi', 'Chhundo Pickle', 'Indori Poha with Sev', 'Chai'] },
      { meal_type: 'lunch', menu_items: ['Shahi Paneer', 'Dal Tadka', 'Garlic Naan', 'Steamed Rice', 'Onion Cucumber Salad'] },
      { meal_type: 'snacks', menu_items: ['Crispy Onion Pakoda', 'Green Chutney', 'Masala Cutting Chai'] },
      { meal_type: 'dinner', menu_items: ['South Indian Feast: Lemon Rice', 'Curd Rice', 'Aloo Roast', 'Tomato Sambar', 'Payasam'] },
    ],
  },
];

/** Seeds 7 continuous days of meals (Breakfast, Lunch, Snacks, Dinner) around today */
export async function seedDemoWeek(hostelId?: string | null): Promise<number> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const getIso = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  let totalInserted = 0;

  for (const day of DEMO_WEEK_MENU) {
    const dateStr = getIso(day.dayOffset);
    // Delete existing on this day to avoid duplicates
    const existing = await getMealsForDate(dateStr, hostelId);
    for (const m of existing) {
      if (m.id) await deleteMeal(m.id);
    }

    const rows = day.meals.map((m) => ({
      hostel_id: hostelId ?? null,
      meal_date: dateStr,
      meal_type: m.meal_type,
      menu_items: m.menu_items,
    }));

    const { error } = await supabase.from('meals').insert(rows);
    if (!error) {
      totalInserted += rows.length;
    }
  }

  return totalInserted;
}
