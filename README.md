# FuelStation

Build a premium Admin Dashboard web app for a petrol-pump/customer-discount management system.

CORE REQUIREMENT

Create this as a pure client-side React SPA:

React + TypeScript + Vite

React Router

Tailwind CSS

No SSR

No Next.js

No server-side rendering

Must be deployable directly to Amazon Amplify

Use clean reusable components and a simple service/mock-data layer so real APIs can be connected later.

Do not build unnecessary backend infrastructure.

SYSTEM CONTEXT

There are 3 roles/apps:

Customer App — customers register and use the petrol pump.

Worker App — workers scan customers and process transactions/discounts.

Admin App — this application manages customers, workers, groups, discounts, notifications and reports.

Customers belong to discount groups such as Family, Friends, Employees, etc. Each group has an admin-defined discount percentage such as 1%, 2%, etc.

ADMIN APP PAGES

1. LOGIN

Create a premium admin login page with:

Email

Password

Remember me

Forgot password UI

Secure/professional visual design

Responsive layout

2. DASHBOARD

Create a useful analytics dashboard, not just cards.

Show:

Total Customers

Total Workers

Total Groups

Total Transactions/Scans

Total Discount Given

Today's Transactions

New Customer Registrations

Active Workers

Add meaningful charts:

Transactions/Scans over time

Discount given over time

Customer registrations over time

Group-wise customer distribution

Worker-wise scanning activity

Recent transactions/activity

Add date/filter controls where useful.

3. WORKERS

Create a worker management page with:

Total workers

Worker name/profile

Status

Total scans

Customers scanned

Total transactions handled

Total discount processed

Last activity

Worker details/activity view

Include search, filters, sorting and pagination-style UI.

4. CUSTOMERS

Create customer management with:

Total customers

New registrations

Active customers

Customers who used the petrol pump

Customer name/contact

Registration date

Assigned group

Total transactions

Total discount received

Last activity

Include customer search, filters and a customer detail/activity view.

When a customer registers, their initial status/group should be Default/Unassigned. Admin can later assign them to Family, Friends, Employees or another group.

5. GROUPS & DISCOUNTS

Create a complete group management page.

Admin can:

Create group

Edit group

Delete/deactivate group

Set discount percentage

View customer count

View total discount generated

Assign customers to groups

Example groups:

Family — 2%

Friends — 1%

Employees — 3%

Do not hardcode these as the only groups; make the UI support dynamically created groups.

6. NOTIFICATIONS

Create an admin notification center.

Important notification:

When a new customer registers, show a notification such as "New customer registration — group assignment required."

Allow:

Read/unread state

Notification count

Notification panel/page

Link notification to relevant customer

7. REPORTS

Create a professional reports page with:

Date range selector

Today

This week

This month

Custom range

Report categories:

Customer report

Worker report

Transaction/scan report

Discount report

Group report

Include tables, summary metrics and charts where useful.

Add Export Report buttons with CSV/Excel-style export UI using client-side/mock data for now.

8. MY PROFILE

Create admin profile page:

Name

Email

Phone

Profile avatar

Change password UI

Account information

DESIGN SYSTEM

Make the dashboard feel premium, modern, clean and enterprise-grade, not like a basic CRUD template.

Use a sophisticated palette:

Deep Navy: #0F172A

Premium Blue: #2563EB

Teal accent: #0F766E

White: #FFFFFF

Slate backgrounds/text: #F8FAFC / #475569

Subtle borders and shadows

Use:

Spacious dashboard layout

Professional sidebar navigation

Top header

Clean cards

Modern tables

Elegant charts

Subtle gradients only where appropriate

Consistent icons

Excellent typography

Responsive desktop/tablet/mobile design

Light theme as the primary theme

NAVIGATION

Sidebar:

Dashboard

Workers

Customers

Groups & Discounts

Notifications

Reports

My Profile

Include admin avatar/profile menu and logout.

IMPORTANT IMPLEMENTATION RULES

Build the complete frontend in this task.

Use realistic mock data so every page looks populated and functional.

Keep mock data/services isolated so real APIs can replace them later.

Use reusable components instead of duplicating code.

Use React Router for navigation.

Use client-side state only.

No SSR.

No Next.js.

No backend.

No unnecessary libraries or architecture.

Ensure npm run build works successfully.

Ensure the application is suitable for deployment on Amazon Amplify.

Do not change this into a server-rendered application.

Prioritize functional admin UX, meaningful analytics and polished visual design over unnecessary features.

Preserve a scalable structure for future API integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/21dcc544-ad3b-4965-a798-58a0f977fe55).

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
