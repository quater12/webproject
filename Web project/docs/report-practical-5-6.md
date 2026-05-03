# RetroVault - Practical 5 & 6 Report

## 1. User Story Description
User Story is a short requirement from the end-user perspective in format:
"As a <role>, I want <goal>, so that <benefit>".

Project functional groups:
1. Authentication and profile
2. Catalog and search
3. Cart management
4. Checkout and orders
5. Admin catalog operations

## 2. User Stories (12 items)
### US-01
As a guest, I want to browse game catalog, so that I can evaluate products before signup.
Acceptance:
- Catalog page opens without login.
- Product card shows title, platform, price, condition.

### US-02
As a guest, I want to filter catalog by platform and genre, so that I can quickly find relevant games.
Acceptance:
- Filters can be selected independently.
- Result list updates according to selected filters.

### US-03
As a guest, I want to register account, so that I can place orders and track history.
Acceptance:
- Registration validates required fields.
- New account is created and can login.

### US-04
As a customer, I want to login with JWT token flow, so that I can securely use private endpoints.
Acceptance:
- Token pair is issued on valid credentials.
- Invalid credentials return 401.

### US-05
As a customer, I want to add game to cart, so that I can prepare purchase.
Acceptance:
- Add action creates/updates cart item.
- Cart shows updated quantity.

### US-06
As a customer, I want to edit item quantity in cart, so that I can control final order.
Acceptance:
- Quantity can be changed to value > 0.
- Total updates after quantity change.

### US-07
As a customer, I want to remove game from cart, so that I can avoid accidental purchases.
Acceptance:
- Remove action deletes item from cart.
- UI and backend return consistent state.

### US-08
As a customer, I want to checkout cart and create order, so that I can buy selected games.
Acceptance:
- Stock validation is performed.
- Successful checkout creates order with status "pending".

### US-09
As a customer, I want to track order status, so that I know delivery progress.
Acceptance:
- Order list is visible in profile page.
- Each order has status and timestamps.

### US-10
As an admin, I want to create and update game records, so that catalog remains current.
Acceptance:
- Admin can create game with SKU and platform.
- Validation prevents duplicate SKU.

### US-11
As an admin, I want to manage genres and platforms, so that catalog classification stays consistent.
Acceptance:
- CRUD for platform and genre available.
- Unique name validation works.

### US-12
As an admin, I want to deactivate game listings, so that unavailable products are hidden from customers.
Acceptance:
- is_active=false excludes game from storefront listing.
- Admin still sees full record for audit.

## 3. UML Use Case Diagram
File: `docs/uml/use-case-diagram.uml`

## 4. Three detailed use case scenarios (UML)
1. Register/Login: `docs/uml/use-case-register-login.uml`
2. Manage Cart: `docs/uml/use-case-manage-cart.uml`
3. Place Order: `docs/uml/use-case-place-order.uml`

Also added:
- Project flowchart: `docs/uml/project-flowchart.uml`
