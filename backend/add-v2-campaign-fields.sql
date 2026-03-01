-- V2 Campaign Fields Migration
-- Adds new required fields for V2 campaign structure

-- Add standard_reference field (required)
ALTER TABLE campaigns ADD COLUMN standard_reference TEXT;

-- Add standard_reference_other field (for custom standards)
ALTER TABLE campaigns ADD COLUMN standard_reference_other TEXT;

-- Add demanded_action field (required)
ALTER TABLE campaigns ADD COLUMN demanded_action TEXT;

-- Add response_deadline_days field (required)
ALTER TABLE campaigns ADD COLUMN response_deadline_days INTEGER;

-- Add response_deadline_date field (calculated)
ALTER TABLE campaigns ADD COLUMN response_deadline_date DATETIME;

-- Add sent_to_organization_at field (when campaign was sent)
ALTER TABLE campaigns ADD COLUMN sent_to_organization_at DATETIME;

-- Update existing campaigns with default values
UPDATE campaigns 
SET 
    standard_reference = 'İnsan Hakları Evrensel Beyannamesi',
    demanded_action = 'Belirtilmemiş',
    response_deadline_days = 30
WHERE standard_reference IS NULL;
