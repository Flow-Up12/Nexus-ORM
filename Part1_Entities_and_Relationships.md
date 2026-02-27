# UFO - Universal Furniture Outlet

## Part I: Entities, Relationship Matrix, and Business Rules

---

## Entities

| Entity | Definition |
|--------|-----------|
| **Customer** | A person or organization that places orders for furniture. Identified by a unique customer account number. |
| **Order** | A request by a customer to purchase one or more furniture items. Has a total value and is associated with one customer. |
| **Billing Address** | The single billing address associated with a customer. Filled out when a new account is created or when there is a change of address. |
| **Delivery Address** | The location where furniture is to be delivered. Filled in on the order form if the customer uses UFO's delivery service. |
| **Furniture Type** | A category of furniture (e.g., computer desk, executive chair) identified by an item code. Has a price and quantity in stock. |
| **Shipment** | A grouped set of items from an order assigned to a truck for next day's delivery. A single shipment is delivered by one truck. |
| **Truck** | A vehicle owned by UFO used for delivering customer orders. Has a vehicle number, license plate number, license expiration date, and inspection date. |
| **Employee** | A person who works for UFO. Identified by SSN. Has a name, address, and phone. |
| **Driver** | An employee who drives a truck. Has a driver's license number and license expiration date. |
| **Sales Rep** | An employee who takes customer orders via the attached form. Earns commissions in addition to salary. |

---

## Supertype-Subtype Relationships

- **Employee** is a supertype.
  - **Driver** is a subtype of Employee (a Driver can be an Employee).
  - **Sales Rep** is a subtype of Employee (a Sales Rep can be an Employee).

---

## Relationship Matrix

| Entity A | Relationship | Entity B |
|----------|-------------|----------|
| Customer | sometimes has one | Billing Address |
| Billing Address | always belongs to one | Customer |
| Customer | sometimes places one or more | Orders |
| Order | always is placed by one | Customer |
| Order | sometimes has one | Delivery Address |
| Delivery Address | always belongs to one | Order |
| Order | always contains one or more | Order Lines (Furniture Type) |
| Furniture Type | sometimes appears on one or more | Orders |
| Order | sometimes is broken into one or more | Shipments |
| Shipment | always belongs to one | Order |
| Shipment | always is assigned to one | Truck |
| Truck | sometimes carries one or more | Shipments |
| Truck | always is assigned to one | Driver |
| Driver | sometimes is assigned to one or more | Trucks |
| Sales Rep | sometimes takes one or more | Orders |
| Order | always is taken by one | Sales Rep |
| Employee | can be a | Driver |
| Employee | can be a | Sales Rep |

---

## Business Rules

### Customer
- Each **Customer** is {sometimes} related to {one} **Billing Address**.
- Each **Billing Address** is {always} related to {one} **Customer**.
- Each **Customer** is {sometimes} related to {one or more} **Orders**.
- Each **Order** is {always} related to {one} **Customer**.
- Customer account numbers are unique.

### Order
- Each **Order** is {always} related to {one or more} **Furniture Types** (via order lines).
- Each **Furniture Type** is {sometimes} related to {one or more} **Orders**.
- Each **Order** is {sometimes} related to {one} **Delivery Address**.
- Each **Delivery Address** is {always} related to {one} **Order**.
- Each **Order** is {sometimes} related to {one or more} **Shipments**.
- Each **Shipment** is {always} related to {one} **Order**.
- Each **Order** is {always} related to {one} **Sales Rep**.
- Each **Sales Rep** is {sometimes} related to {one or more} **Orders**.

### Delivery Service
- UFO offers free delivery for orders with a total value exceeding $1,000.
- For smaller orders, a nominal fee of $0.50 is charged.
- The customer is not charged a delivery fee if he/she declines to use UFO's delivery service for orders less than $1,000.
- All furniture in one order is delivered to the same delivery address.

### Shipment & Truck
- Orders are broken into delivery units called **Shipments** so that each shipment may fit into one truck.
- A large order that cannot fit into a single truck may be broken into multiple shipments.
- A small order may be delivered as a single shipment.
- Each **Shipment** is {always} related to {one} **Truck**.
- Each **Truck** is {sometimes} related to {one or more} **Shipments**.
- A truck can carry more than one shipment.
- All items included in a shipment are delivered by one truck.
- Shipments are assigned to trucks that are available for next day's delivery service.

### Truck & Driver
- Each **Truck** is {always} related to {one} **Driver**.
- Each **Driver** is {sometimes} related to {one or more} **Trucks**.
- Each truck is assigned to a driver, who is an employee of UFO.

### Employee
- Each **Employee** has a social security number, name, address, and phone.
- All employees are salaried.
- A **Driver** has a driver's license number and license expiration date.
- A **Sales Rep** earns commissions in addition to salary.

### Furniture Type
- Each type of furniture is identified by an **item code**.
- The price and quantity in stock are tracked for each furniture type.

### Truck
- Trucks have a **vehicle number**, **license plate number**, **license expiration date**, and **inspection date**.
- Every evening the operations manager plans the next day's delivery.
