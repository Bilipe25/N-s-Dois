-- Adiciona a coluna 'notes' na tabela 'checklist_items'
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS notes TEXT;
