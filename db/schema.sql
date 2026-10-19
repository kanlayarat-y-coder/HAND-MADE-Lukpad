-- LUKPAD HAND MADE : MySQL schema (ตาม Data Dictionary ในรายงาน + ฟิลด์ที่ต้องเพิ่มสำหรับแอป)
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,            -- เก็บเป็น hash (bcrypt) ห้ามเก็บรหัสจริง
  phone VARCHAR(20),
  address TEXT,
  user_role ENUM('customer','admin') NOT NULL DEFAULT 'customer'
);
CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  product_image VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 59,
  size VARCHAR(50),
  description TEXT,
  color VARCHAR(100),
  is_customizable TINYINT(1) DEFAULT 0       -- เพิ่ม: เปิด/ปิดการปรับแต่ง
);
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  ship_address TEXT,                          -- เพิ่ม: ที่อยู่ ณ วันสั่งซื้อ
  order_status ENUM('รอชำระเงิน','ตรวจสอบชำระเงินแล้ว','กำลังจัดทำ','จัดส่งแล้ว','สำเร็จ','ยกเลิก') DEFAULT 'รอชำระเงิน',
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE order_details (
  order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
CREATE TABLE customizations (
  custom_id INT AUTO_INCREMENT PRIMARY KEY,
  order_detail_id INT NOT NULL,               -- ใช้ตาม Data Dictionary (ใน ER เดิมเขียน order_id ควรแก้ให้ตรงกัน)
  custom_color VARCHAR(50),
  custom_size VARCHAR(50),
  custom_pattern VARCHAR(100),
  custom_text VARCHAR(100),
  custom_price DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (order_detail_id) REFERENCES order_details(order_detail_id)
);
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  receipt_no VARCHAR(30),
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_amount DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'รอตรวจสอบ',
  bank_name VARCHAR(100),
  account_name VARCHAR(100),
  account_number VARCHAR(30),
  slip_image VARCHAR(255),                    -- เพิ่ม: ไฟล์สลิปที่ลูกค้าแนบ
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
CREATE TABLE shipments (
  shipment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  shipping_company VARCHAR(100),
  tracking_number VARCHAR(100),
  shipping_status VARCHAR(50),
  shipping_fee DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
