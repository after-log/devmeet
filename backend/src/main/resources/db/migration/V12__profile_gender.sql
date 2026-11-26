ALTER TABLE profiles ADD COLUMN gender varchar(10) NULL CHECK (gender IN ('남성', '여성'));
