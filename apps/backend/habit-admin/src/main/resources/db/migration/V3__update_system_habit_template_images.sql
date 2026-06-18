update habit_template
set image_url = concat('/assets/habits/', slug, '.png'),
    update_by = 'seed',
    update_time = current_timestamp,
    ts = current_timestamp
where source_type = 'SYSTEM'
  and slug in (
    'brush-teeth',
    'wash-hands',
    'drink-water',
    'sleep-on-time',
    'make-bed',
    'clean-up-toys',
    'organize-desk',
    'prepare-schoolbag',
    'read-books',
    'finish-homework',
    'review-lesson',
    'practice-writing',
    'jump-rope',
    'outdoor-activity',
    'eye-exercises',
    'morning-run',
    'say-thanks',
    'share-feelings',
    'help-others',
    'deep-breathing',
    'watch-traffic',
    'stranger-danger',
    'know-phone',
    'no-outlets'
  )
  and del_flag = '0';
