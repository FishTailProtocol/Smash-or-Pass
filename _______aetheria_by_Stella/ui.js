// ui.js
import * as store from './store.js';

// === 新增的初始化函数 ===
function initialStageSetup() {
    // 确保在JS执行前，所有需要隐藏的面板都已隐藏
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('result-container').classList.add('hidden');
    document.getElementById('saved-results-overlay').classList.add('hidden');
    document.getElementById('popup-overlay').classList.add('hidden');
    document.getElementById('about-overlay').classList.add('hidden'); // 新增：隐藏About弹窗
}
initialStageSetup(); // 在脚本加载时立即执行

// --- DOM Element Cache (集中管理所有元素) ---
const elements = {
    body: document.body,
    themeSwitcher: document.querySelector('.theme-switcher'),
    container: document.querySelector('.container'),
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    previewContainer: document.getElementById('preview-container'),
    previewImage: document.getElementById('preview-image'),
    resultContainer: document.getElementById('result-container'),
    loading: document.getElementById('loading'),
    loadingText: document.getElementById('loading-text'),
    progressBar: document.querySelector('.progress-bar'),
    result: document.getElementById('result'),
    resultImageThumbnail: document.getElementById('result-image-thumbnail'),
    verdict: document.getElementById('verdict'),
    verdictIcon: document.getElementById('verdict-icon'),
    explanation: document.getElementById('explanation'),
    resultActions: document.querySelector('.result-actions'),
    disclaimer: document.getElementById('disclaimer'),
    // Saved Results Panel
    savedResultsOverlay: document.getElementById('saved-results-overlay'),
    savedResultsGrid: document.getElementById('saved-results-grid'),
    searchSavedInput: document.getElementById('search-saved'),
    filterSavedSelect: document.getElementById('filter-saved'),
    // Popup (for individual saved results)
    popupOverlay: document.getElementById('popup-overlay'),
    popupImg: document.getElementById('popup-img'),
    popupVerdict: document.getElementById('popup-verdict'),
    popupExplanation: document.getElementById('popup-explanation'),
    // About Dialog (新增)
    showAboutBtn: document.getElementById('show-about-btn'),
    aboutOverlay: document.getElementById('about-overlay'),
    aboutConfirmBtn: document.getElementById('about-confirm-btn'),
    aboutHideTodayBtn: document.getElementById('about-hide-today-btn'),
    aboutHideForeverBtn: document.getElementById('about-hide-forever-btn'),
};

const loadingMessages = [
    "AI正在审视每一个像素...",
    "计算可操性指数...",
    "加载骚话语料库...",
    "正在评估美学价值...",
    "马上就好，别急...",
];

// --- UI State Changers ---

export function showView(viewName) {
    elements.uploadArea.classList.add('hidden');
    elements.previewContainer.classList.add('hidden');
    elements.resultContainer.classList.add('hidden');
    elements.savedResultsOverlay.classList.add('hidden'); // 确保所有大面板互斥
    elements.popupOverlay.classList.add('hidden'); // 确保所有弹窗互斥
    elements.aboutOverlay.classList.add('hidden'); // 确保所有弹窗互斥


    if (viewName === 'upload') {
        elements.uploadArea.classList.remove('hidden');
        elements.fileInput.value = ''; // 清空选择
    } else if (viewName === 'preview') {
        elements.previewContainer.classList.remove('hidden');
    } else if (viewName === 'result') {
        elements.resultContainer.classList.remove('hidden');
    }
}

export function updatePreviewImage(imageDataUrl) {
    elements.previewImage.src = imageDataUrl;
}

export function showLoading(imageDataUrl) {
    showView('result');
    elements.loading.classList.remove('hidden');
    elements.result.classList.add('hidden');
    elements.resultImageThumbnail.src = imageDataUrl;
    
    // 启动加载动画和文字
    let messageIndex = 0;
    const intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        elements.loadingText.textContent = loadingMessages[messageIndex];
    }, 2000);
    elements.loading.dataset.intervalId = intervalId;

    // 模拟进度条
    elements.progressBar.style.width = '0%';
    setTimeout(() => { elements.progressBar.style.width = '30%'; }, 100);
    setTimeout(() => { elements.progressBar.style.width = '70%'; }, 1000);
    setTimeout(() => { elements.progressBar.style.width = '90%'; }, 3000);
}

export function hideLoading() {
    clearInterval(elements.loading.dataset.intervalId);
    elements.loading.classList.add('hidden');
    elements.progressBar.style.width = '100%'; // 完成进度条
}

export function displayResult(resultData) {
    hideLoading();
    elements.result.classList.remove('hidden');
    
    const { rating, verdict: verdictText, explanation: explanationText } = resultData;
    const isSmash = verdictText === 'SMASH';

    const ratingLabel = getRatingLabel(rating);
    elements.verdict.textContent = `${ratingLabel} (${rating}/10)`;
    elements.verdictIcon.textContent = isSmash ? '🥵' : '🥶';
    elements.explanation.textContent = explanationText;
    elements.result.className = `result ${isSmash ? 'smash' : 'pass'}`;

    // 清空旧按钮并创建新按钮
    elements.resultActions.innerHTML = '<button id="try-again-btn" class="btn btn-secondary">🔄 再试一次</button>';
}

export function displayError(errorMessage) {
    hideLoading();
    elements.result.classList.remove('hidden');
    elements.verdict.textContent = '出错了!';
    elements.verdictIcon.textContent = '😱';
    elements.explanation.textContent = errorMessage;
    elements.result.className = 'result';
    elements.resultActions.innerHTML = '<button id="try-again-btn" class="btn btn-secondary">🔄 再试一次</button>';
}

export function createDynamicButtons(onSave, onShare) {
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.innerHTML = '💾 保存战绩';
    saveBtn.addEventListener('click', () => {
        onSave();
        saveBtn.innerHTML = '✓ 已保存';
        saveBtn.disabled = true;
    });

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn';
    shareBtn.innerHTML = '🖼️ 生成分享图';
    shareBtn.addEventListener('click', () => {
        onShare();
        // 可以在 onShare 内部处理按钮状态变化
    });
    
    elements.resultActions.prepend(shareBtn);
    elements.resultActions.prepend(saveBtn);
}


// --- Theme Management ---

export function initializeTheme() {
    const savedTheme = store.getThemePreference();
    setTheme(savedTheme);
}

export function setTheme(theme) {
    elements.body.dataset.theme = theme;
    store.setThemePreference(theme);
    
    // 更新按钮的激活状态
    elements.themeSwitcher.querySelectorAll('.theme-btn').forEach(btn => {
        btn.setAttribute('aria-checked', btn.dataset.theme === theme); // 更新ARIA属性
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// --- Drag & Drop UI ---

export function setDragOver(isOver) {
    elements.uploadArea.classList.toggle('drag-over', isOver);
}

// --- Disclaimer ---
export function hideDisclaimer() {
    elements.disclaimer.style.transition = 'opacity 0.5s, transform 0.5s';
    elements.disclaimer.style.opacity = '0';
    elements.disclaimer.style.transform = 'translateY(-20px)';
    setTimeout(() => elements.disclaimer.classList.add('hidden'), 500);
}

// --- Saved Results Panel ---

export function toggleSavedResultsPanel(show, onHandlers) {
    if (show) {
        showView('savedResults'); // 隐藏其他视图
        elements.savedResultsOverlay.classList.remove('hidden');
        elements.body.style.overflow = 'hidden'; // 禁止滚动
        renderSavedResults(store.getSavedResults(), onHandlers);
    } else {
        elements.savedResultsOverlay.classList.add('hidden');
        elements.body.style.overflow = ''; // 恢复滚动
        showView('upload'); // 返回主页
    }
}

export function renderSavedResults(results, onHandlers) {
    elements.savedResultsGrid.innerHTML = ''; // Clear previous results
    if (results.length === 0) {
        elements.savedResultsGrid.innerHTML = '<p style="color: var(--text-muted); text-align: center;">还没有战绩，快去分析一张！</p>';
        return;
    }

    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'saved-result-card';
        card.dataset.timestamp = result.timestamp;
        
        card.innerHTML = `
            <img src="${result.image}" alt="Saved result" loading="lazy">
            <div class="saved-result-info">
                <p class="verdict">${getRatingLabel(result.rating)} (${result.rating}/10) ${result.verdict === 'SMASH' ? '🥵' : '🥶'}</p>
                <p class="date">${new Date(result.timestamp).toLocaleString()}</p>
                <div class="saved-result-actions">
                    <button class="delete-btn">🗑️ 删除</button>
                </div>
            </div>
        `;

        card.addEventListener('click', () => onHandlers.onView(result));
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            onHandlers.onDelete(result.timestamp);
        });

        elements.savedResultsGrid.appendChild(card);
    });
}

// --- Popup (for individual saved results) ---
export function showPopup(result) {
    elements.popupImg.src = result.image;
    elements.popupVerdict.textContent = `${getRatingLabel(result.rating)} (${result.rating}/10) ${result.verdict === 'SMASH' ? '🥵' : '🥶'}`;
    elements.popupExplanation.textContent = result.explanation;
    elements.popupOverlay.classList.remove('hidden');
    elements.body.style.overflow = 'hidden';
}

export function hidePopup() {
    elements.popupOverlay.classList.add('hidden');
    // 如果“已保存结果”面板仍然可见，保持滚动禁止，否则恢复
    if (elements.savedResultsOverlay.classList.contains('hidden')) {
        elements.body.style.overflow = '';
    }
}

// --- About Dialog (新增) ---
export function showAboutPopup() {
    elements.aboutOverlay.classList.remove('hidden');
    elements.body.style.overflow = 'hidden';
}

export function hideAboutPopup() {
    elements.aboutOverlay.classList.add('hidden');
    elements.body.style.overflow = '';
}

// --- Utility ---
function getRatingLabel(rating) {
    if (rating <= 2) return '纯属答辩';
    if (rating <= 4) return '勉强能冲';
    if (rating <= 6) return '有点意思';
    if (rating <= 8) return '嗯了';
    return '直接开导';
}