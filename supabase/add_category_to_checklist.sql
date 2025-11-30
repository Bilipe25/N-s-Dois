-- Adiciona a coluna 'category' na tabela 'checklist_items'
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral';

-- Opcional: Atualizar itens existentes para ter uma categoria padrão
UPDATE checklist_items 
SET category = 'Geral' 
WHERE category IS NULL;
