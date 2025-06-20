// store.js

const SAVED_RESULTS_KEY = 'aiRatingApp_savedResults';
const THEME_KEY = 'aiRatingApp_theme';
const ABOUT_SEEN_KEY = 'aiRatingApp_aboutSeenStatus'; // 新增：关于弹窗查看状态
const ABOUT_SEEN_DATE_KEY = 'aiRatingApp_aboutSeenDate'; // 新增：关于弹窗上次查看日期

const MAX_SAVED_RESULTS = 50;

let savedResults = [];

function loadFromLocalStorage() {
    try {
        savedResults = JSON.parse(localStorage.getItem(SAVED_RESULTS_KEY) || '[]');
    } catch (error) {
        console.error("从LocalStorage加载数据失败:", error);
        savedResults = [];
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(savedResults));
    } catch (error) {
        console.error("保存数据到LocalStorage失败:", error);
    }
}

export function getSavedResults() {
    return [...savedResults];
}

export function addSavedResult(resultData) {
    // 避免重复保存完全相同的结果（基于时间戳）
    if (savedResults.some(r => r.timestamp === resultData.timestamp)) {
        return;
    }
    savedResults.unshift(resultData);
    if (savedResults.length > MAX_SAVED_RESULTS) {
        savedResults.pop();
    }
    saveToLocalStorage();
}

export function deleteSavedResult(timestamp) {
    const initialLength = savedResults.length;
    savedResults = savedResults.filter(r => r.timestamp !== timestamp);
    if (savedResults.length < initialLength) {
        saveToLocalStorage();
    }
}

// --- Theme Preference ---
export function getThemePreference() {
    return localStorage.getItem(THEME_KEY) || 'mint';
}

export function setThemePreference(theme) {
    localStorage.setItem(THEME_KEY, theme);
}

// --- About Dialog Preference (新增) ---
// 状态值: 'never' (从没看过), 'today' (今天看过), 'forever' (永远不看)
export function getAboutSeenStatus() {
    const status = localStorage.getItem(ABOUT_SEEN_KEY);
    const lastSeenDate = localStorage.getItem(ABOUT_SEEN_DATE_KEY);
    const now = new Date().toDateString(); // 获取当前日期的字符串，如 "Tue Jan 01 2024"

    if (status === 'today' && lastSeenDate !== now) {
        // 如果状态是'today'但不是今天看的，则重置为'never'
        return 'never';
    }
    return status || 'never'; // 默认是'never'
}

export function setAboutSeenStatus(status) {
    localStorage.setItem(ABOUT_SEEN_KEY, status);
    if (status === 'today') {
        localStorage.setItem(ABOUT_SEEN_DATE_KEY, new Date().toDateString());
    } else {
        localStorage.removeItem(ABOUT_SEEN_DATE_KEY); // 'never'或'forever'不需要日期
    }
}

// Initial load
loadFromLocalStorage();