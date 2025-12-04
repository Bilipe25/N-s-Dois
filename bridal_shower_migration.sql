-- Adicionar campos na tabela app_config
ALTER TABLE app_config 
ADD COLUMN IF NOT EXISTS bridal_shower_date_2 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bridal_shower_location_2 TEXT,
ADD COLUMN IF NOT EXISTS bridal_shower_address_1 TEXT,
ADD COLUMN IF NOT EXISTS bridal_shower_address_2 TEXT,
ADD COLUMN IF NOT EXISTS bridal_shower_map_link_1 TEXT,
ADD COLUMN IF NOT EXISTS bridal_shower_map_link_2 TEXT,
ADD COLUMN IF NOT EXISTS contact_phone_gabriel TEXT,
ADD COLUMN IF NOT EXISTS contact_phone_raabe TEXT;

-- Adicionar campo na tabela bridal_shower_guests
ALTER TABLE bridal_shower_guests
ADD COLUMN IF NOT EXISTS confirmed_location TEXT; -- 'local1' ou 'local2'
