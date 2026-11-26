ALTER TABLE accounts
    ADD COLUMN mock_member boolean NOT NULL DEFAULT false,
    ADD COLUMN mock_disabled boolean NOT NULL DEFAULT false,
    ADD INDEX accounts_mock_member (mock_member);

UPDATE accounts a
SET a.mock_member = true
WHERE a.email REGEXP '^mock-member-[0-9]{2}@devmeet[.]test$'
  AND EXISTS (
    SELECT 1 FROM admin_audit audit
    WHERE audit.target_id = a.id AND audit.action = 'MOCK_MEMBER_CREATE'
  );

CREATE TABLE mock_member_settings (
    id int PRIMARY KEY CHECK (id = 1),
    enabled boolean NOT NULL
);

INSERT INTO mock_member_settings(id, enabled) VALUES(1, true);
