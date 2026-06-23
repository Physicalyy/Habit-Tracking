create table growth_partner_template (
    id bigint not null,
    template_code varchar(128) not null,
    name varchar(64) not null,
    description varchar(512),
    sort_order int not null default 0,
    status varchar(32) not null,
    default_animation_type varchar(32) not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_growth_partner_template_code unique (template_code)
);

create table growth_partner_stage (
    id bigint not null,
    template_id bigint not null,
    stage_code varchar(128) not null,
    name varchar(64) not null,
    required_growth_points int not null,
    image_url varchar(512) not null,
    preview_image_url varchar(512) not null,
    sort_order int not null default 0,
    status varchar(32) not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_growth_partner_stage_code unique (template_id, stage_code)
);
create index idx_growth_partner_stage_template on growth_partner_stage (template_id, sort_order);

create table child_growth_partner (
    id bigint not null,
    family_id bigint not null,
    child_id bigint not null,
    template_id bigint not null,
    nickname varchar(64) not null,
    growth_points int not null default 0,
    status varchar(32) not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_child_growth_partner_child unique (child_id)
);
create index idx_child_growth_partner_family_child on child_growth_partner (family_id, child_id);

create table growth_partner_log (
    id bigint not null,
    family_id bigint not null,
    child_id bigint not null,
    child_growth_partner_id bigint not null,
    template_id bigint not null,
    checkin_record_id bigint not null,
    delta int not null,
    before_growth_points int not null,
    after_growth_points int not null,
    before_stage_code varchar(128) not null,
    after_stage_code varchar(128) not null,
    stage_changed varchar(1) not null,
    animation_type varchar(32) not null,
    status varchar(32) not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_growth_partner_log_checkin unique (checkin_record_id)
);
create index idx_growth_partner_log_child on growth_partner_log (child_id, status);

insert into growth_partner_template (
    id, template_code, name, description, sort_order, status, default_animation_type,
    create_by, create_time, update_by, update_time, del_flag, ts
) values (
    300001, 'thunder-war-tiger', '雷纹战虎', '陪伴孩子在每日习惯中积累成长能量。', 1, 'active', 'css',
    'system', current_timestamp, 'system', current_timestamp, '0', current_timestamp
);

insert into growth_partner_stage (
    id, template_id, stage_code, name, required_growth_points, image_url, preview_image_url, sort_order, status,
    create_by, create_time, update_by, update_time, del_flag, ts
) values
(
    300101, 300001, 'thunder-war-tiger-egg', '雷纹虎蛋', 0,
    '/assets/partners/thunder-war-tiger-stage-0.png', '/assets/partners/thunder-war-tiger-stage-0.png', 1, 'active',
    'system', current_timestamp, 'system', current_timestamp, '0', current_timestamp
),
(
    300102, 300001, 'thunder-war-tiger-cub', '幼年雷纹虎', 20,
    '/assets/partners/thunder-war-tiger-stage-1.png', '/assets/partners/thunder-war-tiger-stage-1.png', 2, 'active',
    'system', current_timestamp, 'system', current_timestamp, '0', current_timestamp
),
(
    300103, 300001, 'thunder-war-tiger-spark', '跃电雷纹虎', 40,
    '/assets/partners/thunder-war-tiger-stage-2.png', '/assets/partners/thunder-war-tiger-stage-2.png', 3, 'active',
    'system', current_timestamp, 'system', current_timestamp, '0', current_timestamp
),
(
    300104, 300001, 'thunder-war-tiger-battle', '战纹雷虎', 60,
    '/assets/partners/thunder-war-tiger-stage-3.png', '/assets/partners/thunder-war-tiger-stage-3.png', 4, 'active',
    'system', current_timestamp, 'system', current_timestamp, '0', current_timestamp
),
(
    300105, 300001, 'thunder-war-tiger-armor', '雷铠战虎', 80,
    '/assets/partners/thunder-war-tiger-stage-4.png', '/assets/partners/thunder-war-tiger-stage-4.png', 5, 'active',
    'system', current_timestamp, 'system', current_timestamp, '0', current_timestamp
),
(
    300106, 300001, 'thunder-war-tiger-wing', '雷翼战虎', 100,
    '/assets/partners/thunder-war-tiger-stage-5.png', '/assets/partners/thunder-war-tiger-stage-5.png', 6, 'active',
    'system', current_timestamp, 'system', current_timestamp, '0', current_timestamp
);
