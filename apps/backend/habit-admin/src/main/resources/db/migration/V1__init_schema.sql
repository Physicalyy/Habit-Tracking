create table auth_user_account (
    id bigint not null,
    openid varchar(128) not null,
    unionid varchar(128),
    nickname varchar(64),
    avatar_url varchar(512),
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_auth_user_account_openid unique (openid)
);

create table family_group (
    id bigint not null,
    name varchar(64) not null,
    created_by_user_id bigint not null,
    admin_member_id bigint,
    status varchar(32) not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id)
);
create index idx_family_group_created_by_user_id on family_group (created_by_user_id);
create index idx_family_group_admin_member_id on family_group (admin_member_id);

create table family_member (
    id bigint not null,
    family_id bigint not null,
    user_id bigint not null,
    display_name varchar(64),
    status varchar(32) not null,
    joined_time datetime not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_family_member_family_user unique (family_id, user_id)
);
create index idx_family_member_user_id on family_member (user_id);

create table family_invite_code (
    id bigint not null,
    family_id bigint not null,
    code varchar(6) not null,
    status varchar(32) not null,
    created_by_member_id bigint not null,
    expires_time datetime not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_family_invite_code_code unique (code)
);
create index idx_family_invite_code_family_status on family_invite_code (family_id, status);

create table child_profile (
    id bigint not null,
    family_id bigint not null,
    nickname varchar(64) not null,
    birth_date date,
    status varchar(32) not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id)
);
create index idx_child_profile_family_id on child_profile (family_id);

create table habit_template (
    id bigint not null,
    slug varchar(128) not null,
    name varchar(64) not null,
    description varchar(512),
    category varchar(64),
    age_min int,
    age_max int,
    icon_key varchar(128),
    image_url varchar(512),
    source_type varchar(32) not null,
    family_id bigint,
    created_by_member_id bigint,
    status varchar(32) not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_habit_template_slug unique (slug)
);
create index idx_habit_template_family_id on habit_template (family_id);
create index idx_habit_template_category on habit_template (category);

create table habit_child_config (
    id bigint not null,
    family_id bigint not null,
    child_id bigint not null,
    template_id bigint not null,
    active_template_id bigint,
    name varchar(64) not null,
    description varchar(512),
    icon_key varchar(128),
    image_url varchar(512),
    permission_type varchar(32) not null,
    created_by_member_id bigint not null,
    status varchar(32) not null,
    sort_order int not null default 0,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_habit_child_config_child_active_template unique (child_id, active_template_id)
);
create index idx_habit_child_config_family_child on habit_child_config (family_id, child_id);

create table habit_child_allowed_member (
    id bigint not null,
    child_habit_id bigint not null,
    family_member_id bigint not null,
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_habit_child_allowed_member unique (child_habit_id, family_member_id)
);
create index idx_habit_child_allowed_member_member on habit_child_allowed_member (family_member_id);

create table habit_checkin_record (
    id bigint not null,
    family_id bigint not null,
    child_id bigint not null,
    child_habit_id bigint not null,
    checkin_date date not null,
    checked_by_member_id bigint not null,
    checked_time datetime not null,
    note varchar(512),
    create_by varchar(32),
    create_time datetime not null,
    update_by varchar(32),
    update_time datetime,
    del_flag varchar(1) not null default '0',
    ts datetime not null,
    primary key (id),
    constraint uk_habit_checkin_record_habit_date unique (child_habit_id, checkin_date)
);
create index idx_habit_checkin_record_family_child_date on habit_checkin_record (family_id, child_id, checkin_date);
