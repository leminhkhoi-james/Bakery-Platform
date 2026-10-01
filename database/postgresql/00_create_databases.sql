-- Chạy bằng psql với tài khoản có quyền CREATE DATABASE.
-- \gexec là lệnh của psql, giúp script có thể chạy lại mà không lỗi nếu DB đã tồn tại.

SELECT 'CREATE DATABASE identity_db WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'identity_db') \gexec

SELECT 'CREATE DATABASE bakery_db WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bakery_db') \gexec

SELECT 'CREATE DATABASE marketplace_db WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'marketplace_db') \gexec

SELECT 'CREATE DATABASE order_db WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db') \gexec

SELECT 'CREATE DATABASE chat_db WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chat_db') \gexec

SELECT 'CREATE DATABASE cake_ai_db WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cake_ai_db') \gexec

SELECT 'CREATE DATABASE subscription_db WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'subscription_db') \gexec
