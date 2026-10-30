ALTER TABLE accounts ADD COLUMN suspended boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN photo_status varchar(16) NOT NULL DEFAULT 'PENDING';
ALTER TABLE profiles ADD COLUMN photo_review_reason varchar(500) NOT NULL DEFAULT '';

CREATE TABLE recommendation_batches (
    owner_id binary(16) NOT NULL,
    day date NOT NULL,
    PRIMARY KEY(owner_id, day),
    FOREIGN KEY(owner_id) REFERENCES accounts(id)
);
CREATE TABLE recommendations (
    owner_id binary(16) NOT NULL,
    day date NOT NULL,
    position int NOT NULL,
    target_id binary(16) NOT NULL,
    PRIMARY KEY(owner_id, day, position),
    UNIQUE(owner_id, day, target_id),
    FOREIGN KEY(owner_id) REFERENCES accounts(id),
    FOREIGN KEY(target_id) REFERENCES accounts(id)
);
CREATE TABLE likes (
    sender_id binary(16) NOT NULL,
    target_id binary(16) NOT NULL,
    day date NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY(sender_id, target_id),
    FOREIGN KEY(sender_id) REFERENCES accounts(id),
    FOREIGN KEY(target_id) REFERENCES accounts(id),
    CHECK(sender_id <> target_id),
    INDEX likes_daily_quota(sender_id, day),
    INDEX likes_received(target_id, created_at)
);
CREATE TABLE matches (
    id binary(16) PRIMARY KEY,
    first_id binary(16) NOT NULL,
    second_id binary(16) NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE(first_id, second_id),
    FOREIGN KEY(first_id) REFERENCES accounts(id),
    FOREIGN KEY(second_id) REFERENCES accounts(id),
    CHECK(first_id < second_id)
);
CREATE TABLE messages (
    sequence_id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id binary(16) NOT NULL UNIQUE,
    match_id binary(16) NOT NULL,
    sender_id binary(16) NOT NULL,
    body varchar(1000) NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY(match_id) REFERENCES matches(id),
    FOREIGN KEY(sender_id) REFERENCES accounts(id),
    INDEX messages_history(match_id, sequence_id)
);
CREATE TABLE blocks (
    sender_id binary(16) NOT NULL,
    target_id binary(16) NOT NULL,
    PRIMARY KEY(sender_id, target_id),
    FOREIGN KEY(sender_id) REFERENCES accounts(id),
    FOREIGN KEY(target_id) REFERENCES accounts(id),
    CHECK(sender_id <> target_id)
);
CREATE TABLE reports (
    id binary(16) PRIMARY KEY,
    sender_id binary(16) NOT NULL,
    target_id binary(16) NOT NULL,
    reason varchar(500) NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'OPEN',
    review_note varchar(1000) NOT NULL DEFAULT '',
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_at timestamp(6) NULL,
    FOREIGN KEY(sender_id) REFERENCES accounts(id),
    FOREIGN KEY(target_id) REFERENCES accounts(id),
    CHECK(sender_id <> target_id)
);
CREATE TABLE photos (
    id binary(16) PRIMARY KEY,
    owner_id binary(16) NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY(owner_id) REFERENCES accounts(id)
);
CREATE TABLE oauth_identities (
    provider varchar(16) NOT NULL,
    subject varchar(128) NOT NULL,
    account_id binary(16) NOT NULL,
    PRIMARY KEY(provider, subject),
    UNIQUE(account_id, provider),
    FOREIGN KEY(account_id) REFERENCES accounts(id)
);
CREATE TABLE admin_audit (
    id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    actor varchar(254) NOT NULL,
    action varchar(40) NOT NULL,
    target_id binary(16) NOT NULL,
    note varchar(1000) NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);
