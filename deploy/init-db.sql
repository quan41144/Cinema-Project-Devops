CREATE USER showtime_user WITH PASSWORD '123456';
CREATE USER audience_user WITH PASSWORD '123456';
CREATE USER booking_user  WITH PASSWORD '123456';
CREATE USER ticket_user   WITH PASSWORD '123456';

CREATE DATABASE cinemabox_showtime_db OWNER showtime_user;
CREATE DATABASE cinemabox_audience_db OWNER audience_user;
CREATE DATABASE cinemabox_booking_db  OWNER booking_user;
CREATE DATABASE cinemabox_ticket_db   OWNER ticket_user;

REVOKE ALL ON DATABASE cinemabox_showtime_db FROM PUBLIC;
REVOKE ALL ON DATABASE cinemabox_audience_db FROM PUBLIC;
REVOKE ALL ON DATABASE cinemabox_booking_db  FROM PUBLIC;
REVOKE ALL ON DATABASE cinemabox_ticket_db   FROM PUBLIC;

GRANT ALL PRIVILEGES ON DATABASE cinemabox_showtime_db TO showtime_user;
GRANT ALL PRIVILEGES ON DATABASE cinemabox_audience_db TO audience_user;
GRANT ALL PRIVILEGES ON DATABASE cinemabox_booking_db  TO booking_user;
GRANT ALL PRIVILEGES ON DATABASE cinemabox_ticket_db   TO ticket_user;