// ==UserScript==
// @name         Very.co.uk Bot Script
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Advanced automation bot for very.co.uk with UI Console, Search Monitor, Auto-Add to Basket, Login Autofill, Full Checkout Automation & Webhooks
// @author       Pythonic Shariful
// @match        https://www.very.co.uk/*
// @match        https://flex.cybersource.com/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    const isTop = (window.top === window.self);
    const isCybersourceFrame = window.location.hostname.includes('flex.cybersource.com');

    // Strictly prevent running inside unknown sandboxed/hidden tracking or anti-bot iframes or about:blank
    if (!isTop && !isCybersourceFrame) {
        return;
    }

    // =========================================================================
    // 0. ADVANCED HUMANIZATION UTILITIES & BIOMETRIC SIMULATION
    // =========================================================================

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Box-Muller Gaussian normal distribution random number generator
    function gaussianRandom(mean, stdDev, min = null, max = null) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        let result = mean + num * stdDev;
        if (min !== null && result < min) result = min;
        if (max !== null && result > max) result = max;
        return result;
    }

    // Realistic non-centered click coordinates inside element boundaries
    function getRandomElementCoordinates(element) {
        const rect = element.getBoundingClientRect();
        const offsetX = rect.width * (0.25 + Math.random() * 0.5);
        const offsetY = rect.height * (0.25 + Math.random() * 0.5);
        
        const clientX = Math.round(rect.left + offsetX);
        const clientY = Math.round(rect.top + offsetY);
        const pageX = clientX + window.scrollX;
        const pageY = clientY + window.scrollY;
        const screenX = clientX + (window.screenX || 0);
        const screenY = clientY + (window.screenY || 0);

        return { clientX, clientY, pageX, pageY, screenX, screenY, rect };
    }

    function getInputDeviceCaps() {
        try {
            return window.InputDeviceCapabilities ? new InputDeviceCapabilities({ firesTouchEvents: false }) : null;
        } catch (e) {
            return null;
        }
    }

    // Multi-event human click (PointerEvent + MouseEvent + Micro-jitters + Focus)
    async function simulateHumanClick(element) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isInViewport) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            await sleep(gaussianRandom(280, 40, 200, 420));
        }

        const coords = getRandomElementCoordinates(element);
        const sc = getInputDeviceCaps();
        const eventInit = {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: coords.clientX,
            clientY: coords.clientY,
            screenX: coords.screenX,
            screenY: coords.screenY,
            pageX: coords.pageX,
            pageY: coords.pageY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            pressure: 0.5,
            width: 1,
            height: 1,
            sourceCapabilities: sc
        };

        // Approach & Hover
        element.dispatchEvent(new PointerEvent('pointerover', eventInit));
        element.dispatchEvent(new PointerEvent('pointerenter', { ...eventInit, bubbles: false }));
        element.dispatchEvent(new MouseEvent('mouseover', eventInit));
        element.dispatchEvent(new MouseEvent('mouseenter', { ...eventInit, bubbles: false }));
        
        // Micro-jitter movements
        for (let i = 0; i < 2; i++) {
            const jitterX = coords.clientX + (Math.random() * 4 - 2);
            const jitterY = coords.clientY + (Math.random() * 4 - 2);
            element.dispatchEvent(new PointerEvent('pointermove', { ...eventInit, clientX: jitterX, clientY: jitterY }));
            element.dispatchEvent(new MouseEvent('mousemove', { ...eventInit, clientX: jitterX, clientY: jitterY }));
            await sleep(gaussianRandom(20, 5, 10, 35));
        }

        // Press Down
        await sleep(gaussianRandom(35, 8, 15, 65));
        element.dispatchEvent(new PointerEvent('pointerdown', { ...eventInit, buttons: 1 }));
        element.dispatchEvent(new MouseEvent('mousedown', { ...eventInit, buttons: 1 }));
        
        if (typeof element.focus === 'function') {
            element.focus();
        }

        // Hold Duration
        await sleep(gaussianRandom(75, 15, 45, 130));

        // Release
        element.dispatchEvent(new PointerEvent('pointerup', { ...eventInit, buttons: 0 }));
        element.dispatchEvent(new MouseEvent('mouseup', { ...eventInit, buttons: 0 }));
        element.dispatchEvent(new MouseEvent('click', { ...eventInit, buttons: 0 }));

        await sleep(gaussianRandom(80, 20, 40, 160));
    }

    // Robust React & Native Input Value Synchronization
    function setReactInputValue(element, val) {
        if (!element) return;
        val = String(val ?? '');
        try {
            const proto = window.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (element._valueTracker) {
                element._valueTracker.setValue('__val__' + Math.random());
            }
            if (setter) {
                setter.call(element, val);
            } else {
                element.value = val;
            }
            element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: val, inputType: 'insertText' }));
            element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        } catch (e) {
            element.value = val;
        }
    }

    // Realistic human typing with key events, flight latency, and React input value tracker sync
    async function simulateHumanType(element, text) {
        if (!element || text === undefined || text === null) return;
        text = String(text);

        try {
            element.focus();
        } catch (e) {}

        await simulateHumanClick(element);
        await sleep(gaussianRandom(120, 25, 60, 200));
        
        // Clear existing value
        try {
            element.select();
        } catch (e) {}
        setReactInputValue(element, "");
        await sleep(gaussianRandom(80, 20, 40, 140));

        let currentVal = "";
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            currentVal += char;
            const keyCode = char.charCodeAt(0);
            const sc = getInputDeviceCaps();

            const keyEventInit = {
                key: char,
                code: isNaN(char) ? `Key${char.toUpperCase()}` : `Digit${char}`,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true,
                composed: true,
                sourceCapabilities: sc
            };

            element.dispatchEvent(new KeyboardEvent('keydown', keyEventInit));
            element.dispatchEvent(new KeyboardEvent('keypress', keyEventInit));

            // Sync with React synthetic tracker on each keystroke
            setReactInputValue(element, currentVal);

            // Key press hold duration
            await sleep(gaussianRandom(45, 10, 25, 80));

            element.dispatchEvent(new KeyboardEvent('keyup', keyEventInit));

            // Inter-key latency
            let flightTime = gaussianRandom(75, 15, 40, 140);
            if (char === ' ' || char === '@' || char === '.') {
                flightTime += gaussianRandom(80, 20, 40, 150);
            } else if (Math.random() < 0.1) {
                flightTime += gaussianRandom(60, 15, 25, 110);
            }
            await sleep(flightTime);
        }

        // Final sync check
        setReactInputValue(element, text);

        await sleep(gaussianRandom(140, 25, 80, 240));
        element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        element.blur();
        element.dispatchEvent(new Event('blur', { bubbles: true }));

        await sleep(gaussianRandom(160, 30, 80, 260));
    }

    // Dropdown selection with React trigger
    async function simulateHumanSelect(selectElement, targetValue) {
        if (!selectElement || targetValue === undefined || targetValue === null) return;
        targetValue = String(targetValue).trim();

        await simulateHumanClick(selectElement);
        await sleep(gaussianRandom(200, 30, 140, 300));

        const options = Array.from(selectElement.options || []);
        const targetOption = options.find(o => 
            o.value === targetValue || 
            o.text.trim().toLowerCase() === targetValue.toLowerCase() ||
            o.text.trim().toLowerCase().includes(targetValue.toLowerCase())
        );

        const finalValue = targetOption ? targetOption.value : targetValue;

        if (targetOption) {
            options.forEach(o => o.selected = false);
            targetOption.selected = true;
            selectElement.selectedIndex = targetOption.index;
        }

        const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
        if (selectElement._valueTracker) {
            selectElement._valueTracker.setValue('__old_val__' + Math.random());
        }

        if (nativeSelectValueSetter) {
            nativeSelectValueSetter.call(selectElement, finalValue);
        } else {
            selectElement.value = finalValue;
        }

        selectElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        selectElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

        selectElement.blur();
        selectElement.dispatchEvent(new Event('blur', { bubbles: true }));

        await sleep(gaussianRandom(220, 40, 140, 360));
    }

    // =========================================================================
    // 1. NOTIFICATIONS & WEBHOOKS
    // =========================================================================

    function sendDiscordNotification(message) {
        const webhookUrl = localStorage.getItem('very_bot_discord_webhook') || '';
        if (!webhookUrl) return;

        if (typeof GM_xmlhttpRequest !== 'undefined') {
            GM_xmlhttpRequest({
                method: "POST",
                url: webhookUrl,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    content: message,
                    username: "Very Bot UK",
                    avatar_url: "https://www.very.co.uk/favicon.ico"
                }),
                onload: function(response) {
                    if (response.status < 200 || response.status >= 300) {
                        console.error("Discord error:", response.responseText);
                    }
                }
            });
        }
    }

    function sendTelegramNotification(message) {
        const token = localStorage.getItem('very_bot_tg_token') || '';
        const chatId = localStorage.getItem('very_bot_tg_chat') || '';
        if (!token || !chatId) return;

        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        if (typeof GM_xmlhttpRequest !== 'undefined') {
            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "HTML"
                }),
                onload: function(response) {
                    if (response.status < 200 || response.status >= 300) {
                        console.error("Telegram error:", response.responseText);
                    }
                }
            });
        }
    }

    function notifyUser(title, body, url = null) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') new Notification(title, { body: body });
            });
        }

        // Audio chime alert
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
        
        const tgEnabled = localStorage.getItem('very_bot_tg_enabled') === 'true';
        const discordEnabled = localStorage.getItem('very_bot_discord_enabled') === 'true';
        
        let messageText = `🛍️ <b>${title}</b>\n${body}`;
        if (url) messageText += `\n\n🔗 <a href="${url}">${url}</a>`;

        if (tgEnabled) sendTelegramNotification(messageText);
        if (discordEnabled) {
            let discordMsg = `🛍️ **${title}**\n${body}`;
            if (url) discordMsg += `\n\n🔗 ${url}`;
            sendDiscordNotification(discordMsg);
        }
    }

    // =========================================================================
    // 2. UI CONSOLE & DASHBOARD HUD
    // =========================================================================

    let uiContainer = null;
    let consoleContainer = null;
    let lastUrl = '';
    let isBotRunning = false;
    let botActionInProgress = false;

    function logToConsole(message, type = 'info') {
        if (!consoleContainer) return;
        
        const time = new Date().toLocaleTimeString();
        let color = '#ccc';
        if (type === 'success') color = '#28a745';
        if (type === 'error') color = '#dc3545';
        if (type === 'warning') color = '#ffcc00';
        if (type === 'info') color = '#00d2ff';
        
        const logLine = document.createElement('div');
        logLine.style.color = color;
        logLine.style.marginBottom = '6px';
        logLine.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
        logLine.style.paddingBottom = '4px';
        logLine.innerHTML = `<span style="color: #666; font-size: 11px;">[${time}]</span> ${message}`;
        
        consoleContainer.appendChild(logLine);
        consoleContainer.scrollTop = consoleContainer.scrollHeight;
    }

    function initUI() {
        if (!document.getElementById('very-bot-dynamic-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'very-bot-dynamic-styles';
            styleEl.textContent = `
                /* VeryBot UK Dynamic & Responsive Size Styles */
                #very-bot-script-ui {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(15, 23, 42, 0.88);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    color: #f8fafc;
                    padding: 16px;
                    border-radius: 14px;
                    z-index: 999999;
                    font-family: "Inter", system-ui, -apple-system, sans-serif;
                    font-size: 13px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
                    pointer-events: auto;
                    width: 380px;
                    border: 1px solid rgba(255,255,255,0.15);
                    max-height: 90vh;
                    overflow-y: auto;
                    transition: width 0.25s ease, padding 0.25s ease, font-size 0.25s ease;
                }

                /* SMALL / COMPACT MODE (Default - fits cleanly on laptops without blocking) */
                #very-bot-script-ui.bot-size-small {
                    width: 275px !important;
                    padding: 10px 12px !important;
                    font-size: 11px !important;
                    border-radius: 12px !important;
                    max-height: 84vh !important;
                }
                #very-bot-script-ui.bot-size-small .bot-header-title {
                    font-size: 13px !important;
                }
                #very-bot-script-ui.bot-size-small .bot-header-row {
                    margin-bottom: 8px !important;
                    padding-bottom: 6px !important;
                }
                #very-bot-script-ui.bot-size-small .bot-tab-nav {
                    gap: 10px !important;
                    margin-bottom: 8px !important;
                }
                #very-bot-script-ui.bot-size-small .bot-tab-btn {
                    font-size: 10.5px !important;
                    padding-bottom: 4px !important;
                }
                #very-bot-script-ui.bot-size-small .bot-action-row {
                    gap: 8px !important;
                    margin-bottom: 8px !important;
                }
                #very-bot-script-ui.bot-size-small #botStartBtn,
                #very-bot-script-ui.bot-size-small #botStopBtn {
                    padding: 8px !important;
                    font-size: 12px !important;
                }
                #very-bot-script-ui.bot-size-small .bot-grid-box {
                    gap: 6px !important;
                    margin-bottom: 8px !important;
                }
                #very-bot-script-ui.bot-size-small .bot-card-inner {
                    padding: 6px 8px !important;
                }
                #very-bot-script-ui.bot-size-small input {
                    padding: 5px 6px !important;
                    font-size: 11px !important;
                    margin-bottom: 6px !important;
                }
                #very-bot-script-ui.bot-size-small button {
                    padding: 6px 10px !important;
                    font-size: 11px !important;
                }
                #very-bot-script-ui.bot-size-small #tab-profile {
                    max-height: 200px !important;
                }
                #very-bot-script-ui.bot-size-small .bot-console-section {
                    margin-top: 8px !important;
                    padding-top: 6px !important;
                }
                #very-bot-script-ui.bot-size-small #botConsole {
                    height: 80px !important;
                    font-size: 9.5px !important;
                    padding: 6px 8px !important;
                }

                /* MINIMIZED SLIM BAR */
                #very-bot-script-ui.bot-minimized {
                    width: 235px !important;
                    padding: 8px 12px !important;
                    max-height: none !important;
                    overflow: visible !important;
                }
                #very-bot-script-ui.bot-minimized .bot-collapsible-area {
                    display: none !important;
                }
                #very-bot-script-ui.bot-minimized .bot-header-row {
                    margin-bottom: 0 !important;
                    padding-bottom: 0 !important;
                    border-bottom: none !important;
                }
            `;
            document.head.appendChild(styleEl);
        }

        if (document.getElementById('very-bot-script-ui')) return;

        uiContainer = document.createElement('div');
        uiContainer.id = 'very-bot-script-ui';
        document.body.appendChild(uiContainer);
        
        uiContainer.innerHTML = `
            <!-- Header (Draggable) -->
            <div class="bot-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; cursor: move; user-select: none;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 8px #ef4444;" id="botStatusDot"></div>
                    <div class="bot-header-title" style="font-size: 15px; font-weight: 800; background: linear-gradient(90deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.5px;">VeryBot UK</div>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button id="botSizeToggleBtn" title="Toggle Small / Normal size" style="cursor: pointer; background: rgba(236, 72, 153, 0.2); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.4); border-radius: 5px; padding: 2px 6px; font-size: 10px; font-weight: 700; transition: 0.2s;">🔍 Small</button>
                    <button id="botMinToggleBtn" title="Minimize / Expand" style="cursor: pointer; background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); border-radius: 5px; padding: 2px 6px; font-size: 10px; font-weight: 700; transition: 0.2s;">➖</button>
                    <div id="botPageType" style="font-size: 10px; font-weight: 600; color: #cbd5e1; background: rgba(255,255,255,0.1); padding: 3px 6px; border-radius: 6px;">🌐 Init</div>
                </div>
            </div>

            <div class="bot-collapsible-area">
                <!-- Tabs Navigation -->
                <div class="bot-tab-nav" style="display: flex; gap: 14px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div class="bot-tab-btn" data-target="tab-dash" style="cursor: pointer; padding-bottom: 6px; font-size: 12px; font-weight: 600; color: #ec4899; border-bottom: 2px solid #ec4899; transition: 0.2s;">Dashboard</div>
                    <div class="bot-tab-btn" data-target="tab-target" style="cursor: pointer; padding-bottom: 6px; font-size: 12px; font-weight: 600; color: #94a3b8; border-bottom: none; transition: 0.2s;">Targets</div>
                    <div class="bot-tab-btn" data-target="tab-profile" style="cursor: pointer; padding-bottom: 6px; font-size: 12px; font-weight: 600; color: #94a3b8; border-bottom: none; transition: 0.2s;">Profile</div>
                </div>

                <!-- TAB 1: DASHBOARD -->
                <div id="tab-dash" class="bot-tab-pane" style="display: block;">
                    <div class="bot-action-row" style="display: flex; gap: 10px; margin-bottom: 12px;">
                        <button id="botStartBtn" style="flex: 1; padding: 10px; cursor: pointer; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: transform 0.1s;">▶ START</button>
                        <button id="botStopBtn" style="flex: 1; padding: 10px; cursor: pointer; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); transition: transform 0.1s;">⏹ STOP</button>
                    </div>

                    <div class="bot-grid-box" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                        <div class="bot-card-inner" style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 8px;">
                            <label style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Min Delay (s)</label>
                            <input type="number" id="botMinDelay" value="4" min="1" max="300" style="width: 100%; box-sizing: border-box; margin-top: 3px; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); outline: none;" />
                        </div>
                        <div class="bot-card-inner" style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 8px;">
                            <label style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Max Delay (s)</label>
                            <input type="number" id="botMaxDelay" value="10" min="1" max="300" style="width: 100%; box-sizing: border-box; margin-top: 3px; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); outline: none;" />
                        </div>
                    </div>

                    <div class="bot-card-inner" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; display: flex; gap: 8px; align-items: flex-end;">
                        <div style="flex: 1;">
                            <label style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Schedule Start</label>
                            <input type="datetime-local" id="botScheduleTime" style="width: 100%; box-sizing: border-box; margin-top: 3px; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); outline: none; color-scheme: dark;" />
                        </div>
                        <button id="botScheduleBtn" style="padding: 7px 12px; cursor: pointer; background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; font-weight: 600; font-size: 11px;">⏳ Set</button>
                    </div>
                </div>

                <!-- TAB 2: TARGETS -->
                <div id="tab-target" class="bot-tab-pane" style="display: none;">
                    <div class="bot-card-inner" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                        <label style="font-size: 11px; font-weight: 600; color: #ec4899; margin-bottom: 5px; display: block;">Search / Category URL to Monitor</label>
                        <input type="text" id="botSearchUrl" placeholder="https://www.very.co.uk/search/pokemon" style="width: 100%; box-sizing: border-box; padding: 6px 8px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px; margin-bottom: 10px;" />
                        
                        <div style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
                            <input type="checkbox" id="botAutoBuy" style="cursor: pointer;" checked>
                            <label for="botAutoBuy" style="font-size: 11.5px; font-weight: 600; color: #10b981; cursor: pointer;">Auto Add & Proceed to Basket</label>
                        </div>
                    </div>
                    
                    <div class="bot-card-inner" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
                        <label style="font-size: 10px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; display: block; text-transform: uppercase;">Target Qty per Item</label>
                        <input type="number" id="botTargetQty" value="1" min="1" max="10" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); outline: none;" />
                    </div>
                </div>

                <!-- TAB 3: PROFILE -->
                <div id="tab-profile" class="bot-tab-pane" style="display: none; max-height: 260px; overflow-y: auto; padding-right: 4px;">
                    <div style="font-size: 10px; font-weight: 700; color: #ec4899; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase;">Very.co.uk Login Credentials</div>
                    <input type="text" id="p_email" placeholder="Account Number or Email" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px; margin-bottom: 6px;" />
                    <input type="password" id="p_password" placeholder="Password" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px; margin-bottom: 6px;" />
                    <input type="text" id="p_postcode" placeholder="Postcode (if requested)" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px; margin-bottom: 12px;" />

                    <div style="font-size: 10px; font-weight: 700; color: #10b981; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase;">💳 Checkout & Card Details</div>
                    <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                        <div style="flex: 1;">
                            <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">Security Code (CVV)</label>
                            <input type="password" id="p_card_cvv" placeholder="e.g. 123" maxlength="4" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px;" />
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">Account Address?</label>
                            <select id="p_card_address" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px;">
                                <option value="Yes">Yes (Registered)</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; margin-bottom: 12px; align-items: center;">
                        <input type="checkbox" id="p_auto_paynow" style="cursor: pointer;" checked />
                        <label for="p_auto_paynow" style="font-size: 11px; color: #cbd5e1; cursor: pointer;">Auto Click "Pay now"</label>
                    </div>

                    <div style="font-size: 10px; font-weight: 700; color: #a855f7; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase;">Notifications (Webhooks)</div>
                    <div style="display: flex; gap: 6px; margin-bottom: 6px; align-items: center;">
                        <input type="checkbox" id="p_tg_enabled" style="cursor: pointer;" />
                        <label for="p_tg_enabled" style="font-size: 11px; color: #cbd5e1; cursor: pointer;">Enable Telegram</label>
                    </div>
                    <input type="text" id="p_tg_token" placeholder="Telegram Bot Token" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px; margin-bottom: 6px;" />
                    <input type="text" id="p_tg_chat" placeholder="Telegram Chat ID" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px; margin-bottom: 10px;" />
                    
                    <div style="display: flex; gap: 6px; margin-bottom: 6px; align-items: center;">
                        <input type="checkbox" id="p_discord_enabled" style="cursor: pointer;" />
                        <label for="p_discord_enabled" style="font-size: 11px; color: #cbd5e1; cursor: pointer;">Enable Discord</label>
                    </div>
                    <input type="text" id="p_discord_webhook" placeholder="Discord Webhook URL" style="width: 100%; box-sizing: border-box; padding: 6px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; outline: none; font-size: 11px; margin-bottom: 10px;" />
                    <button id="botTestNotifBtn" style="width: 100%; padding: 7px; background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px; margin-bottom: 10px;">🔔 Test Notifications</button>

                    <button id="botSaveSettingsBtn" style="width: 100%; padding: 9px; background: rgba(236, 72, 153, 0.2); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.5); border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px;">💾 Save Everything</button>
                </div>

                <!-- Persistent Live Console -->
                <div class="bot-console-section" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Live Logs</span>
                        <span id="botStatsCounter" style="font-size: 9.5px; font-weight: 600; color: #ec4899; background: rgba(236, 72, 153, 0.1); padding: 2px 5px; border-radius: 4px;">Ready</span>
                    </div>
                    <div id="botConsole" style="background: rgba(0,0,0,0.6); border-radius: 6px; padding: 8px; height: 130px; overflow-y: auto; font-family: 'Fira Code', 'Consolas', monospace; font-size: 10.5px; border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(uiContainer);
        consoleContainer = document.getElementById('botConsole');

        // Size Toggle Logic
        const sizeBtn = document.getElementById('botSizeToggleBtn');
        const minBtn = document.getElementById('botMinToggleBtn');

        function applySizeMode(mode) {
            if (mode === 'small') {
                uiContainer.classList.add('bot-size-small');
                if (sizeBtn) sizeBtn.innerHTML = '🔍 Large';
            } else {
                uiContainer.classList.remove('bot-size-small');
                if (sizeBtn) sizeBtn.innerHTML = '🔍 Small';
            }
            localStorage.setItem('very_bot_size_mode', mode);
        }

        const savedSizeMode = localStorage.getItem('very_bot_size_mode') || 'small';
        applySizeMode(savedSizeMode);

        sizeBtn?.addEventListener('click', () => {
            const isSmall = uiContainer.classList.contains('bot-size-small');
            const newMode = isSmall ? 'normal' : 'small';
            applySizeMode(newMode);
            logToConsole(`UI size switched to ${newMode.toUpperCase()}`, 'info');
        });

        minBtn?.addEventListener('click', () => {
            const isMin = uiContainer.classList.toggle('bot-minimized');
            minBtn.innerHTML = isMin ? '➕' : '➖';
            localStorage.setItem('very_bot_minimized', isMin ? 'true' : 'false');
        });

        if (localStorage.getItem('very_bot_minimized') === 'true') {
            uiContainer.classList.add('bot-minimized');
            if (minBtn) minBtn.innerHTML = '➕';
        }

        // Draggable Header
        const headerEl = uiContainer.querySelector('.bot-header-row');
        if (headerEl) {
            let isDragging = false;
            let startX, startY, startRight, startBottom;

            headerEl.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = uiContainer.getBoundingClientRect();
                startRight = window.innerWidth - rect.right;
                startBottom = window.innerHeight - rect.bottom;
                e.preventDefault();
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                uiContainer.style.right = Math.max(0, startRight - dx) + 'px';
                uiContainer.style.bottom = Math.max(0, startBottom - dy) + 'px';
            });

            window.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }

        // Tab Switching
        const tabs = uiContainer.querySelectorAll('.bot-tab-btn');
        const panes = uiContainer.querySelectorAll('.bot-tab-pane');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.style.borderBottom = 'none';
                    t.style.color = '#94a3b8';
                });
                panes.forEach(p => p.style.display = 'none');
                
                tab.style.borderBottom = '2px solid #ec4899';
                tab.style.color = '#ec4899';
                document.getElementById(tab.dataset.target).style.display = 'block';
            });
        });

        // Load Persistent Settings
        const p_email = document.getElementById('p_email');
        const p_password = document.getElementById('p_password');
        const p_postcode = document.getElementById('p_postcode');
        const botSearchUrl = document.getElementById('botSearchUrl');
        const botAutoBuy = document.getElementById('botAutoBuy');
        const botTargetQty = document.getElementById('botTargetQty');
        const botMinDelay = document.getElementById('botMinDelay');
        const botMaxDelay = document.getElementById('botMaxDelay');

        const p_tg_enabled = document.getElementById('p_tg_enabled');
        const p_tg_token = document.getElementById('p_tg_token');
        const p_tg_chat = document.getElementById('p_tg_chat');
        const p_discord_enabled = document.getElementById('p_discord_enabled');
        const p_discord_webhook = document.getElementById('p_discord_webhook');
        const p_card_cvv = document.getElementById('p_card_cvv');
        const p_card_address = document.getElementById('p_card_address');
        const p_auto_paynow = document.getElementById('p_auto_paynow');

        if (p_email) p_email.value = localStorage.getItem('very_bot_email') || 'masudranadarkwolf@gmail.com';
        if (p_password) p_password.value = localStorage.getItem('very_bot_pass') || 'Hacktanha24';
        if (p_postcode) p_postcode.value = localStorage.getItem('very_bot_postcode') || '';
        if (botSearchUrl) botSearchUrl.value = localStorage.getItem('very_bot_search_url') || 'https://www.very.co.uk/search/pokemon';
        if (botAutoBuy) botAutoBuy.checked = localStorage.getItem('very_bot_auto_buy') !== 'false';
        if (botTargetQty) botTargetQty.value = localStorage.getItem('very_bot_target_qty') || '1';
        if (botMinDelay) botMinDelay.value = localStorage.getItem('very_bot_min_delay') || '4';
        if (botMaxDelay) botMaxDelay.value = localStorage.getItem('very_bot_max_delay') || '10';

        if (p_card_cvv) p_card_cvv.value = localStorage.getItem('very_bot_cvv') || (typeof GM_getValue !== 'undefined' ? GM_getValue('very_bot_cvv', '') : '') || '';
        if (p_card_address) p_card_address.value = localStorage.getItem('very_bot_card_address') || 'Yes';
        if (p_auto_paynow) p_auto_paynow.checked = localStorage.getItem('very_bot_auto_paynow') !== 'false';

        if (p_tg_enabled) p_tg_enabled.checked = localStorage.getItem('very_bot_tg_enabled') === 'true';
        if (p_tg_token) p_tg_token.value = localStorage.getItem('very_bot_tg_token') || '';
        if (p_tg_chat) p_tg_chat.value = localStorage.getItem('very_bot_tg_chat') || '';
        if (p_discord_enabled) p_discord_enabled.checked = localStorage.getItem('very_bot_discord_enabled') === 'true';
        if (p_discord_webhook) p_discord_webhook.value = localStorage.getItem('very_bot_discord_webhook') || '';

        // Save Settings Event
        document.getElementById('botSaveSettingsBtn')?.addEventListener('click', () => {
            localStorage.setItem('very_bot_email', p_email.value.trim());
            localStorage.setItem('very_bot_pass', p_password.value.trim());
            localStorage.setItem('very_bot_postcode', p_postcode.value.trim());
            localStorage.setItem('very_bot_search_url', botSearchUrl.value.trim());
            localStorage.setItem('very_bot_auto_buy', botAutoBuy.checked);
            localStorage.setItem('very_bot_target_qty', botTargetQty.value);
            localStorage.setItem('very_bot_min_delay', botMinDelay.value);
            localStorage.setItem('very_bot_max_delay', botMaxDelay.value);

            localStorage.setItem('very_bot_cvv', p_card_cvv.value.trim());
            localStorage.setItem('very_bot_card_address', p_card_address.value);
            localStorage.setItem('very_bot_auto_paynow', p_auto_paynow.checked);

            if (typeof GM_setValue !== 'undefined') {
                GM_setValue('very_bot_cvv', p_card_cvv.value.trim());
                GM_setValue('very_bot_card_address', p_card_address.value);
                GM_setValue('very_bot_auto_paynow', p_auto_paynow.checked);
            }

            localStorage.setItem('very_bot_tg_enabled', p_tg_enabled.checked);
            localStorage.setItem('very_bot_tg_token', p_tg_token.value.trim());
            localStorage.setItem('very_bot_tg_chat', p_tg_chat.value.trim());
            localStorage.setItem('very_bot_discord_enabled', p_discord_enabled.checked);
            localStorage.setItem('very_bot_discord_webhook', p_discord_webhook.value.trim());

            logToConsole("Settings saved successfully.", "success");
        });

        // Test Notifications
        document.getElementById('botTestNotifBtn')?.addEventListener('click', () => {
            notifyUser("Test Notification", "This is a test notification from VeryBot UK!", window.location.href);
            logToConsole("Sent test notification.", "info");
        });

        // Start / Stop Buttons
        const startBtn = document.getElementById('botStartBtn');
        const stopBtn = document.getElementById('botStopBtn');

        startBtn?.addEventListener('click', () => {
            if (!isBotRunning) {
                isBotRunning = true;
                localStorage.setItem('very_bot_running', 'true');
                if (typeof GM_setValue !== 'undefined') GM_setValue('very_bot_running', true);
                logToConsole("Bot started.", "success");
                updateButtons();
            }
        });

        stopBtn?.addEventListener('click', () => {
            if (isBotRunning) {
                isBotRunning = false;
                localStorage.setItem('very_bot_running', 'false');
                if (typeof GM_setValue !== 'undefined') GM_setValue('very_bot_running', false);
                botActionInProgress = false;
                logToConsole("Bot stopped.", "error");
                updateButtons();
            }
        });

        // Scheduler Button
        const scheduleBtn = document.getElementById('botScheduleBtn');
        const scheduleTimeInput = document.getElementById('botScheduleTime');
        if (scheduleBtn && scheduleTimeInput) {
            scheduleBtn.addEventListener('click', () => {
                if (window.botScheduledInterval) {
                    clearInterval(window.botScheduledInterval);
                    window.botScheduledInterval = null;
                    scheduleBtn.innerText = "⏳ Set";
                    logToConsole("Schedule cancelled.", "warning");
                    return;
                }

                const targetTime = new Date(scheduleTimeInput.value).getTime();
                if (!targetTime || isNaN(targetTime) || targetTime <= Date.now()) {
                    logToConsole("⚠️ Invalid schedule time.", "warning");
                    return;
                }

                if (isBotRunning) {
                    isBotRunning = false;
                    localStorage.setItem('very_bot_running', 'false');
                    botActionInProgress = false;
                    updateButtons();
                }

                logToConsole(`⏳ Scheduled to start at: ${new Date(targetTime).toLocaleTimeString()}`, "info");

                window.botScheduledInterval = setInterval(() => {
                    const remainingMs = targetTime - Date.now();
                    if (remainingMs <= 0) {
                        clearInterval(window.botScheduledInterval);
                        window.botScheduledInterval = null;
                        scheduleBtn.innerText = "⏳ Set";
                        isBotRunning = true;
                        localStorage.setItem('very_bot_running', 'true');
                        logToConsole("🚀 Scheduled start triggered!", "success");
                        updateButtons();
                    } else {
                        const h = Math.floor(remainingMs / 3600000);
                        const m = Math.floor((remainingMs % 3600000) / 60000).toString().padStart(2, '0');
                        const s = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');
                        scheduleBtn.innerText = `🛑 (${h}:${m}:${s})`;
                    }
                }, 1000);
            });
        }
    }

    function updateButtons() {
        const statusDot = document.getElementById('botStatusDot');
        if (statusDot) {
            statusDot.style.background = isBotRunning ? '#10b981' : '#ef4444';
            statusDot.style.boxShadow = isBotRunning ? '0 0 8px #10b981' : '0 0 8px #ef4444';
        }
        const startBtn = document.getElementById('botStartBtn');
        const stopBtn = document.getElementById('botStopBtn');
        if (startBtn) {
            startBtn.style.opacity = isBotRunning ? '0.4' : '1';
            startBtn.disabled = isBotRunning;
        }
        if (stopBtn) {
            stopBtn.style.opacity = !isBotRunning ? '0.4' : '1';
            stopBtn.disabled = !isBotRunning;
        }
    }

    // =========================================================================
    // 3. COOKIE CONSENT BANNER AUTO-DISMISS
    // =========================================================================

    async function handleCookieBanner() {
        const acceptBtn = document.getElementById('onetrust-accept-btn-handler') ||
                          document.querySelector('button[id*="accept"], button.onetrust-close-btn-handler');
        if (acceptBtn) {
            try {
                await simulateHumanClick(acceptBtn);
                logToConsole("Dismissed cookie consent banner.", "info");
            } catch(e) {}
        }
    }

    // =========================================================================
    // 4. LOGIN PAGE AUTOMATION
    // =========================================================================

    async function executeLoginPageBot() {
        if (!isBotRunning || botActionInProgress) return;
        botActionInProgress = true;

        try {
            logToConsole("Checking Login form...", "info");
            await sleep(gaussianRandom(500, 60, 300, 800));

            const email = localStorage.getItem('very_bot_email') || 'masudranadarkwolf@gmail.com';
            const password = localStorage.getItem('very_bot_pass') || 'Hacktanha24';
            const postcode = (localStorage.getItem('very_bot_postcode') || '').trim();

            // 1. Locate Password Input (Exact selectors from Very DOM)
            const passwordInput = document.querySelector('input[data-analyticsid="login-password"], input[name="password"], input[type="password"], input[data-celebrus-password]');

            // 2. Locate Postcode Input (Exact selectors from Very DOM)
            const postcodeInput = document.querySelector('input[data-analyticsid="login-postcode"], input[name="postcode"], input[id*="postcode"]') ||
                                 Array.from(document.querySelectorAll('input')).find(i => {
                                     const nameOrId = ((i.name || '') + ' ' + (i.id || '') + ' ' + (i.getAttribute('data-analyticsid') || '')).toLowerCase();
                                     if (nameOrId.includes('postcode')) return true;
                                     const lbl = (i.closest('div')?.parentElement?.innerText || '').toLowerCase();
                                     return lbl.includes('postcode');
                                 });

            // 3. Locate Account / Email Input (Must NOT match postcode or password!)
            const accountInput = document.querySelector('input[data-analyticsid="login-account-number"], input[name="accountNumber"], input[name="email"], input[type="email"], input[autocomplete="username"]') ||
                                Array.from(document.querySelectorAll('input.fuse-input-field__input, input[type="text"]')).find(i => {
                                    if (i === postcodeInput || i === passwordInput) return false;
                                    const nameOrId = ((i.name || '') + ' ' + (i.id || '') + ' ' + (i.getAttribute('data-analyticsid') || '')).toLowerCase();
                                    if (nameOrId.includes('postcode') || nameOrId.includes('password')) return false;
                                    const lbl = (i.closest('div')?.parentElement?.innerText || '').toLowerCase();
                                    return lbl.includes('account') || lbl.includes('email');
                                });

            // 4. Locate Continue / Submit Button
            const continueBtn = document.querySelector('button[data-testid="login-continue-button"], button[data-analyticsid="login-continue"], button[data-testid="login-submit-button"]') ||
                                document.querySelector('button.fuse-styled-button, button.fuse-button[type="submit"]') ||
                                Array.from(document.querySelectorAll('button')).find(b => {
                                    const t = (b.innerText || '').trim().toLowerCase();
                                    return t.includes('continue') || t.includes('sign in') || t.includes('log in');
                                });

            let filledAny = false;

            // Step A: Account / Email (if present and visible)
            if (accountInput && accountInput.offsetParent !== null) {
                if (!accountInput.value || accountInput.value !== email) {
                    logToConsole("Filling Account / Email...", "info");
                    await simulateHumanType(accountInput, email);
                    filledAny = true;
                }
            }

            // Step B: Password (if present and visible)
            if (passwordInput && passwordInput.offsetParent !== null) {
                if (!passwordInput.value || passwordInput.value !== password) {
                    logToConsole("Filling Password...", "info");
                    await simulateHumanType(passwordInput, password);
                    filledAny = true;
                }
            }

            // Step C: Postcode (if present and visible)
            if (postcodeInput && postcodeInput.offsetParent !== null) {
                if (postcode) {
                    if (!postcodeInput.value || postcodeInput.value.toLowerCase() !== postcode.toLowerCase()) {
                        logToConsole("Filling Postcode...", "info");
                        await simulateHumanType(postcodeInput, postcode);
                        filledAny = true;
                    }
                } else {
                    logToConsole("⚠️ Postcode field detected! Enter your postcode in the Profile tab and click Save.", "warning");
                }
            }

            // Remember me checkbox
            const rememberCheckbox = document.querySelector('input.fuse-checkbox__input, input[type="checkbox"]');
            if (rememberCheckbox && !rememberCheckbox.checked) {
                try {
                    await simulateHumanClick(rememberCheckbox);
                } catch(e) {}
            }

            // Determine if ready to click Continue / Sign in
            const passwordReady = !passwordInput || (passwordInput.value && passwordInput.value.length > 0);
            const postcodeReady = !postcodeInput || !postcode || (postcodeInput.value && postcodeInput.value.length > 0);
            const accountReady = !accountInput || (accountInput.value && accountInput.value.length > 0);

            const isFormReady = (passwordInput ? (passwordReady && postcodeReady) : accountReady);

            if (continueBtn && !continueBtn.disabled && isFormReady && filledAny) {
                logToConsole("Clicking Continue / Sign In...", "success");
                await sleep(gaussianRandom(400, 50, 250, 600));
                await simulateHumanClick(continueBtn);
                try { continueBtn.click(); } catch(e) {}
                await sleep(3000);
            }
        } catch (err) {
            logToConsole("Login handler error: " + err.message, "error");
        } finally {
            botActionInProgress = false;
        }
    }

    // =========================================================================
    // 5. PRODUCT PAGE AUTOMATION (.prd)
    // =========================================================================

    let nextProductCheckTime = 0;

    async function executeProductPageBot() {
        if (!isBotRunning || botActionInProgress) return;
        botActionInProgress = true;

        const targetQty = parseInt(localStorage.getItem('very_bot_target_qty') || '1', 10);
        
        // Extract product details
        const titleEl = document.querySelector('h1, h1[class*="title"], h1[class*="fuse-heading"]');
        const title = titleEl ? titleEl.innerText.trim() : document.title;
        
        // Check Primary Add to Basket Button
        let addToBasketBtn = document.getElementById('primaryAddToBasket') || 
                             document.querySelector('button#primaryAddToBasket') ||
                             document.querySelector('button[id*="primaryAddToBasket"]');

        if (!addToBasketBtn) {
            const btns = Array.from(document.querySelectorAll('button'));
            addToBasketBtn = btns.find(b => (b.innerText || '').toLowerCase().includes('add to basket'));
        }

        const isUnavailable = !addToBasketBtn || 
                              addToBasketBtn.disabled || 
                              addToBasketBtn.getAttribute('aria-disabled') === 'true' ||
                              (addToBasketBtn.innerText || '').toLowerCase().includes('out of stock');

        if (isUnavailable) {
            // Out of stock. Check in background or reload
            const now = Date.now();
            if (now > nextProductCheckTime) {
                const minDelay = parseFloat(localStorage.getItem('very_bot_min_delay') || '4');
                const maxDelay = parseFloat(localStorage.getItem('very_bot_max_delay') || '10');
                const waitMs = (minDelay + Math.random() * (maxDelay - minDelay)) * 1000;
                nextProductCheckTime = now + waitMs;

                logToConsole(`Out of Stock: ${title.substring(0, 45)}... Checking restock in ${(waitMs/1000).toFixed(1)}s`, "warning");

                try {
                    const res = await fetch(window.location.href, { cache: 'no-store', credentials: 'include' });
                    const html = await res.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const fetchedBtn = doc.getElementById('primaryAddToBasket') ||
                                       Array.from(doc.querySelectorAll('button')).find(b => (b.textContent || '').toLowerCase().includes('add to basket'));
                    
                    const isNowInStock = fetchedBtn && !fetchedBtn.disabled && !(fetchedBtn.textContent || '').toLowerCase().includes('out of stock');
                    if (isNowInStock) {
                        logToConsole("🚨 RESTOCK DETECTED! Reloading page...", "success");
                        notifyUser("Very: Restock Detected!", title, window.location.href);
                        window.location.reload();
                        return;
                    }
                } catch(e) {
                    logToConsole("Background check failed: " + e.message, "error");
                }
            } else {
                await sleep(1500);
            }
            botActionInProgress = false;
            return;
        }

        // Adjust quantity if quantity dropdown exists
        const qtySelect = document.querySelector('select[name="quantity"], select.fuse-dropdown__select');
        if (qtySelect && targetQty > 1) {
            logToConsole(`Setting quantity to ${targetQty}...`, "info");
            await simulateHumanSelect(qtySelect, String(targetQty));
            await sleep(gaussianRandom(300, 40, 200, 500));
        }

        // Click Add to Basket
        logToConsole(`✅ Adding to basket: ${title.substring(0, 40)}`, "success");
        await sleep(gaussianRandom(400, 60, 250, 600));
        await simulateHumanClick(addToBasketBtn);
        try { addToBasketBtn.click(); } catch(e) {}

        notifyUser("Item Added to Basket!", title, window.location.href);

        // Wait for Confirmation Modal or Mini-Basket Popup
        logToConsole("Waiting for basket confirmation...", "info");
        let navigated = false;
        for (let i = 0; i < 15; i++) {
            await sleep(400);

            // Check for "Go to basket" button in modal or mini-basket
            const goToBasketBtn = document.querySelector('a[href*="/basket"], button[class*="fuse-button"]') ||
                                  Array.from(document.querySelectorAll('a, button')).find(el => {
                                      const txt = (el.innerText || '').toLowerCase();
                                      return txt.includes('go to basket') || txt.includes('view basket');
                                  });

            if (goToBasketBtn && goToBasketBtn.offsetParent !== null) {
                logToConsole("Found 'Go to basket' button. Navigating...", "success");
                await simulateHumanClick(goToBasketBtn);
                try { goToBasketBtn.click(); } catch(e) {}
                navigated = true;
                break;
            }
        }

        if (!navigated) {
            // Direct navigate to basket
            logToConsole("Navigating directly to /basket.page...", "info");
            window.location.href = 'https://www.very.co.uk/basket.page';
            return;
        }

        await sleep(2500);
        botActionInProgress = false;
    }

    // =========================================================================
    // 6. BASKET PAGE AUTOMATION (/basket or /basket.page)
    // =========================================================================

    async function executeBasketPageBot() {
        if (!isBotRunning || botActionInProgress) return;
        botActionInProgress = true;

        logToConsole("Basket page detected. Evaluating checkout...", "info");
        await sleep(gaussianRandom(800, 100, 500, 1200));

        // Locate "Checkout securely" button
        let checkoutBtn = document.querySelector('button._button_st30a_1._tappableArea_1kc19_1.fuse-button, button.fuse-button') ||
                          document.querySelector('button[data-testid="checkout-button"]') ||
                          Array.from(document.querySelectorAll('button, a')).find(b => {
                              const t = (b.innerText || '').trim().toLowerCase();
                              return t.includes('checkout securely') || t.includes('checkout');
                          });

        if (checkoutBtn && !checkoutBtn.disabled) {
            logToConsole("Clicking 'Checkout securely'...", "success");
            await simulateHumanClick(checkoutBtn);
            try { checkoutBtn.click(); } catch(e) {}
            await sleep(3000);
        } else {
            logToConsole("Waiting for Checkout securely button...", "warning");
        }

        botActionInProgress = false;
    }

    // =========================================================================
    // 7. CHECKOUT AUTOMATION (/checkout/*)
    // =========================================================================

    let lastCheckoutStep = '';
    let lastCheckoutStepTime = 0;

    async function executeCheckoutPageBot() {
        if (!isBotRunning || botActionInProgress) return;
        botActionInProgress = true;

        try {
            const currentUrl = window.location.href.toLowerCase();

            // -------------------------------------------------------------
            // STEP 1: Delivery Page (/checkout/delivery)
            // -------------------------------------------------------------
            if (currentUrl.includes('/checkout/delivery')) {
                const now = Date.now();
                if (lastCheckoutStep === 'delivery' && (now - lastCheckoutStepTime) < 4000) {
                    botActionInProgress = false;
                    return;
                }

                logToConsole("Delivery page detected. Checking for Continue button...", "info");
                await sleep(gaussianRandom(500, 60, 300, 800));

                const continueBtn = document.querySelector('button[data-testid="continue-to-payment-button"]') ||
                                    document.querySelector('button._button_st30a_1._tappableArea_1kc19_1.fuse-button[type="button"]') ||
                                    Array.from(document.querySelectorAll('button')).find(b => {
                                        const txt = (b.innerText || '').trim().toLowerCase();
                                        return (txt === 'continue' || txt.includes('continue to payment')) && b.offsetParent !== null && !b.disabled;
                                    });

                if (continueBtn && !continueBtn.disabled) {
                    logToConsole("Clicking 'Continue to payment' button...", "success");
                    lastCheckoutStep = 'delivery';
                    lastCheckoutStepTime = Date.now();
                    await simulateHumanClick(continueBtn);
                    try { continueBtn.click(); } catch(e) {}
                    await sleep(2500);
                } else {
                    logToConsole("Waiting for Continue button on Delivery page...", "warning");
                }
                botActionInProgress = false;
                return;
            }

            // -------------------------------------------------------------
            // STEP 2: Pay in Full Option (/checkout/payment/pay-in-full)
            // -------------------------------------------------------------
            if (currentUrl.includes('/checkout/payment/pay-in-full')) {
                const now = Date.now();
                if (lastCheckoutStep === 'pay-in-full' && (now - lastCheckoutStepTime) < 4000) {
                    botActionInProgress = false;
                    return;
                }

                logToConsole("Payment option page detected (Pay in full). Checking for Continue button...", "info");
                await sleep(gaussianRandom(500, 60, 300, 800));

                const continueBtn = document.querySelector('button[data-testid="payment-total-action"]') ||
                                    document.querySelector('button._button_st30a_1._tappableArea_1kc19_1.fuse-button[type="submit"]') ||
                                    Array.from(document.querySelectorAll('button')).find(b => {
                                        const txt = (b.innerText || '').trim().toLowerCase();
                                        return txt === 'continue' && b.offsetParent !== null && !b.disabled;
                                    });

                if (continueBtn && !continueBtn.disabled) {
                    logToConsole("Clicking Payment Total 'Continue' button...", "success");
                    lastCheckoutStep = 'pay-in-full';
                    lastCheckoutStepTime = Date.now();
                    await simulateHumanClick(continueBtn);
                    try { continueBtn.click(); } catch(e) {}
                    await sleep(2500);
                } else {
                    logToConsole("Waiting for Continue button on Payment option page...", "warning");
                }
                botActionInProgress = false;
                return;
            }

            // -------------------------------------------------------------
            // STEP 3: Card Details, Registered Address & Security Code (/checkout/payment/card)
            // -------------------------------------------------------------
            if (currentUrl.includes('/checkout/payment/card') || (currentUrl.includes('/checkout/payment') && document.querySelector('button[data-testid="pay-now-button"], [data-testid="card-address-yes"], #securityCode-container'))) {
                const preferredAddress = localStorage.getItem('very_bot_card_address') || 'Yes';
                const configuredCvv = localStorage.getItem('very_bot_cvv') || (typeof GM_getValue !== 'undefined' ? GM_getValue('very_bot_cvv', '') : '') || '';
                const autoPay = localStorage.getItem('very_bot_auto_paynow') !== 'false';

                // 3A. Select Card Registered Address
                const targetTestId = preferredAddress.toLowerCase() === 'no' ? 'card-address-no' : 'card-address-yes';
                const targetRadioId = preferredAddress.toLowerCase() === 'no' ? 'account-address-no' : 'account-address-yes';

                const radioInput = document.getElementById(targetRadioId) ||
                                   document.querySelector(`[data-testid="${targetTestId}"] input[type="radio"]`) ||
                                   document.querySelector(`input[name="card-address"][value="${preferredAddress}"]`);

                if (radioInput && !radioInput.checked) {
                    logToConsole(`Selecting card registered at account address: ${preferredAddress}...`, "info");
                    const clickableTarget = document.querySelector(`label[for="${targetRadioId}"]`) ||
                                           document.querySelector(`[data-testid="${targetTestId}"] label`) ||
                                           document.querySelector(`[data-testid="${targetTestId}"]`) ||
                                           radioInput;
                    await simulateHumanClick(clickableTarget);
                    radioInput.checked = true;
                    radioInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    radioInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    await sleep(gaussianRandom(350, 40, 200, 500));
                }

                // 3B. Input Security Code (CVV)
                if (!configuredCvv) {
                    logToConsole("⚠️ Card Security Code (CVV) not set! Please set CVV in Profile tab.", "warning");
                } else {
                    // Check if direct input exists in DOM
                    const directCvv = document.getElementById('securityCode') ||
                                      document.querySelector('input[name="securityCode"]') ||
                                      document.querySelector('input[aria-label="Card security code"]');

                    if (directCvv && directCvv.offsetParent !== null) {
                        if (directCvv.value !== configuredCvv) {
                            logToConsole("Entering Card Security Code directly...", "info");
                            await simulateHumanType(directCvv, configuredCvv);
                            await sleep(gaussianRandom(300, 40, 150, 450));
                        }
                    } else {
                        // CyberSource iframe
                        if (typeof GM_setValue !== 'undefined') {
                            GM_setValue('very_bot_cvv', configuredCvv);
                            GM_setValue('very_bot_fill_cvv_trigger', Date.now());
                        }
                        const iframes = document.querySelectorAll('#securityCode-container iframe, iframe[src*="cybersource"], iframe[title*="payment"]');
                        if (iframes.length > 0) {
                            iframes.forEach(f => {
                                try {
                                    f.contentWindow?.postMessage({ type: 'VERY_BOT_FILL_CVV', cvv: configuredCvv }, '*');
                                } catch(e) {}
                            });
                        }
                    }
                }

                // 3C. Click "Pay now"
                if (autoPay) {
                    const payNowBtn = document.querySelector('button[data-testid="pay-now-button"]') ||
                                      document.querySelector('button.fuse-styled-button[data-testid="pay-now-button"]') ||
                                      Array.from(document.querySelectorAll('button')).find(b => {
                                          const txt = (b.innerText || '').trim().toLowerCase();
                                          return txt === 'pay now' && b.offsetParent !== null;
                                      });

                    if (payNowBtn) {
                        const isDisabled = payNowBtn.disabled || payNowBtn.getAttribute('aria-disabled') === 'true';
                        if (!isDisabled) {
                            const now = Date.now();
                            if (lastCheckoutStep === 'pay-now' && (now - lastCheckoutStepTime) < 5000) {
                                botActionInProgress = false;
                                return;
                            }

                            logToConsole("🎉 All details ready. Clicking 'Pay now' button...", "success");
                            lastCheckoutStep = 'pay-now';
                            lastCheckoutStepTime = Date.now();
                            await sleep(gaussianRandom(400, 50, 250, 600));
                            await simulateHumanClick(payNowBtn);
                            try { payNowBtn.click(); } catch(e) {}
                            notifyUser("VeryBot: Order Payment Submitted!", "Clicked Pay now button successfully.", window.location.href);
                            await sleep(4000);
                        } else {
                            logToConsole("Waiting for 'Pay now' button to become active (validating CVV & address)...", "info");
                        }
                    }
                }
                botActionInProgress = false;
                return;
            }

            // General checkout fallback
            const genericContinueBtn = document.querySelector('button[data-testid*="continue"], button[data-testid*="payment"]') ||
                                      Array.from(document.querySelectorAll('button')).find(b => {
                                          const txt = (b.innerText || '').trim().toLowerCase();
                                          return (txt === 'continue' || txt === 'continue to payment') && b.offsetParent !== null && !b.disabled;
                                      });
            if (genericContinueBtn && !genericContinueBtn.disabled) {
                const now = Date.now();
                if ((now - lastCheckoutStepTime) > 4000) {
                    logToConsole("Generic Checkout Continue detected. Clicking...", "info");
                    lastCheckoutStepTime = now;
                    await simulateHumanClick(genericContinueBtn);
                    try { genericContinueBtn.click(); } catch(e) {}
                    await sleep(2500);
                }
            }
        } catch (err) {
            logToConsole("Checkout handler error: " + err.message, "error");
        } finally {
            botActionInProgress = false;
        }
    }

    // =========================================================================
    // 8. BACKGROUND SEARCH MONITOR (https://www.very.co.uk/search/*)
    // =========================================================================

    let knownProductsState = JSON.parse(sessionStorage.getItem('very_bot_known_products') || '{}');

    async function executeSearchMonitorBackground() {
        if (!isBotRunning || botActionInProgress) return;
        botActionInProgress = true;

        const searchUrl = localStorage.getItem('very_bot_search_url') || '';
        if (!searchUrl) {
            botActionInProgress = false;
            return;
        }

        try {
            logToConsole("Scanning search page in background...", "info");
            const res = await fetch(searchUrl, { cache: 'no-store', credentials: 'include' });
            if (!res.ok) {
                logToConsole(`Search fetch returned HTTP ${res.status}`, "warning");
                botActionInProgress = false;
                return;
            }

            const html = await res.text();
            if (!html) {
                botActionInProgress = false;
                return;
            }

            const doc = new DOMParser().parseFromString(html, 'text/html');

            // Find all product links matching .prd
            const productLinks = Array.from(doc.querySelectorAll('a[href*=".prd"]'));
            const uniqueMap = new Map();

            for (const link of productLinks) {
                const href = link.getAttribute('href');
                if (href && !uniqueMap.has(href)) {
                    uniqueMap.set(href, link);
                }
            }

            const productsFound = Array.from(uniqueMap.entries()).slice(0, 36);

            if (productsFound.length === 0) {
                logToConsole("No products found on search page. Retrying...", "warning");
            } else {
                const autoBuy = localStorage.getItem('very_bot_auto_buy') !== 'false';
                let foundInStockUrl = null;
                let foundInStockTitle = '';
                let inStockCount = 0;
                let outOfStockCount = 0;

                for (const [path, linkEl] of productsFound) {
                    if (!isBotRunning) break;

                    const fullUrl = path.startsWith('http') ? path : window.location.origin + path;
                    const card = linkEl.closest('li, div[class*="productCard"], div[class*="fuse-product-card"]') || linkEl.parentElement || linkEl;

                    // Extract title and stock status
                    const title = (card.querySelector('h2, h3, [class*="productTitle"], [class*="title"]')?.textContent || 
                                   linkEl.getAttribute('aria-label') || 
                                   fullUrl.split('/').slice(-2, -1)[0] || 
                                   'Product').trim().replace(/\s+/g, ' ');

                    const cardText = (card.textContent || '').toUpperCase();
                    const isSoldOut = cardText.includes('OUT OF STOCK') || 
                                      cardText.includes('SOLD OUT') || 
                                      cardText.includes('CURRENTLY UNAVAILABLE');

                    const isInStock = !isSoldOut;

                    if (isInStock) {
                        inStockCount++;
                    } else {
                        outOfStockCount++;
                    }

                    const wasKnown = fullUrl in knownProductsState;
                    const wasInStock = wasKnown ? knownProductsState[fullUrl].inStock : false;

                    knownProductsState[fullUrl] = { title, inStock: isInStock };

                    if (isInStock) {
                        if (!wasInStock) {
                            logToConsole(`🚨 IN STOCK DETECTED: ${title}`, "success");
                            notifyUser("VeryBot: In Stock Found!", title, fullUrl);
                        }
                        if (autoBuy && !foundInStockUrl) {
                            foundInStockUrl = fullUrl;
                            foundInStockTitle = title;
                        }
                    }
                }

                logToConsole(`📊 Scan: Total ${productsFound.length} | ✅ In Stock: ${inStockCount} | ❌ OOS: ${outOfStockCount}`, inStockCount > 0 ? "success" : "info");

                const statsEl = document.getElementById('botStatsCounter');
                if (statsEl) {
                    statsEl.textContent = `${inStockCount} In-Stock / ${productsFound.length} Scanned`;
                    statsEl.style.color = inStockCount > 0 ? '#10b981' : '#94a3b8';
                }

                sessionStorage.setItem('very_bot_known_products', JSON.stringify(knownProductsState));

                if (foundInStockUrl && autoBuy) {
                    logToConsole(`🛒 Auto-Buy triggered! Navigating to: ${foundInStockTitle}`, "success");
                    window.location.href = foundInStockUrl;
                    return;
                }
            }
        } catch(e) {
            logToConsole("Search check failed: " + e.message, "error");
        }

        const minMs = parseFloat(localStorage.getItem('very_bot_min_delay') || '4') * 1000;
        const maxMs = parseFloat(localStorage.getItem('very_bot_max_delay') || '10') * 1000;
        const waitMs = minMs + Math.random() * (maxMs - minMs);

        setTimeout(() => {
            botActionInProgress = false;
        }, waitMs);
    }

    // =========================================================================
    // 9. ROUTING & STATE MACHINE
    // =========================================================================

    function isLoginPage() {
        const currentUrl = window.location.href.toLowerCase();
        if (currentUrl.includes('/account/login') || currentUrl.includes('/login') || currentUrl.includes('/identity') || currentUrl.includes('/signin') || currentUrl.includes('/sign-in')) {
            return true;
        }
        return !!document.querySelector('input[data-analyticsid="login-password"], input[name="password"], input[data-analyticsid="login-postcode"], button[data-testid="login-continue-button"]');
    }

    function checkUrlAndUI() {
        const currentUrl = window.location.href;
        const pageTypeEl = document.getElementById('botPageType');
        
        let message = "🌐 General Page";
        if (isLoginPage()) {
            message = "🔐 Login Page Detected";
        } else if (currentUrl.includes('.prd')) {
            message = "🛍️ Product Page Detected";
        } else if (currentUrl.includes('/search')) {
            message = "🔍 Search Page Detected";
        } else if (currentUrl.includes('/basket')) {
            message = "🛒 Basket Page Detected";
        } else if (currentUrl.includes('/checkout/delivery')) {
            message = "🚚 Checkout Delivery";
        } else if (currentUrl.includes('/checkout/payment/pay-in-full')) {
            message = "💰 Checkout Pay in Full";
        } else if (currentUrl.includes('/checkout/payment/card')) {
            message = "💳 Checkout Card & CVV";
        } else if (currentUrl.includes('/checkout')) {
            message = "💳 Checkout Page Detected";
        }
        
        if (pageTypeEl && currentUrl !== lastUrl) {
            pageTypeEl.innerText = message;
            lastUrl = currentUrl;
            logToConsole(`Navigated: ${message}`, "info");
        }
    }

    async function botLoop() {
        if (!isBotRunning) return;

        const currentUrl = window.location.href;
        const onLogin = isLoginPage();
        const isBuyingProcess = currentUrl.includes('.prd') || currentUrl.includes('/basket') || onLogin || currentUrl.includes('/checkout');
        const searchUrl = localStorage.getItem('very_bot_search_url') || '';

        if (onLogin) {
            await executeLoginPageBot();
        } else if (currentUrl.includes('.prd')) {
            await executeProductPageBot();
        } else if (currentUrl.includes('/basket')) {
            await executeBasketPageBot();
        } else if (currentUrl.includes('/checkout')) {
            await executeCheckoutPageBot();
        } else if (searchUrl && !isBuyingProcess) {
            await executeSearchMonitorBackground();
        }
    }

    // =========================================================================
    // 10. CYBERSOURCE MICROFORM FRAME HANDLER
    // =========================================================================

    async function initCybersourceFrameHandler() {
        async function tryFillSecurityCode(forcedCvv = null) {
            const cvv = forcedCvv || (typeof GM_getValue !== 'undefined' ? GM_getValue('very_bot_cvv') : '') || '';
            const isRunning = typeof GM_getValue !== 'undefined' ? (GM_getValue('very_bot_running') === true || GM_getValue('very_bot_running') === 'true') : true;
            if (!cvv || !isRunning) return false;

            const input = document.getElementById('securityCode') ||
                          document.querySelector('input[name="securityCode"]') ||
                          document.querySelector('input[aria-label="Card security code"]') ||
                          document.querySelector('input[inputmode="numeric"]');

            if (!input) return false;

            if (input.value === cvv) return true;

            try {
                input.focus();
                await sleep(gaussianRandom(200, 30, 100, 350));
                await simulateHumanType(input, cvv);
                input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));

                try {
                    window.parent.postMessage({ type: 'VERY_BOT_CVV_FILLED', success: true }, '*');
                } catch(e) {}
                if (typeof GM_setValue !== 'undefined') {
                    GM_setValue('very_bot_cvv_filled', Date.now());
                }
                return true;
            } catch (err) {
                console.error("Cybersource CVV fill error:", err);
                return false;
            }
        }

        // 1. Listen for postMessage from parent
        window.addEventListener('message', async (e) => {
            if (e.data && e.data.type === 'VERY_BOT_FILL_CVV') {
                await tryFillSecurityCode(e.data.cvv);
            }
        });

        // 2. Listen for GM trigger from parent
        if (typeof GM_addValueChangeListener !== 'undefined') {
            GM_addValueChangeListener('very_bot_fill_cvv_trigger', async () => {
                await tryFillSecurityCode();
            });
            GM_addValueChangeListener('very_bot_running', async (name, oldVal, newVal) => {
                if (newVal === true || newVal === 'true') {
                    await tryFillSecurityCode();
                }
            });
        }

        // 3. Periodic check when frame loads
        let attempts = 0;
        const checkInterval = setInterval(async () => {
            attempts++;
            const success = await tryFillSecurityCode();
            if (success || attempts > 30) {
                clearInterval(checkInterval);
            }
        }, 500);
    }

    // =========================================================================
    // 11. INITIALIZATION
    // =========================================================================

    function startBot() {
        if (!document.body) {
            setTimeout(startBot, 200);
            return;
        }

        initUI();
        handleCookieBanner();

        // Listen for CVV filled confirmation from iframe
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'VERY_BOT_CVV_FILLED') {
                logToConsole("CyberSource iframe: Card Security Code entered.", "success");
            }
        });

        if (localStorage.getItem('very_bot_running') === 'true') {
            isBotRunning = true;
            if (typeof GM_setValue !== 'undefined') GM_setValue('very_bot_running', true);
            updateButtons();
            logToConsole("Restored state: Bot is running.", "info");
        } else {
            updateButtons();
        }

        checkUrlAndUI();

        setInterval(checkUrlAndUI, 500);
        setInterval(botLoop, 1000);

        logToConsole("VeryBot UK initialized with biometric humanization & checkout automation.", "success");
    }

    if (isCybersourceFrame) {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', initCybersourceFrameHandler);
        } else {
            initCybersourceFrameHandler();
        }
    } else if (isTop) {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', startBot);
        } else {
            startBot();
        }
    }

})();
