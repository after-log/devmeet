CREATE TABLE company_email_registry_lock (id int PRIMARY KEY, CHECK(id=1));
INSERT INTO company_email_registry_lock VALUES(1);
CREATE TABLE company_email_domains (
    domain varchar(253) PRIMARY KEY,
    company varchar(100) NOT NULL,
    website varchar(500) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    note varchar(1000) NOT NULL,
    reviewed_by varchar(254) NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);
CREATE TABLE company_email_reviews (
    id binary(16) PRIMARY KEY,
    account_id binary(16) NOT NULL,
    email varchar(254) NOT NULL,
    company varchar(100) NOT NULL,
    domain varchar(253) NOT NULL,
    website varchar(500) NOT NULL DEFAULT '',
    evidence varchar(2000) NOT NULL DEFAULT '',
    status varchar(16) NOT NULL DEFAULT 'PENDING',
    approval_scope varchar(16) NULL,
    review_note varchar(1000) NOT NULL DEFAULT '',
    reviewed_by varchar(254) NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_at timestamp(6) NULL,
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    CHECK(status IN ('PENDING','APPROVED','REJECTED','SUPERSEDED','REVOKED')),
    CHECK(approval_scope IS NULL OR approval_scope IN ('MEMBER','DOMAIN')),
    INDEX company_review_queue(status,created_at),
    INDEX company_review_domain(domain,status),
    INDEX company_review_member(account_id,created_at)
);
-- Existing email ownership confirmations remain distinct from corporate approval.
ALTER TABLE work_email_verifications
    ADD COLUMN company_review_id binary(16) NULL,
    ADD FOREIGN KEY(company_review_id) REFERENCES company_email_reviews(id);
