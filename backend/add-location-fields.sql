-- Add country and city fields to campaigns table
ALTER TABLE campaigns ADD COLUMN country TEXT;
ALTER TABLE campaigns ADD COLUMN city TEXT;

-- Add country and city fields to polls table
ALTER TABLE polls ADD COLUMN country TEXT;
ALTER TABLE polls ADD COLUMN city TEXT;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_campaigns_country ON campaigns(country);
CREATE INDEX IF NOT EXISTS idx_campaigns_city ON campaigns(city);
CREATE INDEX IF NOT EXISTS idx_polls_country ON polls(country);
CREATE INDEX IF NOT EXISTS idx_polls_city ON polls(city);
