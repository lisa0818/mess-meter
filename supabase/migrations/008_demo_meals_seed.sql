-- File: supabase/migrations/008_demo_meals_seed.sql
-- Seeds a full 7-day demo week of Indian hostel mess meals relative to CURRENT_DATE (-1 day through +5 days)

DO $$
DECLARE
  v_hostel_id UUID;
  d DATE;
BEGIN
  -- Get the first available hostel, or use NULL for global visibility
  SELECT id INTO v_hostel_id FROM hostels LIMIT 1;

  -- 1. YESTERDAY (CURRENT_DATE - 1)
  d := CURRENT_DATE - 1;
  DELETE FROM meals WHERE meal_date = d AND (hostel_id = v_hostel_id OR (v_hostel_id IS NULL AND hostel_id IS NULL));
  INSERT INTO meals (hostel_id, meal_date, meal_type, menu_items) VALUES
    (v_hostel_id, d, 'breakfast', ARRAY['Chole Bhature', 'Sweet Lassi', 'Banana', 'Masala Tea']),
    (v_hostel_id, d, 'lunch', ARRAY['Veg Dum Biryani', 'Mirchi Ka Salan', 'Boondi Raita', 'Gulab Jamun']),
    (v_hostel_id, d, 'snacks', ARRAY['Crispy Samosa with Mint Chutney', 'Cutting Chai', 'Biscuits']),
    (v_hostel_id, d, 'dinner', ARRAY['Paneer Butter Masala', 'Butter Naan', 'Jeera Rice', 'Dal Tadka', 'Vanilla Ice Cream']);

  -- 2. TODAY (CURRENT_DATE)
  d := CURRENT_DATE;
  DELETE FROM meals WHERE meal_date = d AND (hostel_id = v_hostel_id OR (v_hostel_id IS NULL AND hostel_id IS NULL));
  INSERT INTO meals (hostel_id, meal_date, meal_type, menu_items) VALUES
    (v_hostel_id, d, 'breakfast', ARRAY['Masala Dosa', 'Sambar', 'Coconut Chutney', 'Poha with Sev', 'Filter Coffee']),
    (v_hostel_id, d, 'lunch', ARRAY['Rajma Masala', 'Steamed Basmati Rice', 'Butter Roti', 'Aloo Gobi Dry', 'Curd']),
    (v_hostel_id, d, 'snacks', ARRAY['Bun Maska', 'Hot Bournvita', 'Roasted Peanuts']),
    (v_hostel_id, d, 'dinner', ARRAY['Dal Makhani', 'Mix Veg Korma', 'Tawa Roti', 'Jeera Pulao', 'Kheer']);

  -- 3. TOMORROW (CURRENT_DATE + 1)
  d := CURRENT_DATE + 1;
  DELETE FROM meals WHERE meal_date = d AND (hostel_id = v_hostel_id OR (v_hostel_id IS NULL AND hostel_id IS NULL));
  INSERT INTO meals (hostel_id, meal_date, meal_type, menu_items) VALUES
    (v_hostel_id, d, 'breakfast', ARRAY['Idli & Medu Vada', 'Tomato Chutney', 'Sambar', 'Rava Upma', 'Tea']),
    (v_hostel_id, d, 'lunch', ARRAY['Kadhai Paneer', 'Yellow Dal Tadka', 'Phulka', 'Boondi Raita', 'Green Salad']),
    (v_hostel_id, d, 'snacks', ARRAY['Veg Cutlet', 'Mint & Imli Chutney', 'Filter Coffee']),
    (v_hostel_id, d, 'dinner', ARRAY['Malai Kofta', 'Steamed Basmati Rice', 'Plain Paratha', 'Moong Dal Fry']);

  -- 4. DAY 3 (CURRENT_DATE + 2)
  d := CURRENT_DATE + 2;
  DELETE FROM meals WHERE meal_date = d AND (hostel_id = v_hostel_id OR (v_hostel_id IS NULL AND hostel_id IS NULL));
  INSERT INTO meals (hostel_id, meal_date, meal_type, menu_items) VALUES
    (v_hostel_id, d, 'breakfast', ARRAY['Aloo Paratha with White Butter', 'Fresh Curd', 'Mixed Pickle', 'Masala Chai']),
    (v_hostel_id, d, 'lunch', ARRAY['Sambar Rice', 'Bhindi Masala', 'Pepper Rasam', 'Appalam', 'Chapati']),
    (v_hostel_id, d, 'snacks', ARRAY['Pav Bhaji with Extra Butter', 'Nimbu Paani', 'Chai']),
    (v_hostel_id, d, 'dinner', ARRAY['Matar Paneer', 'Tandoori Roti', 'Ghee Rice', 'Panchmel Dal', 'Sewai Kheer']);

  -- 5. DAY 4 (CURRENT_DATE + 3)
  d := CURRENT_DATE + 3;
  DELETE FROM meals WHERE meal_date = d AND (hostel_id = v_hostel_id OR (v_hostel_id IS NULL AND hostel_id IS NULL));
  INSERT INTO meals (hostel_id, meal_date, meal_type, menu_items) VALUES
    (v_hostel_id, d, 'breakfast', ARRAY['Onion Uttapam', 'Gunpowder Podi & Ghee', 'Sambar', 'Sprouts Salad']),
    (v_hostel_id, d, 'lunch', ARRAY['Amritsari Chana Masala', 'Jeera Rice', 'Fluffy Poori', 'Boondi Raita', 'Kachumber']),
    (v_hostel_id, d, 'snacks', ARRAY['Peri Peri Maggi', 'Masala Sweet Corn', 'Hot Ginger Tea']),
    (v_hostel_id, d, 'dinner', ARRAY['Paneer Tikka Masala', 'Missi Roti', 'Peas Pulao', 'Tadka Dal', 'Fruit Custard']);

  -- 6. DAY 5 (CURRENT_DATE + 4)
  d := CURRENT_DATE + 4;
  DELETE FROM meals WHERE meal_date = d AND (hostel_id = v_hostel_id OR (v_hostel_id IS NULL AND hostel_id IS NULL));
  INSERT INTO meals (hostel_id, meal_date, meal_type, menu_items) VALUES
    (v_hostel_id, d, 'breakfast', ARRAY['Poori Bhaji', 'Sooji Halwa', 'Seasonal Cut Fruits', 'Tea/Coffee']),
    (v_hostel_id, d, 'lunch', ARRAY['Palak Paneer', 'Veg Pulao', 'Tawa Roti', 'Dal Makhani', 'Dahi Vada']),
    (v_hostel_id, d, 'snacks', ARRAY['Bread Pakora', 'Tangy Imli Chutney', 'Elaichi Chai']),
    (v_hostel_id, d, 'dinner', ARRAY['Hyderabadi Veg Biryani', 'Dum Aloo Kashmiri', 'Rumali Roti', 'Mix Raita', 'Rasgulla']);

  -- 7. DAY 6 (CURRENT_DATE + 5)
  d := CURRENT_DATE + 5;
  DELETE FROM meals WHERE meal_date = d AND (hostel_id = v_hostel_id OR (v_hostel_id IS NULL AND hostel_id IS NULL));
  INSERT INTO meals (hostel_id, meal_date, meal_type, menu_items) VALUES
    (v_hostel_id, d, 'breakfast', ARRAY['Methi Thepla', 'Dahi', 'Chhundo Pickle', 'Indori Poha with Sev', 'Chai']),
    (v_hostel_id, d, 'lunch', ARRAY['Shahi Paneer', 'Dal Tadka', 'Garlic Naan', 'Steamed Rice', 'Onion Cucumber Salad']),
    (v_hostel_id, d, 'snacks', ARRAY['Crispy Onion Pakoda', 'Green Chutney', 'Masala Cutting Chai']),
    (v_hostel_id, d, 'dinner', ARRAY['South Indian Feast: Lemon Rice', 'Curd Rice', 'Aloo Roast', 'Tomato Sambar', 'Payasam']);
END $$;
