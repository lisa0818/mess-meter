// scripts/seed-demo-week.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read environment variables from .env
const envPath = path.resolve(__dirname, '..', '.env');
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key === 'EXPO_PUBLIC_SUPABASE_URL' && !supabaseUrl) supabaseUrl = val;
      if ((key === 'EXPO_PUBLIC_SUPABASE_KEY' || key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') && !supabaseKey) supabaseKey = val;
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_WEEK_MENU = [
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

async function seed() {
  console.log('Connecting to Supabase at:', supabaseUrl);

  const email = process.argv[2];
  const password = process.argv[3];

  if (email && password) {
    console.log(`Signing in as admin (${email})...`);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      console.error('Authentication error:', authErr.message);
      process.exit(1);
    }
    console.log('Authenticated successfully!');
  } else {
    console.log('Note: Running unauthenticated. If RLS blocks insertion, run with credentials:');
    console.log('  node scripts/seed-demo-week.js <admin-email> <password>\n');
  }

  // Check if a hostel exists
  const { data: hostels } = await supabase.from('hostels').select('id, name').limit(1);
  const hostelId = hostels && hostels.length > 0 ? hostels[0].id : null;
  const hostelName = hostels && hostels.length > 0 ? hostels[0].name : 'Default (Global)';
  console.log(`Using hostel: ${hostelName} (${hostelId || 'null'})`);

  const pad = (n) => String(n).padStart(2, '0');
  const getIso = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  let totalMeals = 0;

  for (const day of DEMO_WEEK_MENU) {
    const dateStr = getIso(day.dayOffset);
    console.log(`Processing ${dateStr} (offset ${day.dayOffset})...`);

    // Delete existing meals on this date
    let delQuery = supabase.from('meals').delete().eq('meal_date', dateStr);
    if (hostelId) {
      delQuery = delQuery.eq('hostel_id', hostelId);
    }
    await delQuery;

    const rows = day.meals.map((m) => ({
      hostel_id: hostelId,
      meal_date: dateStr,
      meal_type: m.meal_type,
      menu_items: m.menu_items,
    }));

    const { error } = await supabase.from('meals').insert(rows);
    if (error) {
      console.error(`Error inserting meals for ${dateStr}:`, error.message);
    } else {
      totalMeals += rows.length;
      console.log(`  Added ${rows.length} meals for ${dateStr}`);
    }
  }

  console.log(`\n🎉 Done! Successfully seeded ${totalMeals} demo meals for the week.`);
}

seed().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
