# AI Context for Cursor

## 🏗️ Tech Stack

- **Frontend:** Nuxt 3 (Vue 3, TypeScript), TailwindCSS, PrimeVue, Pinia (state)
- **Backend:** NestJS (TypeScript), TypeORM, PostgreSQL
- **Authentication:** email/password + Google Auth
- **Testing:** Vitest (frontend), Jest (backend)

## 🗂️ Project Structure

- **Frontend:**
  - `/pages` – main pages
  - `/components` – UI components
  - `/composables` – reusable logic
  - `/stores` – Pinia stores
  - `/assets` – images, fonts, etc.
  - `/layouts` – global layouts
- **Backend:**
  - `/src/modules` – feature-based modules
  - `/src/common` – DTOs, guards, interceptors
  - `/src/services` – business logic
  - `/src/controllers` – RESTful endpoints

## 🧑‍💻 Coding Rules

- Use **TypeScript** everywhere
- Do not use `any`
- Follow official Nuxt/NestJS conventions
- Use descriptive variable and function names
- Keep functions short and single-responsibility
- Do not hardcode strings/config values
- Do not mix UI logic with business logic
- Do not use `console.log` in production
- Use i18n for all strings: every string must be translatable (Romanian = primary, English = secondary)
- Always use PrimeVue components for UI elements where possible

## 🔍 SEO Rules

- Always use semantic HTML tags
- Set dynamic meta tags (title, description, og:image, etc.) for every page and product
- Use Nuxt 3 SEO composables and modules for best practices
- Implement server-side rendering (SSR) for all public pages
- Add alt attributes to all images
- Generate and update sitemap.xml and robots.txt
- Use clean, descriptive URLs and avoid query params for main navigation
- Ensure fast page load (optimize images, use lazy loading)
- Use structured data (JSON-LD) for products and breadcrumbs

## 🧪 Testing

- Write unit tests for important logic
- Use Vitest (frontend) and Jest (backend)
- Test critical flows (authentication, checkout, etc.)

## 🔒 Security

- Use JWT for authentication
- Protect sensitive endpoints with guards
- Do not expose sensitive data in the frontend

## 🚀 Key Features

- Product catalog, cart, checkout, reviews, wishlist, discounts, online payments
- Admin dashboard for products/orders
- Advanced product search and filtering
- Real-time notifications (e.g., new orders)
- Multi-language and multi-currency support (Romanian (primary) & English (secondary))

## ✨ AI Output

- Be concise and professional
- Output = ready-to-use code, no unnecessary explanations
- Comment only where logic is non-trivial

## ❌ Don't

- Do not use `any`
- Do not hardcode values
- Do not use `console.log` in production
- Do not mix UI with business logic
