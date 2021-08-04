CREATE DATABASE ddroutes;

create table user
(
    user_id           varchar(255) not null
        primary key,
    user_type         int          not null,
    username          varchar(255) not null,
    email             varchar(255) not null,
    password          varchar(255) not null,
    address           varchar(255) not null,
    city              varchar(255) not null,
    state             varchar(255) not null,
    postcode          varchar(100) not null,
    country           varchar(255) not null,
    dob               datetime     not null,
    gender            varchar(255) not null,
    fullname          varchar(255) not null,
    mobile_no         varchar(255) not null,
    race              varchar(255) not null,
    religion          varchar(255) not null,
    start_date        date         null,
    position          varchar(255) null,
    profile_img       varchar(255) null,
    profile_img_path  varchar(255) null,
    created_date_time datetime     not null,
    created_by        varchar(255) null,
    constraint email
        unique (email),
    constraint username
        unique (username)
);

create table vehicle
(
    id                   int auto_increment
        primary key,
    vehicle_id           varchar(255) not null,
    plate_no             varchar(50)  not null,
    brand                varchar(100) not null,
    model                varchar(100) not null,
    color                varchar(100) not null,
    fuel_efficiency      decimal(20)  not null,
    fuel_efficiency_unit varchar(100) not null,
    fuel_tank            decimal(20)  not null,
    type                 varchar(50)  not null,
    owner                varchar(50)  not null,
    gps_track_no         varchar(100) null,
    photo                varchar(255) null,
    photo_path           varchar(255) null,
    created_by           varchar(255) null,
    updated_by           varchar(255) null,
    created_at           datetime     not null,
    updated_at           datetime     null,
    constraint plate_no
        unique (plate_no),
    constraint vehicle_id
        unique (vehicle_id),
    constraint vehicle_user_user_id_fk
        foreign key (owner) references user (user_id)
            on delete cascade
);

create table price_plan
(
    price_plan_id           varchar(255)   not null
        primary key,
    vehicle_type            varchar(100)   not null,
    default_weight_prefix   varchar(50)    not null,
    default_weight          decimal(20, 2) not null,
    default_weight_unit     varchar(50)    not null,
    default_distance_prefix varchar(50)    not null,
    default_distance        decimal(20, 2) not null,
    default_distance_unit   varchar(50)    not null,
    default_pricing         decimal(20, 2) not null,
    sub_distance            decimal(20, 2) null,
    sub_distance_pricing    decimal(20, 2) null,
    sub_distance_unit       varchar(50)    null,
    sub_weight              decimal(20, 2) null,
    sub_weight_pricing      decimal(20, 2) null,
    sub_weight_unit         varchar(50)    null,
    created_by              varchar(255)   null,
    created_at              datetime       not null,
    updated_by              varchar(255)   null,
    updated_at              datetime       null,
    constraint price_plan_vehicle_type_uindex
        unique (vehicle_type),
    constraint price_plan_user_user_id_fk
        foreign key (created_by) references user (user_id),
    constraint price_plan_user_user_id_fk_2
        foreign key (updated_by) references user (user_id)
);

create table courier_order
(
    order_id                    varchar(255)   not null
        primary key,
    order_no                    varchar(255)   not null,
    order_type                  varchar(255)   not null,
    order_status                varchar(100)   null,
    tracking_no                 varchar(255)   not null,
    sender_name                 varchar(255)   not null,
    sender_mobile_no            varchar(100)   not null,
    sender_email                varchar(255)   null,
    sender_address              varchar(255)   not null,
    sender_city                 varchar(255)   not null,
    sender_state                varchar(255)   not null,
    sender_postcode             varchar(255)   not null,
    sender_latitude             varchar(255)   not null,
    sender_longitude            varchar(255)   not null,
    sender_formatted_address    varchar(255)   not null,
    recipient_name              varchar(255)   not null,
    recipient_mobile_no         varchar(100)   not null,
    recipient_email             varchar(255)   null,
    recipient_address           varchar(255)   not null,
    recipient_city              varchar(255)   not null,
    recipient_state             varchar(255)   not null,
    recipient_postcode          varchar(255)   not null,
    recipient_latitude          varchar(255)   not null,
    recipient_longitude         varchar(255)   not null,
    recipient_formatted_address varchar(255)   not null,
    item_qty                    int            not null,
    item_type                   varchar(100)   not null,
    item_weight                 decimal(20, 3) not null,
    vehicle_type                varchar(100)   not null,
    shipping_cost               decimal(20, 2) not null,
    payment_method              varchar(100)   null,
    proof_id                    varchar(255)   null,
    route_id                    varchar(255)   null,
    sort_id                     int            null,
    is_picked_up                tinyint(1)     null,
    pickup_order_status         varchar(100)   null,
    pickup_proof_id             varchar(255)   null,
    pickup_sort_id              int            null,
    pickup_route_id             varchar(255)   null,
    created_by                  varchar(255)   null,
    created_at                  datetime       not null,
    updated_by                  varchar(255)   null,
    updated_at                  datetime       null,
    est_arrive_time             int            null,
    constraint order_no
        unique (order_no),
    constraint tracking_no
        unique (tracking_no),
    constraint courier_order_order_routes_route_id_fk
        foreign key (route_id) references order_routes (route_id)
            on delete cascade,
    constraint courier_order_task_proof_proof_id_fk
        foreign key (proof_id) references task_proof (proof_id)
);

create table route_report
(
    route_report_id            varchar(255)   not null
        primary key,
    actual_petrol_fees         decimal(20, 2) null,
    calculated_distance_travel decimal(20, 3) null,
    calculated_petrol_fees     decimal(20, 2) null,
    calculated_petrol_usage    decimal(20, 3) null,
    latest_petrol_price        decimal(20, 2) null,
    statement                  varchar(255)   null,
    statement_path             varchar(255)   null,
    total_items_qty            int            not null,
    route_id                   varchar(255)   null,
    created_by                 varchar(255)   null,
    created_at                 datetime       not null,
    updated_by                 varchar(255)   null,
    updated_at                 datetime       null,
    constraint route_report_order_routes_route_id_fk
        foreign key (route_id) references order_routes (route_id)
            on delete cascade
);

create table order_routes
(
    route_id        varchar(255)   not null
        primary key,
    departure_point int            not null,
    round_trip      tinyint(1)     null,
    departure_date  datetime       not null,
    departure_time  datetime       not null,
    personnel       varchar(255)   not null,
    status          varchar(255)   not null,
    time_needed     decimal(20, 2) null,
    total_distance  decimal(20, 3) null,
    vehicle_id      varchar(255)   null,
    created_by      varchar(255)   null,
    created_at      datetime       not null,
    updated_by      varchar(255)   null,
    updated_at      datetime       null,
    started_at      datetime       null,
    constraint order_routes_company_addresses_id_fk
        foreign key (departure_point) references company_addresses (id),
    constraint order_routes_user_user_id_fk
        foreign key (personnel) references user (user_id),
    constraint order_routes_vehicle_vehicle_id_fk
        foreign key (vehicle_id) references vehicle (vehicle_id)
);

create table company_addresses
(
    id                int auto_increment
        primary key,
    address           varchar(255) not null,
    city              varchar(255) not null,
    state             varchar(255) not null,
    postcode          varchar(255) not null,
    latitude          varchar(255) not null,
    longitude         varchar(255) not null,
    formatted_address varchar(255) not null
);

create table task_proof
(
    proof_id             varchar(255) not null
        primary key,
    courier_personnel_id varchar(255) not null,
    signature            varchar(255) null,
    signature_path       varchar(100) null,
    status               varchar(100) not null,
    reason               varchar(255) null,
    picked_at            datetime     null,
    received_at          datetime     null,
    recipient_name       varchar(255) null,
    recipient_ic_no      varchar(100) null,
    arrived_at           datetime     not null,
    created_by           varchar(255) null,
    created_at           datetime     not null,
    updated_by           varchar(255) null,
    updated_at           datetime     null,
    constraint task_proof_user_user_id_fk
        foreign key (courier_personnel_id) references user (user_id)
);
