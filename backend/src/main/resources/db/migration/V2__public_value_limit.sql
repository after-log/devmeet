-- MySQL CHECK constraints do not allow subqueries or stored functions.
-- Enforce the JSON answer limit on both INSERT and UPDATE with triggers.
DELIMITER //

CREATE TRIGGER profiles_public_values_insert
BEFORE INSERT ON profiles
FOR EACH ROW
BEGIN
    DECLARE public_count INT;
    SELECT COUNT(*) INTO public_count
    FROM JSON_TABLE(NEW.value_answers, '$.*' COLUMNS (
        answer_choice VARCHAR(1000) PATH '$.choice' NULL ON EMPTY,
        is_private VARCHAR(5) PATH '$.private' DEFAULT '"true"' ON EMPTY
    )) AS answers
    WHERE answers.is_private = 'false' AND answers.answer_choice IS NOT NULL;
    IF public_count > 10 THEN
        SIGNAL SQLSTATE '23000' SET MYSQL_ERRNO = 3819,
            MESSAGE_TEXT = 'At most 10 value answers may be public';
    END IF;
END//

CREATE TRIGGER profiles_public_values_update
BEFORE UPDATE ON profiles
FOR EACH ROW
BEGIN
    DECLARE public_count INT;
    SELECT COUNT(*) INTO public_count
    FROM JSON_TABLE(NEW.value_answers, '$.*' COLUMNS (
        answer_choice VARCHAR(1000) PATH '$.choice' NULL ON EMPTY,
        is_private VARCHAR(5) PATH '$.private' DEFAULT '"true"' ON EMPTY
    )) AS answers
    WHERE answers.is_private = 'false' AND answers.answer_choice IS NOT NULL;
    IF public_count > 10 THEN
        SIGNAL SQLSTATE '23000' SET MYSQL_ERRNO = 3819,
            MESSAGE_TEXT = 'At most 10 value answers may be public';
    END IF;
END//

DELIMITER ;
