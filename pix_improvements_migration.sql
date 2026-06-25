-- Melhorias PIX + Mural de Mensagens
-- Executar no Supabase Dashboard (SQL Editor)

-- 1. Novos campos na app_config para PIX melhorado
ALTER TABLE app_config 
ADD COLUMN IF NOT EXISTS pix_recipient_name TEXT DEFAULT 'Gabriel Felipe Lisboa dos Santos',
ADD COLUMN IF NOT EXISTS pix_city TEXT DEFAULT 'CAMPO DO BRITO';

-- 2. Tabela de confirmações de PIX
CREATE TABLE IF NOT EXISTS pix_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_name TEXT NOT NULL,
    message TEXT,
    amount DECIMAL(10,2),
    gift_id UUID REFERENCES bridal_shower_gifts(id) ON DELETE SET NULL,
    gift_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pix_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on pix_confirmations" ON pix_confirmations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on pix_confirmations" ON pix_confirmations FOR SELECT USING (true);
CREATE POLICY "Allow auth delete on pix_confirmations" ON pix_confirmations FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Tabela do mural de mensagens
CREATE TABLE IF NOT EXISTS message_wall (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE message_wall ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on message_wall" ON message_wall FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on message_wall" ON message_wall FOR SELECT USING (true);
CREATE POLICY "Allow auth delete on message_wall" ON message_wall FOR DELETE USING (auth.role() = 'authenticated');
