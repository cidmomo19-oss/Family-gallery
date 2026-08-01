CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Umum',
    media_type TEXT CHECK(media_type IN ('image', 'video')) NOT NULL,
    r2_key TEXT NOT NULL,
    view_url TEXT NOT NULL,
    download_url TEXT NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
