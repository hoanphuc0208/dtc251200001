CREATE TABLE IF NOT EXISTS pets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(40) NOT NULL,
  breed VARCHAR(80),
  age_months INT DEFAULT 0 CHECK (age_months >= 0),
  gender VARCHAR(20) DEFAULT 'Chưa rõ',
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 1 CHECK (stock >= 0),
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(160),
  preferred_species VARCHAR(40),
  budget_min NUMERIC(12,2) DEFAULT 0,
  budget_max NUMERIC(12,2) DEFAULT 0,
  lifestyle VARCHAR(100),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT DEFAULT '',
  duration_minutes INT NOT NULL DEFAULT 60,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  pet_id INT REFERENCES pets(id) ON DELETE SET NULL,
  service_id INT REFERENCES services(id) ON DELETE SET NULL,
  appointment_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Đã đặt',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS care_logs (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  pet_id INT REFERENCES pets(id) ON DELETE SET NULL,
  channel VARCHAR(30) NOT NULL DEFAULT 'Điện thoại',
  summary TEXT NOT NULL,
  next_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pets (name,species,breed,age_months,gender,price,stock,description,image_url)
SELECT * FROM (VALUES
 ('Milo','Chó','Poodle nâu',4,'Đực',6500000,2,'Thân thiện, phù hợp căn hộ.',''),
 ('Bông','Mèo','Mèo Anh lông ngắn',5,'Cái',7800000,1,'Tính cách điềm tĩnh, cần chải lông định kỳ.',''),
 ('Đậu','Chó','Corgi',3,'Đực',12500000,1,'Hiếu động, cần vận động mỗi ngày.',''),
 ('Miu','Mèo','Mèo mướp',2,'Cái',1200000,3,'Dễ chăm sóc, thích nghi tốt.','')
) AS v(name,species,breed,age_months,gender,price,stock,description,image_url)
WHERE NOT EXISTS (SELECT 1 FROM pets);

INSERT INTO services (name,category,description,duration_minutes,price)
SELECT * FROM (VALUES
 ('Tắm & sấy','Spa cơ bản','Tắm, sấy khô và vệ sinh tai.',45,150000),
 ('Cắt tỉa tạo kiểu','Làm đẹp','Tỉa lông theo giống và yêu cầu.',75,280000),
 ('Cắt móng & vệ sinh','Vệ sinh','Cắt móng, vệ sinh mắt và tai.',25,80000),
 ('Spa toàn diện','Spa cao cấp','Tắm dưỡng, chải lông, cắt móng và tạo kiểu.',100,450000),
 ('Khám tư vấn chăm sóc','Tư vấn','Tư vấn dinh dưỡng và lịch chăm sóc.',30,120000)
) AS v(name,category,description,duration_minutes,price)
WHERE NOT EXISTS (SELECT 1 FROM services);

INSERT INTO customers (full_name,phone,email,preferred_species,budget_min,budget_max,lifestyle,notes)
SELECT * FROM (VALUES
 ('Nguyễn Minh Anh','0901000001','minhanh@example.com','Mèo',2000000,9000000,'Căn hộ','Ưu tiên giống ít rụng lông.'),
 ('Trần Quốc Bảo','0901000002','quocbao@example.com','Chó',5000000,15000000,'Nhà có sân','Có thời gian đi dạo hằng ngày.')
) AS v(full_name,phone,email,preferred_species,budget_min,budget_max,lifestyle,notes)
WHERE NOT EXISTS (SELECT 1 FROM customers);
