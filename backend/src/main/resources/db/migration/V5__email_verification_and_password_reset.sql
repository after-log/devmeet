ALTER TABLE accounts ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
CREATE TABLE account_tokens (
    token_hash char(64) PRIMARY KEY,
    account_id binary(16) NOT NULL,
    purpose varchar(16) NOT NULL,
    expires_at timestamp(6) NOT NULL,
    consumed boolean NOT NULL DEFAULT false,
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    INDEX account_tokens_owner(account_id, purpose)
);
