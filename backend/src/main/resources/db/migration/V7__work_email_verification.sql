CREATE TABLE work_email_challenges (
    id binary(16) PRIMARY KEY,
    account_id binary(16) NOT NULL,
    company varchar(100) NOT NULL,
    email varchar(254) NOT NULL,
    code_hash varchar(100) NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at timestamp(6) NOT NULL,
    attempts int NOT NULL DEFAULT 0,
    consumed boolean NOT NULL DEFAULT false,
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    INDEX work_email_owner(account_id, created_at),
    INDEX work_email_recipient(email, created_at)
);

CREATE TABLE work_email_verifications (
    account_id binary(16) PRIMARY KEY,
    company varchar(100) NOT NULL,
    email varchar(254) NOT NULL UNIQUE,
    verified_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY(account_id) REFERENCES accounts(id)
);
