# 🛒 ShopPOS

**ShopPOS** is a local, offline-first Point of Sale (POS) and grocery shop management system designed for small retail businesses.

The system is designed around a simple goal:

> **Make grocery-store billing faster, easier, and less error-prone without requiring expensive POS hardware or a cloud-based subscription.**

ShopPOS combines a **FastAPI backend**, **React frontend**, and **SQLite local database** to provide a lightweight POS system that can run on a single computer.

The project is being developed with practical small-shop requirements in mind, including barcode-based products, weight-based products, liquid products, stock management, sales records, customer credit tracking, reporting, and separate Admin/Cashier access.

---

## 📌 Table of Contents

* [Overview](#-overview)
* [Problem](#-problem)
* [Goals](#-goals)
* [Key Features](#-key-features)
* [User Roles](#-user-roles)
* [POS Features](#-pos-features)
* [Inventory Management](#-inventory-management)
* [Customer Credit Management](#-customer-credit-management)
* [Reports](#-reports)
* [Technology Stack](#-technology-stack)
* [System Architecture](#-system-architecture)
* [Project Structure](#-project-structure)
* [Database](#-database)
* [Authentication and Authorization](#-authentication-and-authorization)
* [Installation](#-installation)
* [Running the Application](#-running-the-application)
* [Future Scanner App](#-future-scanner-app)
* [Cost Reduction Strategy](#-cost-reduction-strategy)
* [Future Improvements](#-future-improvements)
* [Current Limitations](#-current-limitations)
* [Security Considerations](#-security-considerations)
* [Development Roadmap](#-development-roadmap)
* [Project Status](#-project-status)
* [Author](#-author)

---

# 🔎 Overview

Traditional small grocery shops often rely on handwritten bills, manual stock calculations, and basic calculators.

This can lead to:

* Incorrect billing
* Calculation mistakes
* Difficult stock tracking
* Time-consuming end-of-day calculations
* Difficulty tracking customer credit
* Lack of historical sales information
* Unnecessary spending on dedicated POS hardware

ShopPOS aims to provide a practical alternative using hardware that a small shop may already have, primarily a **laptop or PC**.

The system is designed to operate locally using a SQLite database, meaning that a permanent internet connection is not required for the core POS functionality.

---

# 🎯 Problem

Small grocery stores may not have the budget for a complete commercial POS infrastructure.

A traditional POS setup can involve:

* Dedicated POS terminals
* Barcode scanners
* Receipt printers
* Cash drawers
* Network infrastructure
* Cloud subscriptions
* Inventory-management subscriptions

For a small family-operated shop, these additional costs can make a POS system impractical.

ShopPOS therefore focuses on a **low-cost software-first approach**.

The initial system runs on a computer and allows products to be searched, added to a cart, sold, and recorded locally.

The project also includes a future plan to use **smartphones as barcode scanners**, reducing the need to purchase a dedicated barcode scanner.

---

# 🎯 Goals

The main goals of ShopPOS are:

1. Provide fast and simple grocery-store billing.
2. Reduce manual calculation errors.
3. Maintain accurate inventory information.
4. Support barcode-based products.
5. Support products sold by weight.
6. Support liquid products.
7. Track customer credit.
8. Provide useful sales and inventory reports.
9. Provide separate Admin and Cashier permissions.
10. Operate locally without depending on cloud services.
11. Minimize the hardware cost required to operate a POS.
12. Provide a foundation for future mobile barcode scanning.

---

# ✨ Key Features

## 🧾 Point of Sale

ShopPOS provides a dedicated POS interface for processing sales.

Features include:

* Product search
* Barcode-based product identification
* Shopping cart
* Quantity adjustment
* Automatic subtotal calculation
* Manual LKR discount
* Total calculation
* Amount paid
* Change calculation
* Sale finalization
* Receipt generation
* Customer credit assignment
* Stock reduction after completed sales

---

# 👥 User Roles

ShopPOS currently uses two permanent user roles:

## 👑 Admin

The Admin has full system access.

### Admin permissions

* View products
* Create products
* Edit products
* Delete products
* Manage categories
* Manage stock
* Restock products
* Reduce stock
* View sales
* View reports
* Manage customers
* Manage customer credit
* Manage system administration

---

## 💳 Cashier

The Cashier role is designed for employees or family members responsible for daily billing.

### Cashier permissions

* View products
* View product stock
* Search products
* Create sales
* Process payments
* View receipts
* Print receipts
* View appropriate sales information
* Assign sales to customer credit

### Cashier restrictions

Cashiers cannot:

* Modify product information
* Change product prices
* Change cost prices
* Restock products
* Reduce stock manually
* Delete products
* Manage categories
* Manage users
* Perform administrative operations

This separation helps prevent accidental or unauthorized changes to important inventory and business information.

---

# 🛍️ POS Features

The POS system is designed around a simple sales workflow:

```text
Search / Identify Product
        ↓
Add Product to Cart
        ↓
Adjust Quantity
        ↓
Apply Manual Discount (if required)
        ↓
Calculate Total
        ↓
Enter Payment
        ↓
Calculate Change
        ↓
Finalize Sale
        ↓
Update Stock
        ↓
Generate Receipt
```

The system supports manual LKR discounts rather than requiring predefined percentage discount rules.

This allows the shop operator to decide the discount amount during a transaction.

---

# 📦 Inventory Management

ShopPOS includes inventory management designed for different types of grocery products.

## Product Types

### Unit Products

Products sold as individual units.

Examples:

* Bottles
* Packets
* Biscuits
* Stationery
* Ice cream
* Cans

Stock is maintained as a unit quantity.

---

### Weight Products

Products sold by weight.

Examples:

* Vegetables
* Onions
* Dried fish
* Rice
* Spices

Weight quantities can be represented using decimal values.

The system displays weight quantities using **three decimal places** where appropriate.

Example:

```text
9.761 kg
```

---

### Liquid Products

The system also supports liquid-based products.

Liquid inventory can be represented in litres while supporting restocking through a kilogram-based input where required.

The current implementation includes a conversion mechanism for liquid inventory.

---

# 🚨 Stock Monitoring

ShopPOS provides stock status monitoring.

Products can be identified as:

* 🟢 In Stock
* 🟡 Low Stock
* 🔴 Out of Stock

Administrators can configure reorder levels and monitor products that require restocking.

The Admin Dashboard also provides stock alerts for products approaching or reaching their reorder level.

---

# 👤 Customer Credit Management

ShopPOS includes a customer credit system for shops that allow customers to purchase goods on credit.

During a sale, the operator can associate the sale with an existing customer.

The system can then track:

* Customer
* Credit sale
* Outstanding balance
* Credit transactions
* Payments
* Remaining balance

This reduces the need to maintain customer credit information manually in notebooks.

---

# 📊 Reports

ShopPOS provides reporting functionality to help the shop understand its sales activity.

The reporting system is designed to provide information such as:

* Sales totals
* Sales activity
* Product performance
* Inventory information
* Profit-related information
* Daily business activity

The system is intended to gradually expand its reporting capabilities as development continues.

---

# 🧰 Technology Stack

## Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* SQLite
* JWT authentication
* Password hashing

## Frontend

* React
* Vite
* JavaScript
* CSS

## Database

* SQLite

## Development Environment

* Windows
* Visual Studio Code
* Python virtual environment
* Node.js / npm

---

# 🏗️ System Architecture

The current architecture follows a local client-server model.

```text
                 ┌──────────────────────┐
                 │      ShopPOS UI      │
                 │   React + Vite       │
                 └──────────┬───────────┘
                            │
                            │ HTTP / REST API
                            ▼
                 ┌──────────────────────┐
                 │    FastAPI Backend   │
                 │                      │
                 │ Authentication       │
                 │ Products             │
                 │ Categories           │
                 │ Sales                │
                 │ Stock                │
                 │ Customers            │
                 │ Reports              │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │       SQLite         │
                 │    Local Database    │
                 └──────────────────────┘
```

The application is designed so that the core system can operate locally without requiring a cloud database.

---

# 📁 Project Structure

The repository currently contains the main backend and POS frontend.

```text
ShopPOS/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   │
│   ├── create_admin.py
│   ├── create_cashier.py
│   ├── migrate_credit_system.py
│   ├── migrate_liquid_system.py
│   ├── migrate_weight_products.py
│   └── reset_test_data.py
│
├── pos_app/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── scanner_app/       # Planned / excluded from current repository
│
└── .gitignore
```

The `scanner_app` is intentionally excluded from the current GitHub repository while its development is still planned for a future phase.

---

# 🗄️ Database

ShopPOS uses SQLite for local data storage.

The database contains entities for areas such as:

* Users
* Categories
* Products
* Sales
* Sale Items
* Customers
* Credit Transactions
* Liquid Options

The database is intentionally local to keep the system lightweight and reduce infrastructure costs.

The SQLite database file itself is excluded from Git using `.gitignore`.

---

# 🔐 Authentication and Authorization

ShopPOS uses authenticated API access and role-based authorization.

Authentication is handled through:

* Username/password login
* Password hashing
* JWT-based authentication
* Authenticated API requests
* Role-based permissions

The application checks the authenticated user's role before allowing protected operations.

For example:

```text
Admin
 ├── Products
 ├── Categories
 ├── Stock
 ├── Sales
 ├── Reports
 └── Administration

Cashier
 ├── View Products
 ├── POS
 ├── Sales
 └── Receipts
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone https://github.com/Asmal-H02/ShopPOS.git
```

Move into the project:

```bash
cd ShopPOS
```

---

# 🐍 Backend Setup

Move into the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the required Python packages:

```bash
pip install fastapi uvicorn sqlalchemy python-jose passlib bcrypt python-multipart
```

The project may be expanded with additional dependencies as development continues.

---

# ▶️ Running the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The backend API will normally be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation can be accessed through:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

Open another terminal and move into:

```bash
cd pos_app
```

Install frontend dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Vite will provide the local development URL in the terminal.

---

# 🔑 Initial User Setup

The project includes scripts for creating Admin and Cashier accounts during development.

```text
backend/create_admin.py
backend/create_cashier.py
```

These scripts should be used carefully and are primarily intended for local development/setup.

**Do not reuse development credentials in production environments.**

---

# 📱 Future Scanner App

One of the major planned improvements for ShopPOS is a dedicated **mobile scanner application**.

The current project intentionally does not include the scanner application yet.

The planned architecture is:

```text
        Smartphone
      ┌─────────────┐
      │ Scanner App │
      │             │
      │ Camera      │
      │ Barcode     │
      │ Scanner     │
      └──────┬──────┘
             │
             │ Local Network
             │
             ▼
      ┌─────────────┐
      │   ShopPOS   │
      │   Laptop    │
      │             │
      │ POS System  │
      └─────────────┘
```

The idea is to allow a smartphone to act as the barcode scanner.

Instead of purchasing a dedicated barcode scanner, an existing smartphone can use its camera to scan product barcodes.

The phone would send the scanned barcode/product information to the ShopPOS application running on the laptop.

---

# 💰 Cost Reduction Strategy

The Scanner App is not simply a convenience feature.

It is part of the project's **low-cost POS strategy**.

A conventional POS installation may require dedicated scanning hardware.

The planned approach is:

```text
Traditional approach:

Dedicated Barcode Scanner
          +
POS Computer
          +
POS Software
          +
Additional Hardware
```

ShopPOS aims toward:

```text
Low-cost approach:

Existing Laptop
      +
ShopPOS
      +
Existing Smartphone
      +
Scanner App
```

This can reduce the amount of additional hardware required by the shop.

The smartphone already contains:

* Camera
* Display
* Wireless connectivity
* Processing hardware

The Scanner App can therefore turn an existing smartphone into a practical barcode-scanning device.

---

# 📡 Planned Scanner Communication

The planned scanner workflow is:

```text
1. Cashier opens Scanner App
             ↓
2. Phone camera scans barcode
             ↓
3. Scanner App identifies barcode
             ↓
4. Barcode sent to ShopPOS
             ↓
5. ShopPOS searches product database
             ↓
6. Product appears in POS
             ↓
7. Product added to cart
```

The project is intended to work over a local network rather than requiring an external cloud service.

This is especially important for keeping operating costs low.

---

# 📱 Scanner App Goals

The future scanner application is planned to provide:

* Camera barcode scanning
* Fast barcode recognition
* Connection to ShopPOS
* Automatic scan transmission
* Connection status
* Simple cashier-friendly interface
* Multiple smartphone support in the future
* Local network communication
* Minimal configuration

The scanner should behave as a simple input device rather than becoming a second full POS system.

The main POS logic will remain on the laptop.

---

# 🌐 Offline-First Design

A major design consideration is minimizing dependence on internet connectivity.

The core ShopPOS system is intended to run locally.

Future scanner communication can use a local network so that:

```text
Phone
  │
  │ Local Wi-Fi
  ▼
Laptop
  │
  ▼
Local ShopPOS API
  │
  ▼
SQLite Database
```

This means the internet does not need to be involved in every barcode scan.

The long-term goal is to make the system usable even when external internet connectivity is unavailable.

---

# 🚧 Current Limitations

ShopPOS is still under active development.

Current limitations include:

* No dedicated receipt printer integration yet
* No dedicated cash drawer integration yet
* Scanner App is not currently included
* No automated weighing-scale integration
* Weight products may require manual weight entry
* Some advanced reporting functionality is still under development
* Production deployment/security hardening is still required
* The current UI continues to receive design and usability improvements

---

# 🚀 Future Improvements

Planned improvements include:

## 📱 1. Smartphone Scanner App

Develop a dedicated mobile barcode-scanning application that communicates with the POS laptop.

---

## 📡 2. Local Network Communication

Allow smartphones and the POS computer to communicate directly over a local Wi-Fi network.

---

## 🧾 3. Receipt Printer Support

Add support for thermal receipt printers.

---

## 💵 4. Cash Drawer Integration

Allow compatible cash drawers to be controlled by the POS system.

---

## ⚖️ 5. Weighing Scale Integration

Investigate compatible digital weighing scales that can communicate directly with the POS.

---

## 📊 6. Advanced Reporting

Expand reports with:

* Daily sales
* Monthly sales
* Product profitability
* Best-selling products
* Stock movement
* Low-stock trends
* Credit balances
* Sales summaries

---

## 👥 7. Improved Customer Management

Expand customer functionality with:

* Customer history
* Credit history
* Payment history
* Outstanding balance summaries

---

## 🔐 8. Improved Security

Future production improvements may include:

* Environment-based secrets
* Stronger password policies
* Secure secret management
* Better session management
* Audit logs
* Improved API security
* Production deployment configuration

---

## ☁️ 9. Optional Backup System

Although the core system is designed to work locally, a future optional backup mechanism could allow shop data to be backed up securely.

The local POS should remain usable even when the backup service is unavailable.

---

# 🗺️ Development Roadmap

### Phase 1 — Core POS

* [x] FastAPI backend
* [x] SQLite database
* [x] React POS frontend
* [x] Product management
* [x] Category management
* [x] Sales management
* [x] Stock management

### Phase 2 — User Management

* [x] Admin authentication
* [x] Cashier authentication
* [x] Role-based authorization
* [x] Admin/Cashier permission separation

### Phase 3 — Advanced Store Management

* [x] Customer management
* [x] Credit tracking
* [x] Weight-based products
* [x] Liquid products
* [x] Stock alerts
* [x] Reports

### Phase 4 — UI/UX Improvements

* [x] Shared application layout
* [x] Sidebar navigation
* [x] Top navigation
* [x] Login interface

### Phase 5 — Low-Cost Hardware Integration

* [ ] Smartphone Scanner App
* [ ] Local phone-to-POS communication
* [ ] Barcode scanning optimization
* [ ] Multiple scanner support
* [ ] Receipt printer integration
* [ ] Cash drawer integration

### Phase 6 — Production Improvements

* [ ] Security hardening
* [ ] Automated backups
* [ ] Better error handling
* [ ] Installation package
* [ ] Production deployment documentation
* [ ] Disaster recovery strategy

---

# 📈 Project Vision

The long-term vision of ShopPOS is to create a practical POS ecosystem for small businesses that does not require expensive infrastructure.

The system should be:

**Simple**

Easy for non-technical users to operate.

**Affordable**

Designed around hardware the shop already owns whenever possible.

**Reliable**

Able to continue core operations without depending entirely on internet connectivity.

**Modular**

Additional components such as mobile scanners, printers, and other hardware can be added when needed.

**Scalable**

The software architecture should allow additional functionality to be introduced without rebuilding the entire system.

---

# 🔒 Security Considerations

ShopPOS is currently a development project and should not be considered production-ready without additional security hardening.

When deploying the system:

* Never commit `.env` files.
* Never commit database files.
* Never commit virtual environments.
* Never expose secret keys publicly.
* Use strong passwords.
* Change development credentials before real-world deployment.
* Use secure configuration for JWT secrets.
* Restrict network access to trusted devices.
* Keep dependencies updated.
* Implement proper backup procedures.

Sensitive configuration should be stored outside the Git repository.

---

# 📌 Project Status

**Status:** 🚧 Active Development

The core POS system is functional, including:

* Product management
* Categories
* Stock management
* Sales
* POS
* Admin authentication
* Cashier authentication
* Role-based permissions
* Customer management
* Credit tracking
* Weight-based inventory
* Liquid inventory
* Reports

The next major development direction is improving the user interface and developing the **smartphone Scanner App** to reduce the need for dedicated barcode-scanning hardware.

---

# 👨‍💻 Author

**Asmal Himakelum**

BSc Network Security and Ethical Hacking

NIBM

GitHub:

**Asmal-H02**

---

# 📜 License

License information will be added as the project moves toward a formal release.

---

## ⭐ Project Philosophy

ShopPOS is built around a simple idea:

> **A small shop should not need expensive hardware or complicated software to have a reliable POS system.**

By combining local software, existing computing devices, and eventually smartphones as barcode scanners, ShopPOS aims to provide a practical and affordable POS solution while maintaining the flexibility to grow into a more complete retail management system.
