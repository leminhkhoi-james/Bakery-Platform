-- DEV/TEST ONLY. Substitute :password_hash with a quoted BCrypt hash.
INSERT INTO users(id,email,password_hash,display_name,phone_number) VALUES
('10000000-0000-0000-0000-000000000001','customer@example.test',:password_hash,'Test Customer','0900000001'),
('10000000-0000-0000-0000-000000000002','owner@example.test',:password_hash,'Test Owner','0900000002');
INSERT INTO user_roles(user_id,role_id) SELECT '10000000-0000-0000-0000-000000000001',id FROM roles WHERE code='CUSTOMER';
INSERT INTO user_roles(user_id,role_id) SELECT '10000000-0000-0000-0000-000000000002',id FROM roles WHERE code='BAKERY_OWNER';
INSERT INTO user_addresses(id,user_id,label,recipient_name,recipient_phone,address_line,district,city) VALUES
('10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Home','Test Customer','0900000001','1 Test Street','D1','HCM');
