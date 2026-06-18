insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200001, 'brush-teeth', '刷牙', '每天早晚认真刷牙，保护口腔健康。', 'HEALTH', 2, 12, 'dentistry', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'brush-teeth');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200002, 'wash-hands', '洗手', '饭前便后、外出回家后主动洗手。', 'HEALTH', 2, 12, 'soap', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'wash-hands');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200003, 'drink-water', '主动喝水', '白天主动喝水，保持身体水分充足。', 'HEALTH', 0, 12, 'water_drop', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'drink-water');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200004, 'sleep-on-time', '按时睡觉', '每天在固定时间上床睡觉，保证充足睡眠。', 'HEALTH', 0, 12, 'bedtime', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'sleep-on-time');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200005, 'make-bed', '整理床铺', '起床后整理床铺，保持卧室整洁。', 'LIFE_SKILLS', 3, 12, 'bed', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'make-bed');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200006, 'clean-up-toys', '收拾玩具', '玩完玩具后主动归位，培养责任感。', 'LIFE_SKILLS', 2, 9, 'toys', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'clean-up-toys');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200007, 'organize-desk', '整理书桌', '学习后整理桌面和文具，保持专注环境。', 'LIFE_SKILLS', 6, 12, 'desk', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'organize-desk');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200008, 'prepare-schoolbag', '整理书包', '睡前或上学前检查书包和学习用品。', 'LIFE_SKILLS', 6, 12, 'backpack', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'prepare-schoolbag');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200009, 'read-books', '课外阅读', '每天坚持阅读，拓展知识面和表达能力。', 'LEARNING', 3, 12, 'menu_book', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'read-books');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200010, 'finish-homework', '完成作业', '按时独立完成作业，巩固课堂学习。', 'LEARNING', 6, 12, 'assignment', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'finish-homework');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200011, 'review-lesson', '课后复习', '当天复习课堂内容，及时巩固记忆。', 'LEARNING', 6, 12, 'history_edu', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'review-lesson');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200012, 'practice-writing', '练字', '每天练习书写，提升字迹工整度。', 'LEARNING', 6, 12, 'draw', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'practice-writing');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200013, 'jump-rope', '跳绳', '坚持跳绳运动，锻炼协调性和耐力。', 'SPORTS', 3, 12, 'sports_gymnastics', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'jump-rope');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200014, 'outdoor-activity', '户外活动', '每天进行适量户外活动，放松眼睛和身体。', 'SPORTS', 0, 12, 'nature_people', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'outdoor-activity');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200015, 'eye-exercises', '眼保健操', '按时做眼保健操，缓解用眼疲劳。', 'SPORTS', 6, 12, 'visibility', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'eye-exercises');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200016, 'morning-run', '晨跑', '早晨进行轻量跑步，开启精神的一天。', 'SPORTS', 6, 12, 'directions_run', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'morning-run');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200017, 'say-thanks', '说谢谢', '得到帮助时主动表达感谢。', 'SOCIAL_EMOTION', 3, 12, 'volunteer_activism', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'say-thanks');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200018, 'share-feelings', '表达感受', '学会说出自己的感受和需要。', 'SOCIAL_EMOTION', 5, 12, 'chat', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'share-feelings');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200019, 'help-others', '帮助他人', '在力所能及的范围内主动帮助别人。', 'SOCIAL_EMOTION', 3, 12, 'groups', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'help-others');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200020, 'deep-breathing', '深呼吸', '情绪紧张时练习深呼吸，帮助自己平静下来。', 'SOCIAL_EMOTION', 5, 12, 'self_improvement', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'deep-breathing');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200021, 'watch-traffic', '看红绿灯', '过马路前观察红绿灯和车辆。', 'SAFETY', 3, 12, 'traffic', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'watch-traffic');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200022, 'stranger-danger', '远离陌生人', '不跟陌生人离开，遇到情况及时找可信大人。', 'SAFETY', 3, 12, 'shield', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'stranger-danger');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200023, 'know-phone', '记电话号码', '记住家长电话或紧急联系方式。', 'SAFETY', 5, 12, 'phone', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'know-phone');
insert into habit_template (
    id, slug, name, description, category, age_min, age_max, icon_key, image_url,
    source_type, family_id, created_by_member_id, status,
    create_by, create_time, update_by, update_time, del_flag, ts
)
select 200024, 'no-outlets', '不碰插座', '不触碰电源插座和危险电器。', 'SAFETY', 3, 9, 'power_off', '', 'SYSTEM', null, null, 'active', 'seed', current_timestamp, 'seed', current_timestamp, '0', current_timestamp
where not exists (select 1 from habit_template where slug = 'no-outlets');
