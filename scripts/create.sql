CREATE DATABASE ddroutes;

CREATE TABLE USER
(
    user_id           varchar(255) DEFAULT (uuid()) PRIMARY KEY,
    user_type         int          NOT NULl,
    username          varchar(255) NOT NULl UNIQUE,
    email             varchar(255) NOT NULl UNIQUE,
    password          varchar(255) NOT NULl,

    address           varchar(255) NOT NULl,
    city              varchar(255) NOT NULl,
    state             varchar(255) NOT NULl,
    postcode          varchar(100) NOT NULl,
    country           varchar(100) NOT NULl,
    dob               Date         NOT NULl,
    gender            varchar(50)  NOT NULl,
    fullname          varchar(255) NOT NULl,
    mobile_no         varchar(100) NOT NULl,
    race              varchar(255) NOT NULl,
    religion          varchar(100) NOT NULl,

    start_date        Date,
    position          varchar(100),
    profile_img       varchar(255),
    profile_img_path  varchar(255),

    created_date_time datetime     NOT NULl,
    created_by        varchar(255)
);

CREATE TABLE STATE_LIST
(
    id   int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    NAME varchar(255),
    ABBR varchar(100)
);

CREATE TABLE RACE_LIST
(
    id   int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    NAME varchar(255)
);

CREATE TABLE RELIGION_LIST
(
    id   int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    NAME varchar(255)
);

CREATE TABLE VEHICLE
(
    id                   int          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    vehicle_id           varchar(255) NOT NULL UNIQUE,
    plate_no             varchar(50)  NOT NULL UNIQUE,
    brand                varchar(100) NOT NULL,
    model                varchar(100) NOT NULL,
    color                varchar(100) NOT NULL,
    fuel_efficiency      decimal(20)  NOT NULL,
    fuel_efficiency_unit varchar(100) NOT NULL,
    fuel_tank            decimal(20)  NOT NULL,
    type                 varchar(50)  NOT NULL,
    owner                varchar(50)  NOT NULL,
    gps_track_no         varchar(100),
    photo                varchar(255),
    photo_path           varchar(255),
    created_by           varchar(255) REFERENCES User (user_id),
    updated_by           varchar(255) REFERENCES User (user_id),
    created_at           DATETIME     NOT NULL,
    updated_at           DATETIME
);

CREATE TABLE CAR_BRAND_LIST
(
    id   int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    NAME varchar(255)
);

CREATE TABLE MOTORCYCLE_BRAND_LIST
(
    id   int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    NAME varchar(255)
);

CREATE TABLE PRICE_PLAN
(
    price_plan_id           varchar(255)        NOT NULL PRIMARY KEY,

    default_weight_prefix   varchar(50)         NOT NULL,
    default_weight          decimal(20, 2)      NOT NULL,
    default_weight_unit     varchar(50)         NOT NULL,

    default_distance_prefix varchar(50)         NOT NULL,
    default_distance        decimal(20, 2)      NOT NULL,
    default_distance_unit   varchar(50)         NOT NULL,

    default_pricing         decimal(20, 2)      NOT NULL,

    vehicle_type            varchar(100) UNIQUE NOT NULL,

    sub_distance            decimal(20, 2),
    sub_distance_pricing    decimal(20, 2),
    sub_distance_unit       varchar(50),


    sub_weight              decimal(20, 2),
    sub_weight_pricing      decimal(20, 2),
    sub_weight_unit         varchar(50),

    created_by              varchar(255) REFERENCES User (user_id),
    created_at              DATETIME            NOT NULL,
    updated_by              varchar(255) REFERENCES User (user_id),
    updated_at              DATETIME
);

CREATE TABLE COURIER_ORDER
(
    order_id                    varchar(255)   NOT NULL PRIMARY KEY,
    order_no                    varchar(255)   NOT NULL UNIQUE,
    order_type                  varchar(255)   NOT NULL,
    order_status                varchar(100),
    tracking_no                 varchar(255)   NOT NULL UNIQUE,

    sender_name                 varchar(255)   NOT NULL,
    sender_mobile_no            varchar(100)   NOT NULL,
    sender_email                varchar(255),
    sender_address              varchar(255)   NOT NULL,
    sender_city                 varchar(255)   NOT NULL,
    sender_state                varchar(255)   NOT NULL,
    sender_postcode             varchar(255)   NOT NULL,
    sender_latitude             varchar(255)   NOT NULL,
    sender_longitude            varchar(255)   NOT NULL,
    sender_formatted_address    varchar(255)   NOT NULL,

    recipient_name              varchar(255)   NOT NULL,
    recipient_mobile_no         varchar(100)   NOT NULL,
    recipient_email             varchar(255),
    recipient_address           varchar(255)   NOT NULL,
    recipient_city              varchar(255)   NOT NULL,
    recipient_state             varchar(255)   NOT NULL,
    recipient_postcode          varchar(255)   NOT NULL,
    recipient_latitude          varchar(255)   NOT NULL,
    recipient_longitude         varchar(255)   NOT NULL,
    recipient_formatted_address varchar(255)   NOT NULL,

    item_qty                    int            NOT NULL,
    item_type                   varchar(100)   NOT NULL,
    item_weight                 decimal(20, 3) NOT NULL,

    vehicle_type                varchar(100)   NOT NULL,
    shipping_cost               decimal(20, 2) NOT NULL,
    payment_method              varchar(100)   NOT NULL,

    proof_id                    varchar(255),
    route_id                    varchar(255),
    sort_id                     int,

    is_picked_up                tinyint(1),
    pickup_order_status         varchar(100),
    pickup_proof_id             varchar(255),
    pickup_sort_id              int,
    pickup_route_id             varchar(255),

    created_by                  varchar(255) REFERENCES User (user_id),
    created_at                  DATETIME       NOT NULL,
    updated_by                  varchar(255) REFERENCES User (user_id),
    updated_at                  DATETIME,
    estArriveTime               int
);

CREATE TABLE ROUTE_REPORT
(
    route_report_id            varchar(255) NOT NULL PRIMARY KEY,

    actual_petrol_fees         decimal(20, 2),

    calculated_distance_travel decimal(20, 3),
    calculated_petrol_fees     decimal(20, 2),
    calculated_petrol_usage    decimal(20, 3),
    latest_petrol_price        decimal(20, 2),

    statement                  varchar(255),
    total_items_qty            integer      NOT NULL,
    route_id                   varchar(255) NOT NULL,

    created_by                 varchar(255) REFERENCES User (user_id),
    created_at                 DATETIME     NOT NULL,
    updated_by                 varchar(255) REFERENCES User (user_id),
    updated_at                 DATETIME
);

CREATE TABLE ORDER_ROUTES
(
    route_id        varchar(255) NOT NULL PRIMARY KEY,

    departure_point INT          NOT NULL,
    departure_date  DATETIME     NOT NULL,
    departure_time  DATETIME     NOT NULL,

    personnel       varchar(255) NOT NULL,
    status          varchar(255) NOT NULL,

    time_needed     decimal(20, 2),
    total_distance  decimal(20, 3),
    vehicle_id      varchar(255) REFERENCES VEHICLE (vehicle_id),

    started_at      DATETIME,
    created_by      varchar(255) REFERENCES User (user_id),
    created_at      DATETIME     NOT NULL,
    updated_by      varchar(255) REFERENCES User (user_id),
    updated_at      DATETIME
);

CREATE TABLE TEMP_ORDER_ROUTES
(
    order_no varchar(255) NOT NULL PRIMARY KEY,
    route_id varchar(255) NOT NULL,
    sort_id  int          NOT NULL UNIQUE
);

CREATE TABLE COMPANY_ADDRESSES
(
    id                int          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    address           varchar(255) NOT NULL,
    city              varchar(255) NOT NULL,
    state             varchar(255) NOT NULL,
    postcode          varchar(255) NOT NULL,
    latitude          varchar(255) NOT NULL,
    longitude         varchar(255) NOT NULL,
    formatted_address varchar(255) NOT NULL
);

CREATE TABLE TASK_PROOF
(
    proof_id             varchar(255) NOT NULL PRIMARY KEY,
    courier_personnel_id varchar(255) NOT NULL,

    signature            varchar(255),
    status               varchar(100) NOT NULL,
    reason               varchar(255),

    picked_at            datetime     NOT NULL,
    received_at          datetime     NOT NULL,

    recipient_name       varchar(255),
    recipient_ic_no      varchar(100),

    arrived_at           DATETIME     NOT NULL,

    created_by           varchar(255) REFERENCES User (user_id),
    created_at           DATETIME     NOT NULL,
    updated_by           varchar(255) REFERENCES User (user_id),
    updated_at           DATETIME
);
