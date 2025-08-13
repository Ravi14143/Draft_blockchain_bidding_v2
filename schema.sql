CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN (
        'owner',
        'bidder',
        'admin'
    ))
);

CREATE TABLE rfqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    scope TEXT NOT NULL,
    deadline TEXT NOT NULL,
    evaluation_criteria TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfq_id INTEGER NOT NULL,
    bidder_id INTEGER NOT NULL,
    price REAL NOT NULL,
    timeline TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    document_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
    FOREIGN KEY (bidder_id) REFERENCES users(id)
);

CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfq_id INTEGER NOT NULL,
    winner_bid_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
    FOREIGN KEY (winner_bid_id) REFERENCES bids(id)
);

CREATE TABLE milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    document_hash TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

