/**
 * notificationSound.js — Blinkit/Zomato-style persistent notification
 * Plays repeating alert sound until dismissed, with vibration
 */
let audioCtx = null;
let activeOsc = null;
let activeGain = null;
let repeatTimer = null;

const getCtx = () => {
    if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
};

// Two-tone Blinkit-style alert beep
const playBeep = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";

        const t = ctx.currentTime;
        // Beep pattern: high-low-high
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(660, t + 0.12);
        osc.frequency.setValueAtTime(880, t + 0.24);
        osc.frequency.setValueAtTime(1100, t + 0.36);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.setValueAtTime(0.3, t + 0.12);
        gain.gain.setValueAtTime(0.25, t + 0.24);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        osc.start(t);
        osc.stop(t + 0.5);
        activeOsc = osc;
        activeGain = gain;
    } catch { /* silent */ }
};

// Vibrate if supported
const vibrate = () => {
    try {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
    } catch { /* silent */ }
};

/**
 * Start persistent alert — repeats every 2.5s until stopped
 * Like Blinkit/Zomato new order alert
 */
export const startAlert = () => {
    stopAlert(); // Stop any existing
    playBeep();
    vibrate();
    repeatTimer = setInterval(() => {
        playBeep();
        vibrate();
    }, 2500);
};

/**
 * Stop the persistent alert
 */
export const stopAlert = () => {
    if (repeatTimer) {
        clearInterval(repeatTimer);
        repeatTimer = null;
    }
    try {
        if (activeOsc) { activeOsc.stop(); activeOsc = null; }
    } catch { /* already stopped */ }
};

/**
 * Single notification beep (non-repeating)
 */
export const playNotification = () => {
    playBeep();
    vibrate();
};

/**
 * Check if alert is currently playing
 */
export const isAlertActive = () => !!repeatTimer;
