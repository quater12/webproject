# RetroVault Data Dictionary

| Entity/Table | Field | Type | Nullable | Key | Default | Constraints | Description |
|---|---|---|---|---|---|---|---|
| User | id | bigint | No | PK | auto | - | User identifier |
| User | email | varchar(255) | No | - | - | UNIQUE | Login email |
| User | password_hash | varchar(255) | No | - | - | - | Password hash |
| User | first_name | varchar(100) | No | - | - | - | First name |
| User | last_name | varchar(100) | No | - | - | - | Last name |
| User | role | varchar(20) | No | - | customer | CHECK(role in customer/admin) | Role in system |
| Platform | id | bigint | No | PK | auto | - | Platform identifier |
| Platform | name | varchar(100) | No | - | - | UNIQUE | Platform name |
| Platform | manufacturer | varchar(120) | No | - | - | - | Vendor name |
| Platform | release_year | integer | No | - | - | - | Year of release |
| Platform | generation | varchar(50) | No | - | - | - | Console generation |
| Genre | id | bigint | No | PK | auto | - | Genre identifier |
| Genre | name | varchar(60) | No | - | - | UNIQUE | Genre name |
| Game | id | bigint | No | PK | auto | - | Game identifier |
| Game | sku | varchar(40) | No | - | - | UNIQUE | Product SKU |
| Game | title | varchar(200) | No | - | - | - | Game title |
| Game | platform_id | bigint | No | FK | - | FK->Platform.id | Platform link |
| Game | price | decimal(10,2) | No | - | 0.00 | CHECK(price>=0) | Selling price |
| Game | stock | integer | No | - | 0 | CHECK(stock>=0) | Available quantity |
| Game | condition | varchar(20) | No | - | used | CHECK(new/used/refurbished) | Physical state |
| Cart | id | bigint | No | PK | auto | - | Cart identifier |
| Cart | user_id | bigint | No | FK | - | UNIQUE, FK->User.id | One cart per user |
| CartItem | id | bigint | No | PK | auto | - | Cart item identifier |
| CartItem | cart_id | bigint | No | FK | - | FK->Cart.id | Cart link |
| CartItem | game_id | bigint | No | FK | - | FK->Game.id | Game link |
| CartItem | quantity | integer | No | - | 1 | CHECK(quantity>0) | Ordered units |
| Order | id | bigint | No | PK | auto | - | Order identifier |
| Order | user_id | bigint | No | FK | - | FK->User.id | Customer link |
| Order | status | varchar(20) | No | - | pending | CHECK(status set) | Fulfillment state |
| Order | total_amount | decimal(10,2) | No | - | 0.00 | CHECK(total_amount>=0) | Final sum |
| Order | shipping_address | varchar(255) | No | - | - | NOT NULL | Delivery address |
