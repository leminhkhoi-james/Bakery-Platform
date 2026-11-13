-- DEV/TEST ONLY. Deliberately isolated from Flyway production migrations.
INSERT INTO subscription_plans(id,code,name,monthly_price) VALUES ('30000000-0000-0000-0000-000000000001','DEV_TEST','Test Plan',100000);
INSERT INTO subscription_orders(id,order_number,bakery_id,plan_id,requested_by_user_id,plan_name_snapshot,billing_period_months,total_amount,status,expires_at) VALUES
('30000000-0000-0000-0000-000000000002','SUB-DEV-001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Test Plan',1,100000,'COMPLETED',now()+interval '1 day');
INSERT INTO bakery_subscriptions(bakery_id,plan_id,source_order_id,status,period_start,period_end) VALUES
('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','ACTIVE',now()-interval '1 day',now()+interval '30 days');
