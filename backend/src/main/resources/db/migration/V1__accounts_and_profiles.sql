CREATE TABLE accounts (
    id binary(16) PRIMARY KEY,
    email varchar(254) NOT NULL UNIQUE,
    password_hash varchar(100) NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT accounts_email_normalized CHECK (email = lower(trim(email)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE profiles (
    account_id binary(16) PRIMARY KEY,
    CONSTRAINT profiles_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    name varchar(30) NOT NULL,
    age integer NOT NULL CHECK (age BETWEEN 19 AND 80),
    height integer NOT NULL CHECK (height BETWEEN 100 AND 250),
    location varchar(60) NOT NULL,
    job varchar(60) NOT NULL,
    education varchar(40) NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('developer', 'non-developer')),
    meeting varchar(40) NOT NULL,
    contact varchar(40) NOT NULL,
    preference varchar(20) NOT NULL,
    smoking varchar(30) NOT NULL,
    drinking varchar(30) NOT NULL,
    religion varchar(30) NOT NULL,
    intro varchar(1000) NOT NULL,
    tags json NOT NULL DEFAULT (JSON_ARRAY()) CHECK (JSON_TYPE(tags) = 'ARRAY'),
    photo mediumtext NOT NULL,
    min_age integer NOT NULL DEFAULT 19,
    max_age integer NOT NULL DEFAULT 60,
    region varchar(40) NOT NULL DEFAULT '',
    value_answers json NOT NULL DEFAULT (JSON_OBJECT()),
    CONSTRAINT profiles_age_filter CHECK (min_age >= 19 AND max_age <= 80 AND min_age <= max_age),
    CONSTRAINT profiles_value_answers_object CHECK (JSON_TYPE(value_answers) = 'OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE INDEX profiles_recommendation_filter ON profiles (role, location, age);
