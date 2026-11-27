# Security Audit Report — Mâini în Lut

**Date:** 24 November 2026  
**Scope:** Full application review of this repository (Nuxt 3 frontend, NestJS API, TypeORM/PostgreSQL, Netopia checkout, admin and artist flows).  
**Method:** Source review of application code, configuration, and dependency manifests. Generated artifacts, `node_modules`, and build output were not reviewed line by line. `npm audit` and the backend Jest suite were executed locally. No production systems were contacted, no live payment callbacks were forged, and no secret values are reproduced in this report.

**Verification labels**

- **Verified in source** — the vulnerable or missing control is present in the current code and the exploitation path follows from that code.
- **Potential** — the risk depends on deployment, a race, or a condition that was not executed.

No application code was changed. Fixes were not applied.

---

## Executive summary

The admin API is generally built the right way: JWT identity is reloaded from the database, role checks sit on privileged controllers, artists are scoped to their own products and order lines, customer order reads are scoped by `userId`, and card prices are taken from the database rather than from the browser.

Card payments are the strongest part of the design. The Netopia IPN path checks the provider signature and then confirms status, amount, currency, and order id with Netopia’s status API before treating a card order as paid.

The store is not safe to run as a public production shop until the cash-checkout and stock-reservation issues are fixed. An unauthenticated caller can place cash orders that the system stores as **paid**, permanently reduce stock, and email artists as if the order were real. The same caller can also hold an entire product’s stock through the guest reservation endpoint. Those two issues are enough for inventory loss and fraudulent fulfillment.

Other confirmed problems: access tokens are delivered in the Google redirect URL and stored in `localStorage`; profile responses include email-verification tokens; TypeORM `synchronize: true` is unconditional; security headers, rate limits, and account lockout are absent; order and checkout inputs are interpolated into HTML email; and both package trees have a large set of known vulnerable dependencies.

**Overall assessment:** conditional. Authorization on admin and customer order APIs is in decent shape, and card confirmation does not trust the browser. Unauthenticated commerce operations, token handling, schema sync, and dependency risk are below a production bar.

| Severity | Count |
| --- | ---: |
| Critical | 1 |
| High | 6 |
| Medium | 12 |
| Low | 8 |
| Informational | 6 |

---

## Critical vulnerabilities

### C-1. Unauthenticated cash checkout marks orders paid and decrements stock

| | |
| --- | --- |
| Severity | **CRITICAL** |
| Status | Verified in source |
| OWASP | A01 Broken Access Control, A04 Insecure Design, API6 Unrestricted Access to Sensitive Business Flows |

**Location**

- `backend/src/checkout/checkout.controller.ts` lines 148–180 (`POST /checkout/cash-order`) and lines 90–127 (cash branch of `POST /checkout/create-session`)
- `backend/src/auth/guards/optional-jwt-auth.guard.ts` lines 11–17 (missing bearer token is treated as anonymous success)
- `backend/src/orders/orders.service.ts` lines 89–95 (`createCashOrder` sets `paymentStatus` to `PAID`)
- `backend/src/checkout/checkout.service.ts` lines 1048–1122 and 928–934 (`fulfillOrder` runs immediately)
- `backend/src/stock-reservations/stock-reservations.service.ts` lines 169–198 (stock is reduced inside a row lock)

**Description**

Guest cash checkout requires no account, no CAPTCHA, and no rate limit. The handler accepts a client-supplied product list, loads the real catalog price (prices themselves are not client-controlled), writes an order with payment status `PAID`, sends order email to the shop, the artist, and the supplied address, and then subtracts stock.

`PAID` is also the gate for later fulfillment. `OrdersService.updateItemStatus` refuses status changes unless `paymentStatus === PAID` (`orders.service.ts` lines 304–308). A cash order created by an anonymous caller therefore looks like a confirmed paid order to artists.

**Exploitation scenario**

An anonymous client calls `POST /checkout/cash-order` with a guest name, any email address, a delivery address, and the id of an in-stock product. The API creates a `COD-<timestamp>` order, marks it paid, decrements `stockQuantity`, and notifies the artist. Repeating the call continues until stock is zero. An artist who trusts the paid status can ship goods that were never paid for. The same call can also be used to send order mail to arbitrary recipients.

**Impact**

Direct loss of inventory, fraudulent “paid” orders, operational email abuse, and possible shipment of goods with no payment. Card checkout does not have this flaw: card orders stay `PENDING` until Netopia confirms them.

**Remediation**

- Keep cash orders in a distinct unpaid state such as `AWAITING_CASH`. Allow artists to advance item status only after an explicit staff confirmation, or accept the fraud risk consciously and still add the controls below.
- Require a verified account for cash orders, or add equivalent bot resistance plus a per-IP and per-email velocity limit.
- Cap quantities per order and per identity, and reject repeated identical guest orders.
- Do not send “payment received” copy for cash on delivery.
- Add an idempotency key so retries cannot create a second paid order.

---

## High-priority vulnerabilities

### H-1. Anonymous guest reservations can lock all stock

| | |
| --- | --- |
| Severity | **HIGH** |
| Status | Verified in source |
| OWASP | API6 Unrestricted Access to Sensitive Business Flows, A04 Insecure Design |

**Location**

- `backend/src/stock-reservations/guest-cart-reservations.controller.ts` lines 5–16 (`PUT /cart/guest/reservations`, no guard)
- `backend/src/stock-reservations/stock-reservations.service.ts` lines 97–145
- `backend/src/stock-reservations/stock-reservation.constants.ts` (`STOCK_RESERVATION_TTL_MS` = 10 minutes)
- `backend/src/stock-reservations/dto/sync-guest-reservations.dto.ts` (guest id is any string of length ≥ 8; no upper bound on the items array)

**Description**

Any caller can choose a `guestId` and reserve stock up to the full remaining quantity. `getAvailableForHolder` ignores that holder’s own reservation, so one id can reserve the entire sellable quantity. Refreshing before expiry keeps the hold indefinitely. A second holder then sees zero available stock. There is no authentication, rate limit, or cap on how many distinct guest ids can be created.

**Exploitation scenario**

A script repeatedly calls `PUT /cart/guest/reservations` for every public product id with `quantity` set to a large integer and a fresh `guestId`. Each product’s available stock becomes zero for other customers. Refreshing every few minutes keeps the products unsellable.

**Impact**

Denial of sales for as long as the caller keeps refreshing. Combined with C-1, the same actor can also convert the hold into a permanent stock reduction.

**Remediation**

- Bind guest reservations to a server-issued, HttpOnly, signed cookie instead of a client-chosen id.
- Limit reserved quantity per holder and per network, and cap the number of lines.
- Add rate limiting on this route.
- Do not let one anonymous holder reserve 100% of a product for a long TTL.

### H-2. Google sign-in puts the access token in the URL

| | |
| --- | --- |
| Severity | **HIGH** |
| Status | Verified in source |
| OWASP | A07 Authentication Failures, A02 Cryptographic Failures |

**Location**

- `backend/src/auth/auth.controller.ts` lines 45–57
- `frontend/pages/auth/google-callback.vue` lines 25–33
- `frontend/composables/useAuthState.ts` lines 58–59 (token then stored in `localStorage`)

**Description**

The Google callback returns an HTML document that redirects the browser to `/auth/google-callback?token=<url-encoded JSON>`. That JSON contains `access_token`. The token therefore lands in browser history, proxy and server access logs, and the `Referer` header if the callback page requests any third-party resource. The callback page does not strip the query before navigation completes.

The redirect string itself is `encodeURIComponent`’d, so this is not an HTML injection into the callback script. The leak is the token in the URL.

**Exploitation scenario**

A user signs in with Google on a shared or logged network. The JWT is written to access logs and browser history. Anyone who can read those logs can call the API as that user until the one-day token expires. There is no refresh-token rotation and no server-side revocation list.

**Impact**

Account takeover for the token lifetime, including artist or super-admin sessions if those users use Google sign-in.

**Remediation**

- Finish OAuth on the server: set a short-lived, one-time code in an HttpOnly, Secure, SameSite cookie (or a single-use code in the URL), then exchange it via `POST` for a session cookie.
- Do not put JWTs in query strings.
- Prefer an HttpOnly Secure cookie over `localStorage` for the session (see M-2).

### H-3. Local file disclosure through product image URLs in order email

| | |
| --- | --- |
| Severity | **HIGH** |
| Status | Verified in source (not executed against a running server) |
| OWASP | A01 Broken Access Control, A03 Injection (path traversal) |

**Location**

- `backend/src/checkout/checkout.service.ts` lines 1316–1338
- `backend/src/products/dto/create-product.dto.ts` lines 34–39 (`images` is an unconstrained string array, max length 500)
- The same pattern exists on the update and draft DTOs

**Description**

When an order email is built, each product image URL is parsed. If the hostname **contains** the substring `localhost`, the URL path is decoded and joined onto `frontend/public`:

```ts
const relativeImagePath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
const localImagePath = path.join(process.cwd(), "..", "frontend", "public", relativeImagePath);
```

`path.join` resolves `..`. A hostname such as `localhost.example` satisfies `includes("localhost")` even though the file is never fetched from that host. The resulting local file is attached to the customer email if it exists. Absolute image URLs are preserved by `toAbsoluteImageUrl` (line 1423).

An approved artist can submit an image string. The product must be approved before `findOnePublic` will sell it, so a reviewer has to approve the product (or fail to notice the image URL). After that, any order for the product, including one placed by the artist, attaches the local file to the customer message.

**Exploitation scenario**

An artist saves a product whose image is an absolute URL whose host contains `localhost` and whose path walks out of `frontend/public` into the backend environment file or another readable file. After approval, they place an order. The confirmation email includes that file as an attachment. Database credentials, `JWT_SECRET`, and the Netopia API key live in that environment file on the server.

**Impact**

Disclosure of server files to a lower-privileged artist, with a realistic path to full application compromise if the environment file is readable from the process working directory.

**Remediation**

- Allow only stored upload paths such as `/uploads/products/<uuid>.webp`. Reject absolute URLs and any value containing `..`.
- If a local file must be inlined, resolve it with `path.resolve` and require the result to stay inside an allowlisted directory (`path.relative` must not start with `..`).
- Delete the `hostname.includes("localhost")` special case.

### H-4. TypeORM schema synchronization is always on

| | |
| --- | --- |
| Severity | **HIGH** |
| Status | Verified in source. Production impact depends on this setting being deployed as-is. |
| OWASP | A05 Security Misconfiguration, A08 Software and Data Integrity Failures |

**Location**

- `backend/src/app.module.ts` lines 24–32 (`synchronize: true` with no environment guard)

**Description**

On every boot, TypeORM alters the PostgreSQL schema to match entities. A bad deploy, a renamed column, or a partial entity change can drop or rewrite production data. There is no migration history. The database user configured in the environment must also be allowed to change schema (`ALTER`, `DROP`), which is more privilege than the application needs at runtime.

**Impact**

Data loss, unexpected schema changes, and an application database account that can destroy tables.

**Remediation**

- Set `synchronize: false` outside local development.
- Ship versioned migrations.
- Use a runtime database role that can `SELECT/INSERT/UPDATE/DELETE` and cannot change schema.

### H-5. No rate limiting on authentication, checkout, uploads, or lookups

| | |
| --- | --- |
| Severity | **HIGH** |
| Status | Verified in source (absence of control). Login lockout was not penetration-tested. |
| OWASP | A07 Authentication Failures, API4 Unrestricted Resource Consumption |

**Location**

- `backend/src/main.ts` (no throttler, no helmet)
- `backend/src/auth/auth.controller.ts` lines 19–34 (`POST /auth/login`, `POST /auth/register`)
- Checkout, guest reservation, company lookup, and upload controllers (no throttle decorators anywhere in `backend/src`)

**Description**

Login, registration, email verification, cash and card checkout, guest stock holds, ANAF company lookup, and image upload accept unlimited traffic. Passwords have a reasonable complexity rule on registration, but login accepts any body shape (the handler types the body inline, so `ValidationPipe` does not validate it) and never slows repeated failures.

**Exploitation scenario**

Credential stuffing against `POST /auth/login`, mass registration, and the stock and cash-order abuse described in C-1 and H-1. Company lookup (`GET /checkout/company/:cui`) also proxies every request to ANAF with no quota.

**Impact**

Account takeover of weak or reused passwords, mail flooding, inventory abuse, and denial of service against the API and the upstream ANAF service.

**Remediation**

- Add `@nestjs/throttler` globally, with stricter limits on login, register, checkout, IPN is excluded only if the source IP is Netopia’s, reservations, uploads, and company lookup.
- Add a short lockout or increasing delay after repeated login failures for the same account and source.
- Validate login with a DTO (`@IsEmail`, `@IsString`, `@MaxLength`).

### H-6. Direct dependencies with known high or critical advisories

| | |
| --- | --- |
| Severity | **HIGH** |
| Status | Verified by `npm audit --omit=dev` on 24 November 2026. Individual CVEs were not exploit-tested in this app. |
| OWASP | A06 Vulnerable and Outdated Components |

**Backend production audit:** 42 findings (5 critical, 29 high, 8 moderate).

Critical transitive packages include `form-data`, `handlebars`, `proxy-addr`, `sha.js`, and `tar`.

Direct packages flagged high include `typeorm` (SQL injection advisories in `save`/`update` and query-builder `orderBy`; this codebase uses parameterized query builders and DTO-whitelist updates, so those advisories are not a confirmed injection today), `multer`, `nodemailer`, `@nestjs-modules/mailer`, `sharp`, `bcrypt` (via `tar` / `@mapbox/node-pre-gyp`), `@nestjs/platform-express`, and `@nestjs/config`. `jws` (JWT verification) is a high transitive dependency of Passport.

**Frontend production audit:** 63 findings (4 critical, 38 high, 16 moderate, 5 low).

Critical packages include `tar`, `shell-quote`, `simple-git`, and `@nuxt/devtools` (build/dev tooling more than storefront runtime). Direct runtime packages flagged high include `nuxt`, `vue`, `nitropack`, and `sharp`. Transitive runtime packages flagged high include `h3`, `devalue`, `vite`, and `ws`.

`@nestjs/platform-express` is at v11 while `@nestjs/common` and `@nestjs/core` are at v10. `multer` is pinned to the prerelease `2.0.0-rc.1`. `backend/package.json` also runs `npm install` in `prebuild`, which can change the tree during a production build.

**Impact**

Known bugs in the HTTP stack, mailer, image pipeline, and ORM remain available to attackers as those advisories describe. Build-time `npm install` weakens reproducible deploys.

**Remediation**

- Do not mass-upgrade majors in one step.
- Patch transitive criticals first where `npm audit` offers a non-breaking fix (`tar`, `form-data`, `proxy-addr`, `sha.js`, `jws`, `nodemailer`, `validator`).
- Plan a deliberate Nest 11 / TypeORM upgrade and align `@nestjs/platform-express` with the rest of Nest.
- Replace `prebuild: npm install` with a lockfile install in CI (`npm ci`).
- Re-run `npm audit` after each bump and keep this report’s dependency section current.

---

## Medium findings

### M-1. HTML injection in order emails

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `backend/src/checkout/checkout.service.ts` lines 621–642 (`formatBillingHtml`) and lines 1211–1312 (customer, admin, and artist templates). Guest names, addresses, billing fields, and product titles are concatenated into HTML.

**Scenario:** A guest checkout (C-1) or an artist product title includes HTML or a tracking link. The message is sent to the shop inbox and to the artist. Many mail clients render that HTML.

**Impact:** Phishing of staff and artists from a message that appears to come from the shop, and possible mailbox XSS depending on the client.

**Remediation:** Escape every interpolated value (or build the mail with a template that escapes by default). Send a plain-text alternative.

### M-2. Session token stored in `localStorage`

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `frontend/composables/useAuthState.ts` lines 36–68, `frontend/composables/useApi.ts`, `frontend/pages/cos.vue`, `frontend/pages/profil.vue`, and other callers of `localStorage.getItem("token")`.

No `v-html` or `innerHTML` usage was found, so there is no current stored-XSS sink in Vue templates. The token is still readable by any script that later runs in the origin, including a compromised dependency or an injected tag. There is no `Content-Security-Policy`.

**Impact:** Any future XSS becomes full account takeover. Admin UI role checks in `frontend/middleware/admin.ts` and `super-admin.ts` run only in the browser; the API does enforce roles, so editing `localStorage.user.role` does not grant API access. It can only change what the UI shows.

**Remediation:** Move the session to an HttpOnly, Secure, SameSite=Lax (or Strict) cookie. Keep the client role hint non-authoritative, as it already is on the API.

### M-3. Email verification token returned on the profile API and stored in the browser

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location**

- `backend/src/common/utils/user-response.util.ts` lines 22–25 (`stripPassword` removes only `password`)
- `backend/src/users/users.controller.ts` lines 38–44, 47–54, and 126–134
- `frontend/utils/sync-user-profile.ts` lines 23–24 and `frontend/composables/useAuth.ts` lines 179–181 (the whole JSON body is written to `localStorage`)

`toUserResponse` used by login is narrower and does not include the token. `GET /users/profile` and the super-admin user list use `stripPassword`, so `email_verification_token` and `email_verification_token_expires` are serialized. The frontend type `AuthUser` omits those fields, but `JSON.stringify` still persists them.

**Impact:** The verification secret sits in `localStorage` next to the JWT. Super-admin list responses also carry every user’s current verification token. XSS, a shared browser profile, or an over-broad admin client exposes the token. `GET /auth/verify-email?token=` also puts the same secret in URLs and logs.

**Remediation:** Add an explicit response DTO that returns only the fields the UI needs. Never return verification tokens. Change verification to a POST body so the token is not a query parameter.

### M-4. Email verification is not required for a session

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `backend/src/auth/auth.service.ts` lines 100–106 (register returns a JWT immediately) and lines 28–46 (`login` does not read `is_email_verified`). No guard checks the flag.

**Impact:** Anyone can register with an address they do not control, receive a working JWT, and use checkout, cart, and profile until the token expires. Password reset does not exist, so there is no second flow that depends on the mailbox. The main abuse is unsolicited accounts and orders tied to someone else’s address.

**Remediation:** If verification matters, refuse login and privileged actions until `is_email_verified` is true. Keep issuing the JWT only after verification, or issue a narrowly scoped token that can only request a new verification mail.

### M-5. Payment return URLs are not pinned to the storefront

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `backend/src/checkout/checkout.controller.ts` lines 75–88. A `successUrl` or `cancelUrl` that starts with `http` is forwarded to Netopia as `redirectUrl` / `cancelUrl` (`checkout.service.ts` lines 400–405).

**Scenario:** A page the shopper is using (a malicious script, a compromised dependency, or a cloned client) starts checkout with `successUrl` pointing at an external site. After the shopper pays on Netopia, the browser is sent there. The payment itself is still confirmed server-side, so this does not mark an unpaid order as paid. It does let an attacker collect the post-payment landing, including the order id if it is added to that URL later.

Login’s `redirect` query is safer: `frontend/pages/login.vue` line 170 only navigates when the value starts with `/`. A value of `//host` still starts with `/` and should be rejected as well.

**Remediation:** Accept only relative paths, resolve them against `FRONTEND_URL`, and compare the final origin to the storefront origin. Reject protocol-relative redirects.

### M-6. Security headers are not set

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `backend/src/main.ts` lines 8–24; `frontend/nuxt.config.ts` `app.head` (no CSP, HSTS, frame, or referrer policy). `routeRules` do not set headers. CORS is `origin: process.env.FRONTEND_URL` with `credentials: true`. If `FRONTEND_URL` is missing, the CORS middleware reflects the request origin.

There is no cookie session today, so CORS reflection does not currently steal a cookie. It becomes serious if sessions move to cookies without a strict origin allowlist.

**Remediation**

- Add `helmet` on the API (frame denial, `nosniff`, referrer policy, HSTS behind TLS).
- Add Nuxt `routeRules` or Nitro headers: `Content-Security-Policy`, `X-Frame-Options` or `frame-ancestors`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`.
- Fail startup when `FRONTEND_URL` is empty. Do not reflect arbitrary origins.

### M-7. Google OAuth does not enable `state`

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `backend/src/auth/strategies/google.strategy.ts` lines 9–14. The strategy does not set `state: true`. The callback also trusts the first Google email and links it to an existing local user (`auth.service.ts` lines 140–160).

**Impact:** Login CSRF. An attacker can complete Google consent for their own Google account and trick a victim’s browser into finishing the callback, which stores the attacker’s JWT in the victim’s `localStorage`. The victim then acts inside the attacker’s account. This is not theft of the victim’s Google account. Linking by email is acceptable only because Google has verified that address; keep that assumption explicit.

**Remediation:** Enable OAuth `state` (and PKCE if the library supports it). Set a strong `JWT_SECRET` and refuse to boot when it is missing or still the example value `change-me`.

### M-8. Checkout and several auth bodies skip DTO validation

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location**

- `CheckoutBody` / `CashOrderBody` in `checkout.controller.ts` lines 18–52 are TypeScript types, not `class-validator` classes. The global pipe cannot whitelist them.
- Login body at `auth.controller.ts` lines 25–28 has the same gap.
- `CreateUserDto` (`users/dto/create-user.dto.ts` lines 84–93) still exposes `is_email_verified`, `email_verification_token`, and `email_verification_token_expires` on the public register DTO. `register` currently overwrites those fields after the spread (`auth.service.ts` lines 79–85), so this is not a working privilege escalation today. A future reorder of that object would make it one.

`UsersService.update` strips `role` but will persist any other column it is given (`users.service.ts` lines 98–106), including `password` and `is_email_verified`. The profile DTO plus `whitelist: true` currently blocks that on HTTP. The service itself does not.

**Remediation:** Validate every public body with a DTO. Remove verification and role fields from `CreateUserDto`. Make `update` assign an explicit allowlist, not `Partial<User>`.

### M-9. Order email and IPN handling have a double-fulfillment race

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Potential. The race is visible in code; it was not reproduced under concurrent requests. |

**Location:** `checkout.service.ts` `processCardPaymentNotification` lines 1664–1719. The “already fulfilled” check and `fulfillOrder` are not one transaction. Two overlapping Netopia retries can both observe `stockFulfilledAt == null` and both subtract stock. `fulfillOrder` locks the product row, so the second decrement is serialized, but it still subtracts again.

Fulfillment also deletes every reservation for the product, not only the buyer’s (`stock-reservations.service.ts` lines 201–204). One completed order drops other shoppers’ holds.

**Remediation:** Mark the order fulfilled with a conditional update (`UPDATE ... WHERE stock_fulfilled_at IS NULL RETURNING`) and decrement stock only when that update changes a row. Delete only the purchasing holder’s reservations.

### M-10. User email is not unique at the database

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `backend/src/users/entities/user.entity.ts` lines 18–19. `email` is a plain column. Register checks for an existing row first (`auth.service.ts` lines 50–57), which races. Lookup is case-sensitive, so `User@x.com` and `user@x.com` are different accounts. Login uses the raw address.

**Impact:** Duplicate accounts for one mailbox, and a race that can create two rows. `findOneByEmail` then returns whichever row the database yields first.

**Remediation:** Normalize email to lowercase on write and login. Add a unique index on the normalized email. Do the same for phone if it is an account identifier.

### M-11. Image upload trusts the client MIME type and buffers the file

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Verified in source |

**Location:** `backend/src/uploads/uploads.controller.ts` lines 21–28; `uploads.service.ts` lines 31–53.

Artists may upload up to three 10 MB files held in memory. The check is `mimetype.startsWith("image/")`, which the client sets, so `image/svg+xml` and non-images are accepted until `sharp` runs. Re-encoding to WebP is a good control when `sharp` rejects the input. A decompression bomb can still exhaust memory before resize. There is no per-artist quota, so uploads can fill the disk. Files are then served anonymously from `/uploads` (`main.ts` line 12), which is appropriate for published product photos and too open for images of products that were never approved.

**Remediation:** Allowlist `image/jpeg`, `image/png`, `image/webp` and check magic bytes. Disable SVG. Limit dimensions before a full decode if `sharp` supports it. Add a quota. Consider not serving unapproved uploads on the public prefix.

### M-12. Database connection has no TLS or certificate check in configuration

| | |
| --- | --- |
| Severity | **MEDIUM** |
| Status | Potential. The TypeORM options in `app.module.ts` lines 24–32 set host, user, and password only. Whether the database is on localhost or across a network was not verified. |

**Remediation:** For any non-local Postgres, set `ssl: { rejectUnauthorized: true }` and restrict the database to a private network.

---

## Low findings

### L-1. Public order numbers are timestamps

`orders.service.ts` lines 76–78 use `` `${prefix}-${Date.now()}` ``. Two orders in the same millisecond collide on the unique column. `GET /checkout/order-status/:orderId` (controller lines 63–67) is unauthenticated and returns the payment status for that id. It does **not** return customer data. Guessing recent `MIL-<epoch ms>` values reveals whether a payment succeeded.

**Remediation:** Use a long random public id. Keep this endpoint limited to status, or require the customer email plus the id.

### L-2. Google-created passwords use `Math.random`

`auth.service.ts` line 143. The password is not shown to the user, but it is a predictable 8-character value and it is the password login would accept if someone later enables password login for that account. There is no password-reset flow to replace it.

**Remediation:** Use `crypto.randomBytes`. Do not allow password login for Google-only users unless they set a password through a verified reset.

### L-3. Third-party stylesheets without Subresource Integrity

`frontend/nuxt.config.ts` lines 90–99 load Phosphor CSS from `cdn.jsdelivr.net` with no `integrity` attribute. A compromised CDN response can restyle the origin and, depending on CSS features, influence what users click. This is CSS, not an arbitrary script tag.

**Remediation:** Vendor the icon CSS from the existing `@phosphor-icons/web` dependency. If a CDN remains, pin a version and add SRI.

### L-4. Open company lookup proxy

`GET /checkout/company/:cui` (`checkout.controller.ts` lines 58–60, service lines 645–662) forwards any digit string to ANAF with no authentication or quota. The URL is fixed, so this is not a general SSRF. It is an unauthenticated relay and an oracle for company registry data.

**Remediation:** Rate-limit, and optionally require a checkout session.

### L-5. Super-admin allowlist is committed with personal addresses

`backend/src/database/seeds/super-admins.seed.ts` promotes specific mailboxes to `SUPER_ADMIN` on every boot. The mechanism is sound (there is no public “make me admin” endpoint). The addresses are personal data in the repository, and anyone who can change that file and deploy becomes an admin.

**Remediation:** Move the allowlist to the environment or a protected admin action. Avoid committing personal inboxes.

### L-6. Example environment contains a live-looking tunnel host

`backend/.env.example` line 12 sets `BACKEND_URL` to a `trycloudflare.com` hostname. That is not a credential. Quick tunnels are ephemeral, but a committed hostname documents an old external entry point and can be copied into real environments by mistake.

**Remediation:** Use `http://localhost:4000` in the example.

### L-7. Registration and profile updates have no length ceiling on some free-text fields

Address and name DTOs use `@IsString()` and `@IsOptional()` without `@MaxLength` (`update-profile.dto.ts`, `update-address.dto.ts`, `secondary-address.dto.ts`). Checkout guest strings have no max length because they are not DTOs (M-8). Large bodies increase memory and email size.

### L-8. Client-side admin middleware is not a security boundary

`frontend/middleware/admin.ts` and `super-admin.ts` return immediately on the server (`import.meta.server`) and only then read `localStorage`. Admin routes are also `ssr: false` in `nuxt.config.ts`. This is acceptable because Nest guards are the real control. Do not add admin-only data to those pages from a public payload.

---

## Informational

### I-1. `.env` is ignored now, and it used to be committed

`.gitignore` ignores `backend/.env`, `frontend/.env`, `*.env`, `backend/certs/`, and `backend/uploads/`. `git ls-files` does not currently track those paths. `git log` shows `frontend/.env` in earlier commits (`c113c24`, `a835db8`, `19f33a1`, `00c570a` and related history). This audit did **not** print or extract those blobs.

**Action:** If that historical file ever held a real API URL secret, OAuth secret, or similar, rotate it and purge it from history. Treat any credential that ever lived in git as public.

### I-2. No password-reset or refresh-token flow

Access tokens last one day (`auth.module.ts` line 21) and cannot be revoked. There is no refresh rotation and no forgot-password endpoint. That avoids a broken reset implementation, and it also means lost passwords cannot be recovered safely in-product. When reset is added, use a single-use hashed token, a short expiry, and no user enumeration.

### I-3. No Docker, CI, or deployment policy in the repo

There is no `Dockerfile`, compose file, or GitHub workflow. `frontend/nuxt.config.ts` sets `nitro.preset` to `netlify`. HTTPS, HSTS, and source-map publication could not be verified on a live host. Nuxt does not explicitly disable production source maps in config. Confirm the Netlify deploy does not publish `*.map`, forces HTTPS, and does not expose the Nest port publicly except through the intended origin.

### I-4. IPN logging

`checkout.service.ts` logs IPN error text and Netopia status payloads (`logger.warn` of `JSON.stringify(data)` around lines 333–347 and status logs around 1599–1600). Confirm logs are access-controlled and retained with a defined lifetime. Do not log full payment instrument data. The current start-payment body sends empty card fields, which is correct.

### I-5. Backend unit tests are partly stale

Jest on 24 November 2026: 4 suites passed, 3 failed, 10 tests passed, 3 failed. Failures are dependency setup in `users.service.spec.ts`, `users.controller.spec.ts`, and `products.service.spec.ts` (missing repository / `DataSource` providers), not assertion failures about security behavior. The frontend `package.json` has no test, lint, or typecheck script. Backend lint is defined as `eslint --fix` and was not run, so this audit would not rewrite files.

### I-6. Positive note on card payment trust

Card confirmation does not trust the browser return page. See “Positive security practices”.

---

## Payment review (Netopia)

| Control | Result |
| --- | --- |
| Browser return page marks the order paid | No. `pages/plata/succes.vue` only displays status. |
| Prices taken from the client | No. `buildOrderItems` uses `product.price` from the database (checkout service lines 1160–1168) and checks stock. |
| IPN signature | Yes. `handleIpn` calls `Ipn.verify` with the `verification-token` header and the raw body (`checkout.service.ts` lines 1453–1459). |
| Server-side confirmation | Yes. `netopiaPaymentIsPaid` calls Netopia `/operation/status` and checks order id, ntp id, currency `RON`, amount within 0.05, and status paid (3) or confirmed (5) (lines 1544–1634). |
| Signed IPN with unpaid status | Ignored (lines 1492–1500). |
| Replay of an already fulfilled paid order | Returns early when paid, stock fulfilled, and confirmation sent (lines 1667–1672). Concurrent retries are still a race (M-9). |
| Cash on delivery | Fails the “never trust the client” rule. The client request itself sets `PAID` (C-1). |
| Open redirect after payment | `successUrl` / `cancelUrl` can be absolute (M-5). |

The public certificate file is loaded from configuration or the first `.cer` in `certs/`. The directory is gitignored. Do not commit the private POS key. The example file correctly says the API key is not the private key.

---

## OWASP Top 10 (2021) and API Security Top 10 (2023)

| Category | Assessment |
| --- | --- |
| A01 / API1 Broken access control | Admin and customer-order object access is scoped and looked solid. Cash checkout and guest reservations are broken business-level access control (C-1, H-1). Profile payloads leak verification secrets (M-3). Path traversal via image URL (H-3). |
| A02 Cryptographic failures | Passwords use bcrypt with cost 10. JWT expiry is enforced. Tokens are stored and transported poorly (H-2, M-2). Google passwords use `Math.random` (L-2). Verification tokens are stored in plaintext, which is normal only if they are short-lived and never returned to the client. |
| A03 Injection | No string-built SQL was found. Query builder values are parameterized. Email HTML is not escaped (M-1). Path join on image URLs (H-3). TypeORM advisory (H-6) is not currently reachable through whitelisted DTOs. |
| A04 Insecure design | Cash orders modeled as paid; anonymous stock holds; no abuse limits. |
| A05 Security misconfiguration | `synchronize: true`, no security headers, CORS depends on a single env var, example tunnel host, dependency advisories. |
| A06 Vulnerable components | Confirmed by npm audit (H-6). |
| A07 / API2 Authentication failures | No login throttling, verification not enforced, OAuth `state` off, JWT in URL and `localStorage`, no revocation. |
| A08 Integrity failures | No CI signing or lockfile install on the backend `prebuild`. Payment amount is checked for cards. |
| A09 Logging and monitoring | Useful Nest logs and an admin audit log exist for product and order admin actions. Auth failures, checkout abuse, and IPN failures are not raised as security alerts. No request id or centralized alert path was found. |
| A10 / API7 SSRF | Company lookup calls a fixed ANAF URL only. No general URL fetch of user input was found, except Netopia’s own configured host. |
| API3 Object property level | Register DTO contains privileged fields but they are overwritten (M-8). Profile DTO is whitelisted. Service-level `update` is broader than the DTO. |
| API4 Resource consumption | Uploads, guest reservation arrays, and unthrottled routes (H-5, M-11). |
| API5 Function level authorization | `RolesGuard` plus service-level artist ownership on products and order items. Suspend sets the user role back to `CLIENT` (`artists.service.ts` lines 278–281). |
| API6 Business flows | C-1 and H-1. |
| API8 Misconfiguration | Same as A05. |
| API9 Inventory | No published OpenAPI file was found. Shadow route risk is low because controllers are explicit. `GET /` exists on the app controller. |

---

## Authentication and authorization notes

What was checked and held:

- JWT payload is `{ email, sub }` only. `JwtStrategy.validate` loads the user and rejects unknown ids (`jwt.strategy.ts` lines 22–27). Role changes take effect without waiting for token expiry.
- `RolesGuard` denies missing users and missing roles (`roles.guard.ts`).
- Customer orders: `GET /users/orders` and `GET /users/orders/:id` filter on `req.user.id` (`orders.service.ts` lines 167–185).
- Artist order lines: `updateItemStatus` and `unarchiveOrder` require the item’s artist (`orders.service.ts` lines 295–299 and 324–334).
- Artist products: `assertCanManageProduct` and the artist-scoped queries in `products.service.ts`.
- Super-admin user detail and user list are guarded.
- Mass assignment of `role` on profile update is stripped in the service and absent from the DTO.

What did not hold is documented above (anonymous checkout, token storage, verification bypass).

IDOR against another customer’s order id was not found on `GET /users/orders/:id`. The unauthenticated order-status route leaks only payment status for a guessable public number (L-1).

---

## Dependency and infrastructure summary

| Area | Result |
| --- | --- |
| Backend `npm audit --omit=dev` | 5 critical, 29 high, 8 moderate |
| Frontend `npm audit --omit=dev` | 4 critical, 38 high, 16 moderate, 5 low |
| Lockfiles | Present for both apps. Not upgraded in this audit. |
| Docker / CI | Not in the repository |
| HTTPS | Not verifiable from repo. Required at the edge. |
| Secrets in current tree | `.env` and `certs/` are gitignored and not in the current index. Historical `frontend/.env` commits exist (I-1). |
| Production source maps | Not explicitly disabled |
| Tests | Backend Jest: 10 passed, 3 failed (broken harness). No frontend test script. |

---

## Positive security practices already implemented

- bcrypt for password storage, with a registration policy of length, uppercase, two digits, and a special character.
- JWT expiration of 1 day and `ignoreExpiration: false`.
- Role is read from the database on each request, not trusted from the token body.
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`.
- Admin product, artist, order, audit-log, and upload controllers use `JwtAuthGuard` and `RolesGuard`.
- Artists are limited to their own products and order items. Suspension demotes the user to `CLIENT`.
- Customer order reads are scoped by the authenticated user id.
- Catalog price and stock are resolved on the server during checkout.
- Card IPN verification uses the provider signature and a server-to-server status call that checks amount, currency, and order id.
- Upload pipeline re-encodes to WebP with a random filename, a 10 MB cap, and a 3-file cap.
- Password is removed from the login/register user object via `toUserResponse`.
- `.gitignore` covers env files, Netopia certificates, and the uploads directory.
- Email verification tokens are 32 random bytes with a 24-hour expiry.
- Super-admin promotion is an explicit allowlist, not a self-service API.
- An audit log is written for sensitive admin product and order actions.

---

## Remediation roadmap

Do these in order. Items in phase 1 are the ones that can lose money or stock without an account.

### Phase 1 — before real orders

1. Stop marking cash orders as `PAID` on creation. Separate “order accepted” from “cash collected”, and block artist fulfillment until that distinction is explicit (C-1).
2. Put authentication or strong abuse controls on cash checkout, and rate-limit it (C-1, H-5).
3. Replace client-chosen guest reservation ids and stop one caller from reserving the full stock (H-1).
4. Restrict product `images` to generated upload paths and remove the localhost path-join in order email (H-3).
5. Escape HTML in order email (M-1).
6. Turn off TypeORM `synchronize` for anything but local dev and add migrations (H-4).

### Phase 2 — account and session

1. Stop returning the Google JWT in a query string. Move the session to an HttpOnly Secure cookie (H-2, M-2).
2. Remove verification tokens from all API responses and from `localStorage` (M-3).
3. Enforce email verification if the product requires a real mailbox (M-4).
4. Add login and register rate limits and a login DTO (H-5).
5. Enable Google OAuth `state` (M-7).
6. Pin payment redirect URLs to `FRONTEND_URL` (M-5).
7. Unique, case-insensitive email index (M-10).

### Phase 3 — hardening

1. Security headers and a strict CORS allowlist that fails closed (M-6).
2. Make IPN fulfillment conditional and single-shot (M-9).
3. Tighten uploads (magic bytes, no SVG, quota) (M-11).
4. Random public order ids (L-1).
5. Database TLS for remote Postgres, and a non-DDL database role (M-12, H-4).
6. Patch dependency advisories without a blind major upgrade (H-6). Remove `prebuild` `npm install`.
7. Confirm historical `frontend/.env` contents privately and rotate anything real (I-1).
8. Add security-focused tests for C-1, H-1, H-3, and the card IPN amount check. Repair the three broken Jest suites first so new tests can run.

---

## Suggested tests (not added)

These were not committed, so the tree stays free of failing tests until you approve fixes.

- Guest `POST /checkout/cash-order` must not persist `paymentStatus = PAID` and must not change `stockQuantity` until cash is confirmed.
- `PUT /cart/guest/reservations` from two anonymous ids must not be able to pin `stockQuantity` to zero for the whole TTL without a server-issued holder.
- Creating a product with an image URL whose host contains `localhost` and whose path contains `..` is rejected.
- `handleIpn` does not mark paid when the status API amount differs from `totalRon`, when the currency is not RON, or when the signature is invalid and the status API is not paid.
- `GET /users/profile` does not contain `email_verification_token` or `password`.
- Artist A cannot `PATCH` the order-item status of artist B.
- User A cannot `GET /users/orders/:id` for user B.

---

## What was executed

| Check | Result |
| --- | --- |
| Source review of auth, users, orders, checkout, products, uploads, stock, artists, config | Completed |
| Search for `v-html`, `innerHTML`, `eval` | No matches |
| `npm audit --omit=dev` backend and frontend | Completed; counts in H-6 |
| Backend Jest | 10 passed, 3 failed (stale test modules) |
| Frontend tests / typecheck | No scripts defined |
| ESLint | Not run; the npm script includes `--fix` and would edit the tree |
| Live production or Netopia | Not contacted |
| Git secret extraction | Not performed. Commit names that touched `frontend/.env` are listed in I-1. |

---

## Approval

No fixes were applied. Say which phase, or which finding ids, should be implemented first.
