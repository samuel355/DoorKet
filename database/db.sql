-- DoorKet Database Schema
-- Created: 2025-01-27
-- Description: Complete database schema for DoorKet food delivery app

-- Enable UUID extension for ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE,
  phone VARCHAR(15) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'runner', 'admin')),
  university VARCHAR(100) NOT NULL,
  hall_hostel VARCHAR(100),
  room_number VARCHAR(20),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  face_id_enabled BOOLEAN DEFAULT false,
  profile_image_url VARCHAR,
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_name VARCHAR(50) DEFAULT 'basket',
  color_code VARCHAR(7) DEFAULT '#2196F3',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ITEMS TABLE
-- ============================================================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) CHECK (base_price >= 0),
  unit VARCHAR(20) NOT NULL DEFAULT 'piece',
  is_available BOOLEAN DEFAULT true,
  image_url VARCHAR,
  barcode VARCHAR(50),
  tags TEXT[], -- Array of tags for searching
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  runner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'shopping', 'delivering', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  service_fee DECIMAL(10,2) DEFAULT 0.00 CHECK (service_fee >= 0),
  delivery_fee DECIMAL(10,2) DEFAULT 2.00 CHECK (delivery_fee >= 0),
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10,8),
  delivery_longitude DECIMAL(11,8),
  special_instructions TEXT,
  payment_method VARCHAR(20) CHECK (payment_method IN ('momo', 'card', 'cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference VARCHAR(100),
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  custom_item_name VARCHAR(200), -- For custom items not in catalog
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) CHECK (unit_price >= 0),
  custom_budget DECIMAL(10,2) CHECK (custom_budget >= 0), -- For custom items
  actual_price DECIMAL(10,2) CHECK (actual_price >= 0), -- Price paid by runner
  notes TEXT,
  receipt_image_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RATINGS TABLE
-- ============================================================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  runner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id) -- One rating per order
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('order_update', 'payment', 'general', 'promotion')),
  data JSONB, -- Additional data for the notification
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_university ON users(university);

-- Categories indexes
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Items indexes
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_available ON items(is_available);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_tags ON items USING GIN(tags);

-- Orders indexes
CREATE INDEX idx_orders_student ON orders(student_id);
CREATE INDEX idx_orders_runner ON orders(runner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_item ON order_items(item_id);

-- Ratings indexes
CREATE INDEX idx_ratings_order ON ratings(order_id);
CREATE INDEX idx_ratings_student ON ratings(student_id);
CREATE INDEX idx_ratings_runner ON ratings(runner_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'CC' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD((SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = DATE(NOW()))::TEXT, 4, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for order number generation
CREATE TRIGGER generate_orders_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE users
    SET rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE runner_id = NEW.runner_id
    )
    WHERE id = NEW.runner_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE users
    SET rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE runner_id = OLD.runner_id
    )
    WHERE id = OLD.runner_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for rating updates
CREATE TRIGGER update_ratings_user_rating
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile during registration" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public user profiles for runners" ON users FOR SELECT USING (user_type = 'runner' AND is_active = true);

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can modify categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
);

-- Items policies (public read)
CREATE POLICY "Items are viewable by everyone" ON items FOR SELECT USING (is_available = true);
CREATE POLICY "Only admins can modify items" ON items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
);

-- Orders policies
CREATE POLICY "Students can view their own orders" ON orders FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Runners can view orders assigned to them" ON orders FOR SELECT USING (runner_id = auth.uid());
CREATE POLICY "Runners can view available orders" ON orders FOR SELECT USING (
  status = 'pending' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'runner')
);
CREATE POLICY "Students can create orders" ON orders FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Runners can update order status" ON orders FOR UPDATE USING (
  runner_id = auth.uid() OR
  (status = 'pending' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'runner'))
);

-- Order items policies
CREATE POLICY "Order items are viewable by order participants" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.student_id = auth.uid() OR orders.runner_id = auth.uid())
  )
);

-- Ratings policies
CREATE POLICY "Ratings are viewable by participants" ON ratings FOR SELECT USING (
  student_id = auth.uid() OR runner_id = auth.uid()
);
CREATE POLICY "Students can create ratings" ON ratings FOR INSERT WITH CHECK (student_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample categories
INSERT INTO categories (name, description, icon_name, color_code, sort_order) VALUES
('Groceries', 'Fresh produce, pantry staples, and everyday essentials', 'basket', '#4CAF50', 1),
('Fast Food', 'Quick bites from local restaurants and food joints', 'fast-food', '#FF9800', 2),
('Beverages', 'Soft drinks, juices, water, and refreshing drinks', 'cafe', '#2196F3', 3),
('Snacks', 'Chips, biscuits, candies, and quick snacks', 'nutrition', '#9C27B0', 4),
('Personal Care', 'Toiletries, hygiene products, and personal items', 'body', '#E91E63', 5),
('Stationery', 'Books, pens, notebooks, and academic supplies', 'library', '#795548', 6),
('Electronics', 'Phone accessories, cables, and small electronics', 'phone-portrait', '#607D8B', 7),
('Clothing', 'Basic clothing items and accessories', 'shirt', '#FF5722', 8),
('Medicine', 'Over-the-counter medications and health products', 'medical', '#F44336', 9),
('Laundry', 'Detergents, fabric softeners, and laundry supplies', 'water', '#00BCD4', 10);

-- Insert sample items for Groceries category
INSERT INTO items (category_id, name, description, base_price, unit, tags)
SELECT
  c.id,
  item.name,
  item.description,
  item.base_price,
  item.unit,
  item.tags
FROM categories c,
(VALUES
  ('Rice (1kg)', 'Local rice, perfect for meals', 8.00, 'bag', ARRAY['rice', 'staple', 'carbs']),
  ('Bread (Loaf)', 'Fresh bread loaf', 3.50, 'loaf', ARRAY['bread', 'bakery', 'breakfast']),
  ('Eggs (12 pieces)', 'Fresh chicken eggs', 12.00, 'crate', ARRAY['eggs', 'protein', 'breakfast']),
  ('Milk (1L)', 'Fresh cow milk', 6.00, 'bottle', ARRAY['milk', 'dairy', 'calcium']),
  ('Tomatoes (1kg)', 'Fresh red tomatoes', 5.00, 'kg', ARRAY['tomatoes', 'vegetables', 'fresh']),
  ('Onions (1kg)', 'Fresh onions', 4.00, 'kg', ARRAY['onions', 'vegetables', 'cooking']),
  ('Cooking Oil (1L)', 'Vegetable cooking oil', 15.00, 'bottle', ARRAY['oil', 'cooking', 'kitchen']),
  ('Sugar (1kg)', 'White granulated sugar', 7.00, 'bag', ARRAY['sugar', 'sweetener', 'baking'])
) AS item(name, description, base_price, unit, tags)
WHERE c.name = 'Groceries';

-- Insert sample items for Fast Food category
INSERT INTO items (category_id, name, description, base_price, unit, tags)
SELECT
  c.id,
  item.name,
  item.description,
  item.base_price,
  item.unit,
  item.tags
FROM categories c,
(VALUES
  ('Fried Rice', 'Delicious fried rice with vegetables', 15.00, 'plate', ARRAY['rice', 'fried', 'meal']),
  ('Jollof Rice', 'Spicy West African jollof rice', 12.00, 'plate', ARRAY['jollof', 'rice', 'spicy']),
  ('Waakye', 'Traditional rice and beans dish', 10.00, 'plate', ARRAY['waakye', 'beans', 'traditional']),
  ('Banku & Tilapia', 'Banku with grilled tilapia fish', 25.00, 'plate', ARRAY['banku', 'fish', 'grilled']),
  ('Kelewele', 'Spiced fried plantain', 8.00, 'portion', ARRAY['plantain', 'spiced', 'snack']),
  ('Meat Pie', 'Pastry filled with seasoned meat', 5.00, 'piece', ARRAY['pie', 'meat', 'pastry']),
  ('Chicken & Chips', 'Fried chicken with potato chips', 20.00, 'plate', ARRAY['chicken', 'chips', 'fried'])
) AS item(name, description, base_price, unit, tags)
WHERE c.name = 'Fast Food';

-- Insert sample items for Beverages category
INSERT INTO items (category_id, name, description, base_price, unit, tags)
SELECT
  c.id,
  item.name,
  item.description,
  item.base_price,
  item.unit,
  item.tags
FROM categories c,
(VALUES
  ('Coca Cola (350ml)', 'Classic Coca Cola soft drink', 3.00, 'bottle', ARRAY['coke', 'cola', 'soft drink']),
  ('Sprite (350ml)', 'Lemon-lime flavored soft drink', 3.00, 'bottle', ARRAY['sprite', 'lemon', 'lime']),
  ('Fanta Orange (350ml)', 'Orange flavored soft drink', 3.00, 'bottle', ARRAY['fanta', 'orange', 'fruity']),
  ('Bottled Water (750ml)', 'Pure drinking water', 2.00, 'bottle', ARRAY['water', 'pure', 'hydration']),
  ('Fruit Juice (500ml)', 'Fresh mixed fruit juice', 8.00, 'bottle', ARRAY['juice', 'fruit', 'fresh']),
  ('Energy Drink', 'Energy boost drink', 6.00, 'can', ARRAY['energy', 'boost', 'caffeine']),
  ('Malt Drink', 'Non-alcoholic malt beverage', 4.00, 'bottle', ARRAY['malt', 'drink', 'refreshing'])
) AS item(name, description, base_price, unit, tags)
WHERE c.name = 'Beverages';

-- Insert sample items for Snacks category
INSERT INTO items (category_id, name, description, base_price, unit, tags)
SELECT
  c.id,
  item.name,
  item.description,
  item.base_price,
  item.unit,
  item.tags
FROM categories c,
(VALUES
  ('Potato Chips', 'Crispy potato chips', 4.00, 'pack', ARRAY['chips', 'potato', 'crispy']),
  ('Biscuits', 'Sweet cream biscuits', 3.00, 'pack', ARRAY['biscuits', 'sweet', 'cream']),
  ('Peanuts (Roasted)', 'Roasted groundnuts', 5.00, 'pack', ARRAY['peanuts', 'roasted', 'nuts']),
  ('Chin Chin', 'Traditional fried snack', 6.00, 'pack', ARRAY['chin chin', 'fried', 'traditional']),
  ('Chocolate Bar', 'Milk chocolate bar', 8.00, 'bar', ARRAY['chocolate', 'sweet', 'candy']),
  ('Popcorn', 'Buttered popcorn', 4.00, 'pack', ARRAY['popcorn', 'buttered', 'movie'])
) AS item(name, description, base_price, unit, tags)
WHERE c.name = 'Snacks';

-- Insert sample items for Personal Care category
INSERT INTO items (category_id, name, description, base_price, unit, tags)
SELECT
  c.id,
  item.name,
  item.description,
  item.base_price,
  item.unit,
  item.tags
FROM categories c,
(VALUES
  ('Toothpaste', 'Fluoride toothpaste for healthy teeth', 8.00, 'tube', ARRAY['toothpaste', 'dental', 'hygiene']),
  ('Soap Bar', 'Antibacterial soap bar', 5.00, 'bar', ARRAY['soap', 'antibacterial', 'cleansing']),
  ('Shampoo (400ml)', 'Hair cleansing shampoo', 15.00, 'bottle', ARRAY['shampoo', 'hair', 'cleansing']),
  ('Deodorant', 'Long-lasting deodorant', 12.00, 'bottle', ARRAY['deodorant', 'fragrance', 'protection']),
  ('Tissue Paper', 'Soft facial tissues', 6.00, 'pack', ARRAY['tissue', 'facial', 'soft']),
  ('Hand Sanitizer', 'Alcohol-based hand sanitizer', 10.00, 'bottle', ARRAY['sanitizer', 'alcohol', 'disinfectant'])
) AS item(name, description, base_price, unit, tags)
WHERE c.name = 'Personal Care';

-- Create some sample users (passwords would be handled by Supabase Auth)
INSERT INTO users (id, email, phone, full_name, user_type, university, hall_hostel, room_number, is_verified, rating, total_orders) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'student1@example.com', '+233241234567', 'Kwame Asante', 'student', 'University of Ghana', 'Commonwealth Hall', 'A23', true, 0, 0),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'runner1@example.com', '+233247654321', 'Akosua Mensah', 'runner', 'University of Ghana', NULL, NULL, true, 4.8, 145),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@DoorKet.com', '+233501234567', 'Admin User', 'admin', 'University of Ghana', NULL, NULL, true, 0, 0);

-- Insert sample order
INSERT INTO orders (student_id, total_amount, service_fee, delivery_fee, delivery_address, payment_method, payment_status, status) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 47.35, 2.35, 2.00, 'Commonwealth Hall, Room A23, University of Ghana', 'momo', 'paid', 'completed');

-- Get the order ID for sample order items
INSERT INTO order_items (order_id, item_id, quantity, unit_price, actual_price)
SELECT
  o.id,
  i.id,
  2,
  i.base_price,
  i.base_price
FROM orders o, items i
WHERE i.name = 'Fried Rice'
AND o.order_number = (SELECT order_number FROM orders LIMIT 1)
LIMIT 1;
