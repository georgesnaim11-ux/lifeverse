-- Demographics: biological sex / gender as a permanent character attribute.
ALTER TABLE characters ADD COLUMN gender TEXT NOT NULL DEFAULT 'male';
