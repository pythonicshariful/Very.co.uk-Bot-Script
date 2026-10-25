# 🛍️ VeryBot UK — Advanced Automated Shopping & Restock Suite

> **Version:** 2.0  
> **Target Store:** [Very.co.uk](https://www.very.co.uk/)  
> **Platform:** Tampermonkey / Violentmonkey Userscript  
> **Script File:** [`Very Bot Script.js`](file:///c:/Users/pytho/Downloads/VERYBOT/Very%20Bot%20Script.js)  

**VeryBot UK** is a high-performance, enterprise-grade Tampermonkey automation bot designed specifically for **Very.co.uk**. Engineered with biometric humanization, headless background stock monitoring, automated `.prd` product basket additions, automated Fuse login, and instant multi-channel webhook notifications (Telegram & Discord), it gives you an unfair advantage during flash restocks, high-demand drops (such as Pokémon cards, consoles, graphics cards, and designer goods), and competitive sale events.

---

## 📋 Table of Contents
1. [Key Features & Capabilities](#-key-features--capabilities)
2. [HUD Console Interface](#-hud-console-interface)
3. [Anti-Bot & Biometric Humanization Engine](#-anti-bot--biometric-humanization-engine)
4. [Step-by-Step Installation Guide](#-step-by-step-installation-guide)
5. [Usage Workflows & How-To](#-usage-workflows--how-to)
   - [Workflow A: Monitoring a Search Page for Restocks](#workflow-a-monitoring-a-search-page-for-restocks)
   - [Workflow B: Direct Product Page Auto-Add & Restock Sniping](#workflow-b-direct-product-page-auto-add--restock-sniping)
   - [Workflow C: Setting a Scheduled Drop Timer](#workflow-c-setting-a-scheduled-drop-timer)
   - [Workflow D: Webhook Notifications Setup (Telegram & Discord)](#workflow-d-webhook-notifications-setup-telegram--discord)
6. [DOM Selectors & Technical Reference](#-dom-selectors--technical-reference)
7. [Settings & Storage Reference](#-settings--storage-reference)
8. [Best Practices for High-Contention Drops](#-best-practices-for-high-contention-drops)
9. [Troubleshooting Guide](#-troubleshooting-guide)

---

## ⚡ Key Features & Capabilities

### 1. 🔍 Headless Background Search Monitor
- **No Page Reloads**: Silently monitors Very.co.uk search results (`https://www.very.co.uk/search/*`) or category pages in the background using authenticated session `fetch` with `credentials: 'include'`.
- **Automatic Stock Transition Detection**: Parses up to 36 product links per scan (`.prd` URLs). Distinguishes between `In Stock` and `Out of Stock` / `Sold Out` / `Currently Unavailable`.
- **Immediate Auto-Navigation**: The exact millisecond an item transitions from out-of-stock to in-stock, the bot triggers audio chimes, dispatches webhooks, and automatically navigates directly to the product page.
- **State Deduplication**: Retains scan states in `sessionStorage` so you don't receive repetitive spam alerts for already-known stock.

### 2. 🎯 Direct Product Page (.prd) Automation
- **Stock Detection**: Instantly checks availability via Very's primary basket button (`#primaryAddToBasket`).
- **Silent Restock Polling**: If the item is currently Sold Out, the bot stays on the page and polls the server silently in the background at randomized Gaussian intervals. When inventory drops, it reloads immediately.
- **Quantity Selector**: Automatically sets your desired target quantity (`select[name="quantity"]`) before clicking Add to Basket.
- **Humanized Add to Basket**: Executes realistic pointer movements, focus, and clicks.
- **Mini-Basket / Modal Progression**: Automatically detects the "Go to basket" confirmation modal/popup and navigates directly to `/basket.page`.

### 3. 🛒 Basket & Checkout Progression
- **Automated Basket Evaluation**: Identifies the basket page (`/basket` or `/basket.page`).
- **Secure Checkout Click**: Locates the "Checkout securely" button (`button.fuse-button`, `data-testid="checkout-button"`) and triggers a biometric click sequence to proceed to the payment/delivery step.

### 4. 🔐 Automated Login (`/account/login`)
- **Fuse Input Autofill**: Auto-detects Very's Fuse design system inputs for **Account Number / Email**, **Password**, and optional registered **Postcode**.
- **React State Synchronization**: Directly syncs values with React's internal `_valueTracker` to ensure the form acknowledges input without breaking synthetic state.
- **Remember Me & Sign In**: Checks the "Remember me" box and clicks the primary "Sign In" button automatically.

### 5. 🍪 Automatic Cookie Consent Dismissal
- Automatically detects and dismisses OneTrust cookie consent banners (`#onetrust-accept-btn-handler`) the moment they appear, preventing any obstruction of your screen or bot operations.

### 6. 🔔 Multi-Channel Alerts
- **Web Audio Chime**: Synthesized 880 Hz pure sine chime using the HTML5 Web Audio API.
- **Desktop Push Notifications**: Native HTML5 browser popups displaying product title and status.
- **Telegram Webhook**: Sends real-time formatted alerts with product names and direct links to your private chat or channel.
- **Discord Webhook**: Sends rich messages directly to any Discord channel.

---

## 🎛️ HUD Console Interface

VeryBot injects a floating, glassmorphism dashboard directly onto the Very.co.uk storefront (`#very-bot-script-ui`), giving you complete control over every parameter:

```
+--------------------------------------------------------+
| 🔴 VeryBot UK        [🔍 Small] [➖] [🌐 General Page] |
+--------------------------------------------------------+
|  [ Dashboard ]      [ Targets ]      [ Profile ]       |
+--------------------------------------------------------+
|  [ ▶ START ]                     [ ⏹ STOP ]           |
|                                                        |
|  MIN DELAY (s): [ 4 ]      MAX DELAY (s): [ 10 ]       |
|  SCHEDULE START: [ YYYY-MM-DD HH:mm ]    [ ⏳ Set ]    |
|                                                        |
| ------------------------------------------------------ |
|  LIVE LOGS                     [ Ready / Stats ]       |
|  [10:14:02] VeryBot UK initialized with humanization.  |
|  [10:14:05] Navigated: 🛍️ Product Page Detected        |
+--------------------------------------------------------+
```

### HUD Features & Controls:
1. **Compact / Small Mode (`🔍 Small` / `🔍 Large`)**:
   - Defaults to an ultra-compact `275px` width that cleanly fits laptops and high-DPI screens without blocking product images.
   - Click the toggle anytime to switch to the full `380px` layout.
2. **Minimize Bar (`➖` / `➕`)**:
   - Collapses the HUD into a sleek `235px` title bar while keeping background monitoring and checkout running continuously.
3. **Draggable Header**:
   - Click and drag anywhere on the header row to reposition the HUD anywhere on your screen.
4. **Active Page Indicator**:
   - Displays real-time context: `🌐 General Page`, `🔐 Login Page`, `🛍️ Product Page`, `🔍 Search Page`, `🛒 Basket Page`, or `💳 Checkout Page`.
5. **Color-Coded Status Dot**:
   - `🟢 Green`: Bot is active and running.
   - `🔴 Red`: Bot is stopped / idle.
6. **Live Terminal Console**:
   - Displays every event (scan progress, restock alerts, cart confirmations, errors) with exact timestamps and color coding (`#00d2ff` Info, `#28a745` Success, `#ffcc00` Warning, `#dc3545` Error).

---

## 🧠 Anti-Bot & Biometric Humanization Engine

Very.co.uk employs telemetry protection (including Akamai). VeryBot was engineered specifically to prevent behavior-based heuristic triggers and iframe collisions:

1. **Box-Muller Gaussian Delays**:
   - Rather than static intervals (e.g. exactly 5.00s), VeryBot calculates natural human reaction timings along a normal bell curve ([`gaussianRandom`](file:///c:/Users/pytho/Downloads/VERYBOT/Very%20Bot%20Script.js#L32-L41)).
2. **Non-Centered Click Coordinates**:
   - Clicks never strike the exact dead-center `(width/2, height/2)` of buttons. The bot computes randomized landing zones within `25%` to `75%` of the element's bounding rect.
3. **Micro-Jitter Mouse Movements**:
   - Simulates human approach, hover (`pointerover`, `mouseover`), natural hand tremors via micro-jitter `pointermove` and `mousemove` events, pressure latency, hold duration (45–130ms), and release.
4. **Humanized Keystroke Dynamics**:
   - Types character-by-character with individual key down/up latencies, inter-key flight times (50–160ms), and natural pauses when typing `@`, `.`, or spaces.
5. **React `_valueTracker` Synchronization**:
   - Modern React inputs ignore simple `element.value = "..."` assignments. VeryBot accesses the native prototype setter (`HTMLInputElement.prototype`) and dispatches bubbling `input` and `change` events so React state updates seamlessly.
6. **Sandboxed Iframe Shielding (`@noframes`)**:
   - Includes `@noframes` metadata and top-level execution guards (`if (window.top !== window.self) return;`). This prevents the script from executing inside hidden anti-bot iframes, completely eliminating `TypeError: Cannot redefine property: $$__...` errors.

---

## 🚀 Step-by-Step Installation Guide

### Step 1: Install a Userscript Manager
Ensure your browser has a userscript manager extension installed:
- [Tampermonkey](https://www.tampermonkey.net/) (Recommended for Chrome, Edge, Firefox, Brave, Opera)
- [Violentmonkey](https://violentmonkey.github.io/)

### Step 2: Install VeryBot Script
1. Open your browser and click on the **Tampermonkey** extension icon.
2. Select **Dashboard**, then click the **Create a new script** tab (`+`).
3. Delete all default placeholder code in the editor.
4. Open **[`Very Bot Script.js`](file:///c:/Users/pytho/Downloads/VERYBOT/Very%20Bot%20Script.js)**, copy the entire script, and paste it into Tampermonkey.
5. Press `Ctrl + S` (or click **File ➔ Save**).

### Step 3: Verify Installation
1. Navigate to [https://www.very.co.uk](https://www.very.co.uk).
2. Look in the bottom-right corner of the window. You will see the **VeryBot UK** HUD console appear.
3. If prompted by your browser, grant permission for audio and desktop notifications.

---

## 📖 Usage Workflows & How-To

### Workflow A: Monitoring a Search Page for Restocks
Use this workflow when monitoring a general category or search query (e.g. Pokémon cards, PlayStation 5, new releases):

1. Go to [https://www.very.co.uk](https://www.very.co.uk).
2. In the VeryBot HUD, switch to the **Targets** tab.
3. Paste your search URL into the **Search / Category URL to Monitor** field:
   - Example: `https://www.very.co.uk/search/pokemon`
   - Example: `https://www.very.co.uk/toys/pokemon-cards/e/b/1589,4294916892.end`
4. Check the **Auto Add & Proceed to Basket** checkbox.
5. In the **Dashboard** tab, configure your polling delays:
   - **Min Delay (s)**: `4` (recommended)
   - **Max Delay (s)**: `8` or `10`
6. Click **▶ START**.
7. The bot will poll the search page silently in the background. The HUD log will display total items scanned, in-stock count, and out-of-stock count.
8. As soon as an item becomes available, VeryBot will sound an alarm, send your webhook alerts, and automatically navigate directly to the product page.

---

### Workflow B: Direct Product Page Auto-Add & Restock Sniping
Use this workflow if you have a direct product URL that is currently Out of Stock:

1. Navigate directly to the product URL (e.g. `https://www.very.co.uk/.../1601175468.prd`).
2. In the **Targets** tab, set your desired **Target Qty per Item** (default: `1`).
3. In the **Dashboard** tab, set your desired check delays (e.g., Min `3s`, Max `6s`).
4. Click **▶ START**.
5. **If Out of Stock**: VeryBot monitors the product in the background. As soon as Very's servers indicate stock has returned, it reloads the page instantly.
6. **If In Stock**:
   - Automatically adjusts the quantity dropdown to your target.
   - Biometrically clicks **Add to Basket**.
   - Listens for the confirmation popup / modal and clicks **Go to basket** (or redirects to `/basket.page`).
   - On the basket page, clicks **Checkout securely** to lock in your order.

---

### Workflow C: Setting a Scheduled Drop Timer
Use this workflow when you know the exact time of an upcoming drop (e.g. 9:00 AM on Friday):

1. Navigate to Very.co.uk and configure your Target URL or open the target product page.
2. In the **Dashboard** tab, locate **Schedule Start**.
3. Use the date/time picker to select your target drop time.
4. Click **⏳ Set**.
5. The button will change to a live countdown timer: `🛑 (HH:MM:SS)`.
6. Leave your browser open. At the exact target second, VeryBot triggers automatically, switches to active mode, and begins monitoring/purchasing.
7. To cancel a schedule, click the countdown button again.

---

### Workflow D: Webhook Notifications Setup (Telegram & Discord)

Get notified on your phone or PC instantly the second stock is spotted:

#### 1. Setting Up Telegram:
1. Open Telegram and search for [@BotFather](https://t.me/BotFather). Send `/newbot` and follow the steps to get your **Bot Token**.
2. Search for [@userinfobot](https://t.me/userinfobot) and send `/start` to retrieve your personal **Chat ID**.
3. Open the **Profile** tab in the VeryBot HUD.
4. Check **Enable Telegram**.
5. Paste your **Telegram Bot Token** and **Telegram Chat ID**.

#### 2. Setting Up Discord:
1. Open Discord, open your server, and click **Server Settings ➔ Integrations ➔ Webhooks**.
2. Click **New Webhook**, name it "VeryBot Alerts", and copy the **Webhook URL**.
3. Open the **Profile** tab in the VeryBot HUD.
4. Check **Enable Discord** and paste your webhook URL.

#### 3. Test & Save:
1. Click **🔔 Test Notifications**. You will hear the 880 Hz chime and receive test messages on Telegram/Discord.
2. Click **💾 Save Everything**.

---

## 🛠️ DOM Selectors & Technical Reference

Very.co.uk is built on an internal design framework called **Fuse**. VeryBot targets these verified selectors:

| Component | Selector(s) | Purpose |
|---|---|---|
| **Add to Basket Button** | `#primaryAddToBasket`<br>`button.fuse-button`<br>`button._button_st30a_1` | Main action button on product pages (`.prd`). |
| **Quantity Dropdown** | `select[name="quantity"]`<br>`select.fuse-dropdown__select` | Selects order item quantity. |
| **Go to Basket Modal** | `a[href*="/basket"]`<br>`button[class*="fuse-button"]` | Triggered by mini-basket popup after adding. |
| **Checkout Securely** | `button._button_st30a_1.fuse-button`<br>`button[data-testid="checkout-button"]` | Proceed to checkout on `/basket.page`. |
| **Search Products** | `a[href*=".prd"]`<br>`div[class*="fuse-product-card"]` | Product cards parsed during search scan. |
| **Login Inputs** | `input.fuse-input-field__input`<br>`input[name="accountNumber"]`<br>`input[name="password"]`<br>`input[name="postcode"]` | Credentials input on `/account/login`. |
| **Sign In Button** | `button.fuse-styled-button`<br>`button.fuse-button[type="submit"]` | Submits login credentials. |
| **Cookie Banner** | `#onetrust-accept-btn-handler` | Dismisses OneTrust privacy consent banner. |

---

## 💾 Settings & Storage Reference

All settings are persisted across browser restarts and page navigations in your browser's `localStorage` and `sessionStorage`:

| Key | Storage | Description |
|---|---|---|
| `very_bot_running` | `localStorage` | Active execution flag (`true` or `false`). |
| `very_bot_search_url` | `localStorage` | Search or category URL to monitor. |
| `very_bot_auto_buy` | `localStorage` | Automatically add to basket and proceed. |
| `very_bot_target_qty` | `localStorage` | Number of units to add (1–10). |
| `very_bot_min_delay` | `localStorage` | Minimum random delay interval (seconds). |
| `very_bot_max_delay` | `localStorage` | Maximum random delay interval (seconds). |
| `very_bot_email` | `localStorage` | Saved Very account number or email. |
| `very_bot_pass` | `localStorage` | Saved Very account password. |
| `very_bot_postcode` | `localStorage` | Saved postcode (for login verification). |
| `very_bot_tg_enabled` | `localStorage` | Telegram webhook toggle (`true`/`false`). |
| `very_bot_tg_token` | `localStorage` | Telegram Bot API token. |
| `very_bot_tg_chat` | `localStorage` | Telegram chat ID destination. |
| `very_bot_discord_enabled` | `localStorage` | Discord webhook toggle (`true`/`false`). |
| `very_bot_discord_webhook` | `localStorage` | Discord webhook URL. |
| `very_bot_size_mode` | `localStorage` | HUD sizing mode (`small` or `normal`). |
| `very_bot_minimized` | `localStorage` | HUD collapsed state (`true` or `false`). |
| `very_bot_known_products` | `sessionStorage` | In-memory cache of scanned product availability. |

---

## 💡 Best Practices for High-Contention Drops

1. **Pre-Login to Very.co.uk**:
   - Always log in manually 10–15 minutes before high-demand drop events. This ensures your delivery addresses and stored payment methods are active and cached.
2. **Keep the Browser Window Active**:
   - Modern browsers (Chrome, Edge) throttle JavaScript timers in minimized or background windows. Keep your browser window visible on screen or on a secondary monitor.
3. **Avoid Aggressive Polling Delays**:
   - Setting delays below 2 seconds can trigger Akamai rate-limiting or challenge screens. A setting of **3 to 7 seconds** provides maximum responsiveness while remaining indistinguishable from human browsing.
4. **Use Scheduled Start**:
   - For scheduled release times (e.g. 9:00:00 AM), set the scheduler in the Dashboard tab 2 minutes before the drop. This eliminates manual clicking and guarantees the bot starts monitoring at the exact second.

---

## ❓ Troubleshooting Guide

| Problem | Cause | Solution |
|---|---|---|
| **HUD does not appear** | Userscript not running or domain mismatch | Ensure Tampermonkey is enabled and the URL matches `https://www.very.co.uk/*`. Refresh the page. |
| **Console shows "TypeError: Cannot redefine property"** | Script injected into sandboxed iframe | Verify your script has `// @noframes` in its header and `if (window.top !== window.self) return;` at the top of the function. |
| **Login inputs not registering text** | React value tracker not updating | VeryBot includes a built-in React value tracker fix (`_valueTracker.setValue`). If altered, restore the original function from [`Very Bot Script.js`](file:///c:/Users/pytho/Downloads/VERYBOT/Very%20Bot%20Script.js). |
| **Search scan returns HTTP 403** | Missing session cookies | VeryBot uses browser-native `fetch(..., { credentials: 'include' })` so active cookies are sent. Ensure you have visited Very.co.uk normally first. |
| **No audio alert sounds** | Browser autoplay policy blocked audio | Click anywhere on the webpage once after loading. Browsers require at least one user interaction before allowing audio synthesis. |
| **Discord or Telegram webhook fails** | Invalid token, webhook URL, or permissions | Test using the **🔔 Test Notifications** button. Check the browser developer console (`F12`) for HTTP error codes. Ensure Tampermonkey granted `GM_xmlhttpRequest`. |

---

## 📄 License & Disclaimer

*Disclaimer: This tool is developed for educational and personal automation purposes. Users are responsible for adhering to the terms of service of the target website.*
#   V e r y . c o . u k - B o t - S c r i p t  
 