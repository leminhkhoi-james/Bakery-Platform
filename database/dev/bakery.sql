-- DEV/TEST ONLY.
INSERT INTO bakeries(id,name,phone_number,status) VALUES ('20000000-0000-0000-0000-000000000001','Test Bakery','0900000002','ACTIVE');
INSERT INTO bakery_members(bakery_id,user_id,member_role) VALUES ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','OWNER');
INSERT INTO service_areas(bakery_id,city,district) VALUES ('20000000-0000-0000-0000-000000000001','HCM','D1');
INSERT INTO products(id,bakery_id,name,slug,base_price,status,customizable) VALUES ('20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Chocolate Cake','chocolate-cake',500000,'PUBLISHED',true);
INSERT INTO add_ons(id,bakery_id,name,category,price) VALUES ('20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Candles','DECORATION',20000);
INSERT INTO product_option_groups(id,product_id,name,selection_type,required,minimum_selections,maximum_selections) VALUES ('20000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002','Flavor','SINGLE',true,1,1);
INSERT INTO product_option_values(id,option_group_id,name) VALUES ('20000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000004','Chocolate');
