# Optical Catalog Pro

Create a professional Desktop Eyewear Price Catalog System for an optical glasses shop.

The main purpose of the application is very simple:

The employee should be able to quickly search for a glasses item by its size and immediately see all available glasses with their company/supplier, image, category, and fixed price for that size.

This is NOT a POS system and does NOT need sales, invoices, payments, stock management, accounting, or customer billing.

1. Login Page

Create a clean and professional Login page as the first screen.

Fields:

Username

Password

Login button

Requirements:

Authentication must be required before accessing the application.

Show clear validation/error messages for incorrect credentials.

Keep the design modern and suitable for an optical shop.

2. Main Dashboard

After successful login, show a modern dashboard with exactly 4 main sections/cards:

1. Items

Opens the main item search/catalog page.

2. Add Items

Opens the page where the employee can add and manage glasses.

3. Customers

Opens the customer category management page.

4. Settings

Opens application settings.

Use large, easy-to-understand cards/icons and a clean optical-shop style.

The dashboard should also contain:

Application logo

Application name

Current logged-in username

Logout button

Navigation/sidebar if appropriate

3. Items / Search Page

This is the most important page in the application.

The employee should be able to search for glasses quickly.

Search

Add a prominent search bar:

"Search by Size"

Example:

If the employee enters:

52

the system should display all glasses/items that have size 52.

Search should be fast and should support partial/exact size searching.

Also provide filters such as:

Size

Supplier/Company

Customer Category

Item name/code

Results

Display the results as clean cards or a professional table.

Each result should show:

Glasses image

Item name

Item code

Size

Supplier/Company

Customer Category

Price

Available sizes

Date added

The price must be clearly visible.

Allow the user to click an item to open its full details.

4. Add Items Page

Create a professional form for adding a new glasses item.

Each item should contain:

Basic Information

Item Name

Item Code / SKU

Glasses Image

Supplier / Company

Customer Category

Notes

Sizes and Prices

This is VERY IMPORTANT.

The price depends on the glasses size.

The user must be able to add multiple sizes for the same glasses item.

Example:

Item:
"Ray Glasses Model A"

Supplier:
"ABC Company"

Sizes:

Size 50 → 500 EGP

Size 52 → 550 EGP

Size 54 → 600 EGP

Size 56 → 650 EGP

The system must store each size with its own fixed price.

Create an interface where the user can:

Add size

Enter price for that size

Edit size

Edit price

Delete size

Example UI:

SizePriceActions50500 EGPEdit / Delete52550 EGPEdit / Delete54600 EGPEdit / Delete

Do NOT create only one price field for the entire item.

Each size must have its own price.

5. Supplier / Company Management

The application should allow the user to define the companies/suppliers from which the glasses are purchased.

Create a simple management interface:

Add Company

Edit Company

Delete Company

Search Company

Each glasses item can then be assigned to one supplier/company.

Example:

Company A

Company B

Company C

Company D

When adding an item, the supplier should be selected from a dropdown.

6. Customer Categories

Create a dedicated Customer Categories page.

The purpose is to categorize glasses based on the customer/category they are intended for.

Allow:

Add category

Edit category

Delete category

Search category

Examples:

Men

Women

Kids

Unisex

Sports

Premium

When adding an item, the user selects the appropriate customer category.

7. Item Details Page

When the user clicks an item from the search results, show a complete details page.

Display:

Large glasses image

Item name

Item code

Supplier/company

Customer category

Notes

And most importantly:

Sizes & Prices

Show every available size and its fixed price.

Example:

50 → 500 EGP
52 → 550 EGP
54 → 600 EGP

Make the price highly visible.

8. Settings Page

Create a professional Settings page.

The user should be able to customize the application without changing the source code.

Background

Allow the user to change the application background.

Options:

Default background

Solid color

Upload custom background image

The selected background should be saved and remain after restarting the application.

Application Logo

Allow the user to:

Upload/change application logo

Preview logo

Remove/reset logo

The selected logo should be saved permanently.

Application Name

Allow changing the application name displayed in the dashboard/header/login screen.

Theme

Add:

Light Mode

Dark Mode

Save the selected theme.

9. Database

Use a proper relational database.

Create a clean database structure.

Suggested entities:

Users

id

username

password_hash

created_at

Items

id

name

sku

image

supplier_id

customer_category_id

notes

created_at

updated_at

ItemSizes

id

item_id

size

price

Suppliers

id

name

phone (optional)

notes (optional)

created_at

CustomerCategories

id

name

description

created_at

Settings

id

application_name

logo

background

theme

Make sure there is a proper relationship between:

Items → ItemSizes

Items → Suppliers

Items → CustomerCategories

10. Search Logic

The search system is the most important functionality.

If the user searches:

52

the application should return every item that has an ItemSize record where:

size = 52

For every result, display the corresponding price for size 52.

Example:

Search: 52

Results:

Glasses A | Company A | Men | 52 | 550 EGP
Glasses B | Company B | Women | 52 | 700 EGP
Glasses C | Company A | Kids | 52 | 400 EGP

If the user searches another size, for example:

54

the displayed price must automatically come from the 54 size record.

Do NOT display the price of another size.

11. Image Upload

For every glasses item, allow uploading an image.

Requirements:

Image preview before saving

Replace image

Delete image

Store image correctly

Display image in search results and item details

Use a professional image placeholder when no image exists.

12. UI / UX Design

The application should look like a real professional optical shop application.

Design style:

Modern

Clean

Minimal

Professional

Easy to use

Fast navigation

Large readable prices

Responsive desktop layout

Use a professional optical/glasses visual identity.

Suggested colors:

White

Dark navy

Light blue

Soft gray

Do not make the interface overly complicated.

The employee should be able to:

Login → Items → Search Size → Immediately see glasses and prices.

That should be the fastest workflow.

13. Dashboard Statistics

On the dashboard, show simple useful statistics:

Total Items

Total Suppliers

Total Customer Categories

Total Sizes/Price Records

Do NOT add sales statistics because this application is only a price/catalog system.

14. CRUD Operations

Implement complete CRUD functionality for:

Items

Create

Read

Update

Delete

Item Sizes

Create

Read

Update

Delete

Suppliers

Create

Read

Update

Delete

Customer Categories

Create

Read

Update

Delete

Users

Create

Read

Update

Delete

Add confirmation dialogs before destructive operations.

15. Validation

Add proper validation.

Examples:

Item name cannot be empty.

SKU should be unique.

Supplier is required.

Customer category is required.

Size is required.

Price must be a valid positive number.

Do not allow duplicate sizes for the same item.

Username must be unique.

Password cannot be empty.

Show clear and user-friendly error messages.

16. Desktop Application

The final application must be designed to work as a Windows Desktop Application, not just a website.

Make the architecture suitable for packaging into a Windows desktop executable.

The application should be able to run locally without requiring an internet connection for its core functionality.

All important data should be stored locally in the database.

17. Important Requirements

Do NOT add unnecessary features such as:

POS

Sales

Invoices

Payment processing

Accounting

Online shopping

Cart

Orders

Delivery

Complex inventory management

The application's main purpose is:

LOGIN → MANAGE GLASSES → SEARCH BY SIZE → SHOW THE CORRECT PRICE

The most important feature is the relationship:

Glasses Item → Size → Fixed Price

Example:

Item A:

Size 50 → 500 EGP

Size 52 → 550 EGP

Size 54 → 600 EGP

When searching for size 52, show:

Item A — Size 52 — 550 EGP

not the price of size 50 or 54.

Build the project with clean architecture, reusable components, proper database relationships, validation, error handling, and a polished professional desktop UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/33e3b9aa-926c-400f-9a33-62b969f14232).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
