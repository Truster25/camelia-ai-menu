export type Category = {
  id: number;
  name: string;
  description: string;
  sort_order: number;
};

export type Dish = {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  price_rwf: number;
  cuisine: string;
  occasions: string;
  occasion_list: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  is_gluten_free: boolean;
  spice_level: number;
  ingredients: string;
  allergens: string;
  prep_minutes: number;
  calories: number;
  popularity_seed: number;
  art_tone: string;
  image_url: string | null;
  is_available: boolean;
  is_signature: boolean;
  rating_average: number;
  rating_count: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  created_at: string;
};

export type QuizAnswers = {
  diet: 'none' | 'halal' | 'vegetarian' | 'vegan' | 'gluten-free';
  spice: 'mild' | 'medium' | 'hot';
  budget: 'low' | 'mid' | 'high';
  cuisine: 'rwandan' | 'african' | 'international' | 'any';
  occasion: 'quick-bite' | 'casual' | 'date' | 'celebration' | 'family';
};

export type Recommendation = {
  dish: Dish;
  score: number;
  reason: string;
  score_breakdown: { similarity: number; preference: number; popularity: number; occasion: number };
  badges: string[];
};

export type RecommendResponse = {
  answers: QuizAnswers;
  results: Recommendation[];
  filters_applied: string[];
  considered: number;
  generated_at: string;
  log_id: number | null;
};

export type RecommendMeta = {
  weights: Record<string, number>;
  options: Record<keyof QuizAnswers, { value: string; label: string; hint: string }[]>;
};

export type Rating = {
  id: number;
  user_id: number;
  dish_id: number;
  stars: number;
  comment: string;
  updated_at: string;
  user_name: string;
};

export type OrderItem = {
  id: number;
  dish_id: number | null;
  dish_name: string;
  quantity: number;
  unit_price_rwf: number;
};

export type Order = {
  id: number;
  user_id: number | null;
  customer_name: string;
  table_number: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  note: string;
  total_rwf: number;
  created_at: string;
  items: OrderItem[];
};

export type Analytics = {
  total_orders: number;
  revenue_rwf: number;
  customers: number;
  dishes: number;
  ratings: number;
  average_rating: number;
  recommendations: number;
  orders_by_status: Record<string, number>;
  top_dishes: { dish_id: number; name: string; orders: number; rating_average: number; rating_count: number }[];
  quiz_popularity: Record<string, number>;
  last_7_days: { date: string; label: string; orders: number; revenue: number }[];
};

export type CartLine = { dish: Dish; quantity: number };
