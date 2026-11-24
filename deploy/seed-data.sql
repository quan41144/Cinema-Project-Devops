INSERT INTO categories (name, slug) VALUES
                                        ('Hài', 'hai'),
                                        ('Hành động', 'hanh-dong'),
                                        ('Khoa học viễn tưởng', 'khoa-hoc-vien-tuong'),
                                        ('Tâm lý, tình cảm', 'tam-ly-tinh-cam'),
                                        ('Hoạt hình', 'hoat-hinh')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO rooms (name, total_rows, total_cols) VALUES
                                                     ('Phòng chiếu số 2', 11, 15),
                                                     ('Phòng chiếu số 5', 11, 15)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO seats (room_id, seat_code, row_label, col_number, seat_type)
SELECT
    r.id,
    row_lbl || col_num::text,
    row_lbl,
    col_num,
    CASE
        WHEN row_lbl = 'K' THEN 'COUPLE'
        WHEN row_lbl IN ('D','E','F','G','H','I','J') AND col_num BETWEEN 3 AND 13 THEN 'VIP'
        ELSE 'STANDARD'
        END
FROM rooms r
         CROSS JOIN unnest(ARRAY['A','B','C','D','E','F','G','H','I','J','K']) AS row_lbl
         CROSS JOIN generate_series(1, 15) AS col_num
    ON CONFLICT (room_id, seat_code) DO NOTHING;

DELETE FROM ticket_price_rules;
INSERT INTO ticket_price_rules (format, day_type, time_slot, start_hour, end_hour, seat_type, base_price, long_movie_surcharge) VALUES
                                                                                                                                    ('2D','WEEKDAY','BEFORE_12','00:00','12:00','STANDARD', 55000,10000),
                                                                                                                                    ('2D','WEEKDAY','BEFORE_12','00:00','12:00','VIP',      65000,10000),
                                                                                                                                    ('2D','WEEKDAY','BEFORE_12','00:00','12:00','COUPLE',  140000,10000),
                                                                                                                                    ('2D','WEEKDAY','12_TO_17', '12:00','17:00','STANDARD', 70000,10000),
                                                                                                                                    ('2D','WEEKDAY','12_TO_17', '12:00','17:00','VIP',      75000,10000),
                                                                                                                                    ('2D','WEEKDAY','12_TO_17', '12:00','17:00','COUPLE',  160000,10000),
                                                                                                                                    ('2D','WEEKDAY','17_TO_23', '17:00','23:00','STANDARD', 80000,10000),
                                                                                                                                    ('2D','WEEKDAY','17_TO_23', '17:00','23:00','VIP',      85000,10000),
                                                                                                                                    ('2D','WEEKDAY','17_TO_23', '17:00','23:00','COUPLE',  180000,10000),
                                                                                                                                    ('2D','WEEKDAY','AFTER_23', '23:00','23:59','STANDARD', 65000,10000),
                                                                                                                                    ('2D','WEEKDAY','AFTER_23', '23:00','23:59','VIP',      70000,10000),
                                                                                                                                    ('2D','WEEKDAY','AFTER_23', '23:00','23:59','COUPLE',  150000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','BEFORE_12','00:00','12:00','STANDARD', 70000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','BEFORE_12','00:00','12:00','VIP',      80000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','BEFORE_12','00:00','12:00','COUPLE',  170000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','12_TO_17', '12:00','17:00','STANDARD', 80000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','12_TO_17', '12:00','17:00','VIP',      85000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','12_TO_17', '12:00','17:00','COUPLE',  180000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','17_TO_23', '17:00','23:00','STANDARD', 90000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','17_TO_23', '17:00','23:00','VIP',      95000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','17_TO_23', '17:00','23:00','COUPLE',  200000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','AFTER_23', '23:00','23:59','STANDARD', 75000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','AFTER_23', '23:00','23:59','VIP',      80000,10000),
                                                                                                                                    ('2D','WEEKEND_HOLIDAY','AFTER_23', '23:00','23:59','COUPLE',  170000,10000),
                                                                                                                                    ('3D','WEEKDAY','BEFORE_12','00:00','12:00','STANDARD', 60000,10000),
                                                                                                                                    ('3D','WEEKDAY','BEFORE_12','00:00','12:00','VIP',      80000,10000),
                                                                                                                                    ('3D','WEEKDAY','BEFORE_12','00:00','12:00','COUPLE',  160000,10000),
                                                                                                                                    ('3D','WEEKDAY','12_TO_17', '12:00','17:00','STANDARD', 80000,10000),
                                                                                                                                    ('3D','WEEKDAY','12_TO_17', '12:00','17:00','VIP',      90000,10000),
                                                                                                                                    ('3D','WEEKDAY','12_TO_17', '12:00','17:00','COUPLE',  180000,10000),
                                                                                                                                    ('3D','WEEKDAY','17_TO_23', '17:00','23:00','STANDARD',100000,10000),
                                                                                                                                    ('3D','WEEKDAY','17_TO_23', '17:00','23:00','VIP',     110000,10000),
                                                                                                                                    ('3D','WEEKDAY','17_TO_23', '17:00','23:00','COUPLE',  220000,10000),
                                                                                                                                    ('3D','WEEKDAY','AFTER_23', '23:00','23:59','STANDARD',100000,10000),
                                                                                                                                    ('3D','WEEKDAY','AFTER_23', '23:00','23:59','VIP',     110000,10000),
                                                                                                                                    ('3D','WEEKDAY','AFTER_23', '23:00','23:59','COUPLE',  220000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','BEFORE_12','00:00','12:00','STANDARD', 80000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','BEFORE_12','00:00','12:00','VIP',     100000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','BEFORE_12','00:00','12:00','COUPLE',  200000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','12_TO_17', '12:00','17:00','STANDARD',100000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','12_TO_17', '12:00','17:00','VIP',     110000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','12_TO_17', '12:00','17:00','COUPLE',  220000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','17_TO_23', '17:00','23:00','STANDARD',130000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','17_TO_23', '17:00','23:00','VIP',     140000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','17_TO_23', '17:00','23:00','COUPLE',  280000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','AFTER_23', '23:00','23:59','STANDARD',120000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','AFTER_23', '23:00','23:59','VIP',     130000,10000),
                                                                                                                                    ('3D','WEEKEND_HOLIDAY','AFTER_23', '23:00','23:59','COUPLE',  260000,10000);

INSERT INTO movies (title, slug, poster_url, backdrop_url, age_rating, duration_minutes, release_date, status) VALUES
                                                                                                                   ('CƯỜI XUYÊN BIÊN GIỚI - T13', 'cuoi-xuyen-bien-gioi', 'https://placehold.co/238x333/1b2230/ffffff?text=Cuoi+Xuyen+Bien+Gioi', 'https://placehold.co/1440x500/1a2232/ffffff?text=Cuoi+Xuyen+Bien+Gioi', 'T13', 113, '2026-11-15', 'NOW_SHOWING'),
                                                                                                                   ('MẬT MÃ ĐỎ - K - Phụ đề', 'mat-ma-do', 'https://placehold.co/238x333/2b1a1e/ffffff?text=Mat+Ma+Do', 'https://placehold.co/1440x500/2b1a1e/ffffff?text=Mat+Ma+Do', 'K', 120, '2026-11-08', 'NOW_SHOWING'),
                                                                                                                   ('VENOM: THE LAST DANCE - T13', 'venom-the-last-dance', 'https://placehold.co/238x333/14171c/ffffff?text=Venom+3', 'https://placehold.co/1440x500/14171c/ffffff?text=Venom+3', 'T13', 109, '2026-11-01', 'NOW_SHOWING'),
                                                                                                                   ('NGÀY XƯA CÓ MỘT CHUYỆN TÌNH - T16', 'ngay-xua-co-mot-chuyen-tinh', 'https://placehold.co/238x333/2c2419/ffffff?text=Ngay+Xua+Chuyen+Tinh', 'https://placehold.co/1440x500/2c2419/ffffff?text=Ngay+Xua+Chuyen+Tinh', 'T16', 135, '2026-10-28', 'NOW_SHOWING'),
                                                                                                                   ('VÕ SĨ GIÁC ĐẤU II - T18', 'vo-si-giac-dau-2', 'https://placehold.co/238x333/2b211a/ffffff?text=Gladiator+II', 'https://placehold.co/1440x500/2b211a/ffffff?text=Gladiator+II', 'T18', 148, '2026-12-01', 'COMING_SOON'),
                                                                                                                   ('HÀNH TRÌNH CỦA MOANA 2 - P', 'moana-2', 'https://placehold.co/238x333/142d38/ffffff?text=Moana+2', 'https://placehold.co/1440x500/142d38/ffffff?text=Moana+2', 'P', 100, '2026-12-10', 'COMING_SOON')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO movie_details (movie_id, country, director, cast_list, synopsis_short, synopsis_full, trailer_url, rating_description)
SELECT m.id, d.country, d.director, d.cast_list, d.syn_short, d.syn_full, d.trailer, d.rating_desc
FROM movies m
         JOIN (VALUES
                   ('cuoi-xuyen-bien-gioi', 'Hàn Quốc', 'KIM Chang-ju', 'Ryu Seung-ryong, Jin Sun-kyu, Yeom Hye-ran',
                    'Hành trình dở khóc dở cười của cựu vô địch bắn cung Jin-bong tại khu rừng Amazon.',
                    'Cười Xuyên Biên Giới kể về hành trình của Jin-bong - cựu vô địch bắn cung quốc gia nhận nhiệm vụ bất khả thi tại rừng rậm Amazon và gặp bộ ba chiến binh bắn cung bản địa cực kỳ tài năng.',
                    'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Kiểm duyệt: T13 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+)'),
                   ('mat-ma-do', 'Mỹ', 'Jake Kasdan', 'Dwayne Johnson, Chris Evans, Lucy Liu',
                    'Cuộc giải cứu Ông già Noel bị bắt cóc đầy kịch tính trước thềm Giáng sinh.',
                    'Sau khi Ông già Noel bị bắt cóc, Trưởng An ninh Bắc Cực buộc phải hợp tác với tay săn tiền thưởng khét tiếng nhất thế giới trong nhiệm vụ giải cứu xuyên lục địa.',
                    'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Kiểm duyệt: K - Phim phổ biến đến người xem dưới 13 tuổi có người bảo hộ đi kèm'),
                   ('venom-the-last-dance', 'Mỹ', 'Kelly Marcel', 'Tom Hardy, Chiwetel Ejiofor, Juno Temple',
                    'Eddie và Venom bị truy lùng bởi cả hai thế giới trong chương cuối cùng.',
                    'Eddie Brock và Venom đang chạy trốn. Bị truy đuổi bởi cả hai thế giới và vòng vây ngày càng khép chặt, bộ đôi buộc phải đưa ra quyết định tàn khốc cho vũ điệu cuối cùng.',
                    'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Kiểm duyệt: T13 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+)'),
                   ('ngay-xua-co-mot-chuyen-tinh', 'Việt Nam', 'Trịnh Đình Lê Minh', 'Avin Lu, Ngọc Xuân, Đỗ Nhật Hoàng',
                    'Chuyển thể từ tác phẩm nổi tiếng về tình bạn và tình yêu tuổi thanh xuân của Nguyễn Nhật Ánh.',
                    'Câu chuyện về Vinh, Miền và Phúc cùng nhau lớn lên ở vùng quê yên bình và những rung động đầu đời kéo dài suốt nhiều năm tháng trưởng thành.',
                    'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Kiểm duyệt: T16 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 16 TUỔI TRỞ LÊN (16+)'),
                   ('vo-si-giac-dau-2', 'Mỹ', 'Ridley Scott', 'Paul Mescal, Pedro Pascal, Denzel Washington',
                    'Lucius bước vào đấu trường La Mã đối mặt với các hoàng đế tàn bạo.',
                    'Nhiều năm sau cái chết của Maximus, Lucius buộc phải tiến vào đấu trường Colosseum khi quê hương bị chinh phục bởi các hoàng đế độc tài của La Mã.',
                    'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Kiểm duyệt: T18 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 18 TUỔI TRỞ LÊN (18+)'),
                   ('moana-2', 'Mỹ', 'David Derrick Jr.', 'Auli''i Cravalho, Dwayne Johnson',
                    'Moana nhận được lời triệu hồi bất ngờ từ tổ tiên và căng buồm ra vùng biển xa.',
                    'Ba năm sau chuyến phiêu lưu đầu tiên, Moana cùng Maui và đoàn thủy thủ mới vượt qua những vùng biển nguy hiểm chưa từng được biết tới của châu Đại Dương.',
                    'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Kiểm duyệt: P - Phim phổ biến đến khán giả ở mọi độ tuổi')
) AS d(slug, country, director, cast_list, syn_short, syn_full, trailer, rating_desc)
              ON m.slug = d.slug
    ON CONFLICT (movie_id) DO NOTHING;

INSERT INTO movie_categories (movie_id, category_id)
SELECT m.id, c.id FROM movies m JOIN categories c ON
    (m.slug = 'cuoi-xuyen-bien-gioi' AND c.slug = 'hai') OR
    (m.slug = 'mat-ma-do' AND c.slug = 'hanh-dong') OR
    (m.slug = 'venom-the-last-dance' AND c.slug = 'khoa-hoc-vien-tuong') OR
    (m.slug = 'ngay-xua-co-mot-chuyen-tinh' AND c.slug = 'tam-ly-tinh-cam') OR
    (m.slug = 'vo-si-giac-dau-2' AND c.slug = 'hanh-dong') OR
    (m.slug = 'moana-2' AND c.slug = 'hoat-hinh')
    ON CONFLICT DO NOTHING;

INSERT INTO showtimes (movie_id, room_id, format, show_date, start_time, end_time, status)
SELECT m.id, r.id, v.fmt, v.sdate::date, v.stime::time, (v.stime::time + make_interval(mins => m.duration_minutes)), 'OPEN'
FROM (VALUES
          ('cuoi-xuyen-bien-gioi', 'Phòng chiếu số 2', '2D', '2026-11-24', '18:00'),
          ('cuoi-xuyen-bien-gioi', 'Phòng chiếu số 2', '2D', '2026-11-24', '20:05'),
          ('cuoi-xuyen-bien-gioi', 'Phòng chiếu số 5', '2D', '2026-11-25', '19:35'),
          ('mat-ma-do',            'Phòng chiếu số 5', '2D', '2026-11-24', '19:30'),
          ('venom-the-last-dance', 'Phòng chiếu số 2', '2D', '2026-11-25', '21:00'),
          ('ngay-xua-co-mot-chuyen-tinh', 'Phòng chiếu số 5', '2D', '2026-11-25', '20:15')
     ) AS v(slug, rname, fmt, sdate, stime)
         JOIN movies m ON m.slug = v.slug
         JOIN rooms r ON r.name = v.rname
WHERE NOT EXISTS (SELECT 1 FROM showtimes);

INSERT INTO showtime_seats (showtime_id, seat_id, seat_code, seat_type, status)
SELECT st.id, s.id, s.seat_code, s.seat_type, 'AVAILABLE'
FROM showtimes st
         JOIN seats s ON s.room_id = st.room_id
    ON CONFLICT (showtime_id, seat_code) DO NOTHING;