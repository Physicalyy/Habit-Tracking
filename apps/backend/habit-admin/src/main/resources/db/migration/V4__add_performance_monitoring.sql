-- Affected tables: monitor_request_record, monitor_slow_sql_record
-- Target database: MySQL; backend tests run on H2 in MySQL compatibility mode.
-- DML: none. This migration only creates monitoring tables and indexes.
-- Retention: no automatic cleanup is included in this release. Rows will keep growing until manually cleaned or a later cleanup task is implemented.
-- Rollback: drop monitor_slow_sql_record first, then monitor_request_record.

create table monitor_request_record (
    id bigint not null,
    request_id varchar(64) not null,
    method varchar(16) not null,
    path varchar(512) not null,
    route_pattern varchar(512),
    query_string varchar(1024),
    status_code int not null,
    duration_ms bigint not null,
    client_ip varchar(64),
    user_agent varchar(512),
    user_id bigint,
    openid varchar(128),
    exception_class varchar(256),
    sql_count int not null default 0,
    slow_sql_count int not null default 0,
    start_time datetime not null,
    create_time datetime not null,
    primary key (id),
    constraint uk_monitor_request_record_request_id unique (request_id)
);
create index idx_monitor_request_record_create_time on monitor_request_record (create_time);
create index idx_monitor_request_record_duration_ms on monitor_request_record (duration_ms);
create index idx_monitor_request_record_path on monitor_request_record (path);
create index idx_monitor_request_record_route_pattern on monitor_request_record (route_pattern);

create table monitor_slow_sql_record (
    id bigint not null,
    request_id varchar(64) not null,
    statement_id varchar(256) not null,
    sql_command_type varchar(32),
    sql_text varchar(4000) not null,
    sql_hash varchar(64) not null,
    duration_ms bigint not null,
    create_time datetime not null,
    primary key (id)
);
create index idx_monitor_slow_sql_record_request_id on monitor_slow_sql_record (request_id);
create index idx_monitor_slow_sql_record_create_time on monitor_slow_sql_record (create_time);
create index idx_monitor_slow_sql_record_duration_ms on monitor_slow_sql_record (duration_ms);
create index idx_monitor_slow_sql_record_statement_id on monitor_slow_sql_record (statement_id);
create index idx_monitor_slow_sql_record_sql_hash on monitor_slow_sql_record (sql_hash);
