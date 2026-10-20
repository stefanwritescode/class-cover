-- For now Stretch accepts three teacher trainings, and any of them qualifies a teacher for every class.
-- Finer rules (e.g. Reformer vs Mat) can come back later by adding trainings and narrowing each class.
delete from trainings where id not in (select training_id from profile_trainings);

insert into trainings (name, provider) values
  ('Stretch Pilates Teacher Training', 'Stretch Pilates'),
  ('BASI Pilates Teacher Training', 'BASI'),
  ('Body Intellect Teacher Training', 'Body Intellect')
on conflict (name) do nothing;

update timetable_classes
  set accepted_training_ids = array(select id from trainings where name in (
    'Stretch Pilates Teacher Training', 'BASI Pilates Teacher Training', 'Body Intellect Teacher Training'));
