-- 创建 cities 表
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  city_name TEXT NOT NULL,
  year TEXT NOT NULL,
  base_min INTEGER NOT NULL,
  base_max INTEGER NOT NULL,
  rate FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 salaries 表
CREATE TABLE IF NOT EXISTS salaries (
  id SERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  month TEXT NOT NULL,
  salary_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 results 表
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  avg_salary FLOAT NOT NULL,
  contribution_base FLOAT NOT NULL,
  company_fee FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cities_city_name_year ON cities(city_name, year);
CREATE INDEX IF NOT EXISTS idx_salaries_employee_name ON salaries(employee_name);
CREATE INDEX IF NOT EXISTS idx_salaries_month ON salaries(month);
CREATE INDEX IF NOT EXISTS idx_results_employee_name ON results(employee_name);

-- 创建触发器函数以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每张表添加触发器
CREATE TRIGGER set_timestamp_cities
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_salaries
    BEFORE UPDATE ON salaries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- 插入示例数据
INSERT INTO cities (city_name, year, base_min, base_max, rate) VALUES
('佛山', '2024', 3323, 26421, 0.15),
('广州', '2024', 3623, 26421, 0.16),
('深圳', '2024', 2360, 25920, 0.145);

INSERT INTO salaries (employee_id, employee_name, month, salary_amount) VALUES
('001', '张三', '202401', 8000),
('001', '张三', '202402', 8500),
('001', '张三', '202403', 8200),
('002', '李四', '202401', 12000),
('002', '李四', '202402', 12500),
('002', '李四', '202403', 13000),
('003', '王五', '202401', 6000),
('003', '王五', '202402', 6200),
('003', '王五', '202403', 5800);