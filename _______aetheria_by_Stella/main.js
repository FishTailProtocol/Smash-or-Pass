// main.js
import * as ui from './ui.js';
import * as store from './store.js';
import * as api from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentImageDataUrl = null;
    let currentAnalysisResult = null;

    // --- DOM Elements (Event-specific elements) ---
    const elements = {
        uploadArea: document.getElementById('upload-area'),
        fileInput: document.getElementById('file-input'),
        startAnalysisBtn: document.getElementById('start-analysis-btn'),
        clearSelectionBtn: document.getElementById('clear-selection-btn'),
        closeDisclaimerBtn: document.getElementById('close-disclaimer'),
        viewSavedBtn: document.getElementById('view-saved-btn'),
        closeSavedBtn: document.getElementById('close-saved-btn'),
        searchSavedInput: document.getElementById('search-saved'),
        filterSavedSelect: document.getElementById('filter-saved'),
        popupOverlay: document.getElementById('popup-overlay'),
        themeSwitcher: document.querySelector('.theme-switcher'),
        // About Dialog elements (新增)
        showAboutBtn: document.getElementById('show-about-btn'),
        aboutConfirmBtn: document.getElementById('about-confirm-btn'),
        aboutHideTodayBtn: document.getElementById('about-hide-today-btn'),
        aboutHideForeverBtn: document.getElementById('about-hide-forever-btn'),
        closeAboutBtn: document.querySelector('.close-about') // 关闭按钮在About Card内部
    };

    // --- Initialization ---
    function initialize() {
        ui.initializeTheme(); // 初始化主题
        setupEventListeners(); // 设置所有事件监听

        // 检查是否首次访问或需要再次显示About弹窗
        const aboutStatus = store.getAboutSeenStatus();
        if (aboutStatus === 'never') {
            ui.showAboutPopup();
        }
    }

    // --- Event Handlers ---
    function setupEventListeners() {
        // Upload Area
        elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', handleFileSelect);

        // Drag & Drop
        setupDragAndDrop();
        
        // Paste from clipboard
        document.addEventListener('paste', handlePaste);

        // Buttons
        elements.startAnalysisBtn.addEventListener('click', handleAnalysis);
        elements.clearSelectionBtn.addEventListener('click', () => ui.showView('upload')); // 返回上传页面

        // Disclaimer
        elements.closeDisclaimerBtn.addEventListener('click', ui.hideDisclaimer);
        
        // Dynamic buttons require delegation (Try Again)
        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'try-again-btn') {
                ui.showView('upload');
            }
        });

        // Theme Switcher
        elements.themeSwitcher.addEventListener('click', (e) => {
            if (e.target.matches('.theme-btn')) {
                ui.setTheme(e.target.dataset.theme);
            }
        });

        // Saved Results Panel
        elements.viewSavedBtn.addEventListener('click', () => ui.toggleSavedResultsPanel(true, savedResultsEventHandlers));
        elements.closeSavedBtn.addEventListener('click', () => ui.toggleSavedResultsPanel(false));
        elements.searchSavedInput.addEventListener('input', handleFilterAndSearchSaved);
        elements.filterSavedSelect.addEventListener('change', handleFilterAndSearchSaved);

        // Popup (for individual saved results)
        elements.popupOverlay.addEventListener('click', (e) => {
            // 点击背景或关闭按钮时隐藏弹窗
            if (e.target === elements.popupOverlay || e.target.classList.contains('close-popup')) {
                ui.hidePopup();
            }
        });

        // About Dialog (新增)
        elements.showAboutBtn.addEventListener('click', ui.showAboutPopup); // 强制显示About弹窗
        elements.aboutConfirmBtn.addEventListener('click', () => {
            ui.hideAboutPopup();
            // 不改变状态，下次访问仍可能显示
        });
        elements.aboutHideTodayBtn.addEventListener('click', () => {
            store.setAboutSeenStatus('today');
            ui.hideAboutPopup();
        });
        elements.aboutHideForeverBtn.addEventListener('click', () => {
            store.setAboutSeenStatus('forever');
            ui.hideAboutPopup();
        });
        // About弹窗的关闭按钮
        elements.closeAboutBtn.addEventListener('click', ui.hideAboutPopup);
    }

    // --- Core Logic ---
    async function handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        processFile(file);
    }
    
    async function processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择一个图片文件哦~');
            return;
        }
        try {
            currentImageDataUrl = await compressImage(file);
            ui.updatePreviewImage(currentImageDataUrl);
            ui.showView('preview');
        } catch (error) {
            console.error("图片处理失败:", error);
            alert("图片处理失败，请换一张图片试试。");
        }
    }

    async function handleAnalysis() {
        if (!currentImageDataUrl) return;

        ui.showLoading(currentImageDataUrl);
        
        const aiType = document.querySelector('input[name="ai-type"]:checked').value;

        try {
            const result = await api.analyzeImage(currentImageDataUrl, aiType);
            currentAnalysisResult = { ...result, image: currentImageDataUrl, timestamp: Date.now(), aiType };
            ui.displayResult(currentAnalysisResult);
            ui.createDynamicButtons(handleSave, () => handleShare(currentAnalysisResult));
        } catch (error) {
            ui.displayError(error.message || '未知错误，请检查网络或联系管理员。');
        }
    }

    function handleSave() {
        if (currentAnalysisResult) {
            store.addSavedResult(currentAnalysisResult);
        }
    }
    
    async function handleShare(result) {
        const shareButton = document.querySelector('.btn.share-btn');
        if (!shareButton) return;
    
        shareButton.textContent = '生成中...';
        shareButton.disabled = true;
    
        try {
            const imageBlob = await generateShareCard(result);
            // 使用剪贴板API（如果可用且安全）
            if (navigator.clipboard && navigator.clipboard.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': imageBlob })
                ]);
                alert('分享卡片已复制到剪贴板！快去粘贴分享吧！');
                shareButton.textContent = '✓ 已复制';
            } else {
                // 回退方案：下载图片
                const url = URL.createObjectURL(imageBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ai-rating-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                alert('图片已下载到本地！'); // 明确提示下载
                shareButton.textContent = '✓ 已下载';
            }
        } catch (error) {
            console.error('生成或复制分享卡片失败:', error);
            alert('生成分享卡片失败，请稍后再试。');
            shareButton.textContent = '🖼️ 生成分享图';
        } finally {
            setTimeout(() => {
                shareButton.disabled = false;
                if (shareButton.textContent !== '🖼️ 生成分享图') {
                     setTimeout(() => { shareButton.textContent = '🖼️ 生成分享图'; }, 2000);
                }
            }, 1000);
        }
    }

    // --- Saved Results Logic ---
    const savedResultsEventHandlers = {
        onView: ui.showPopup,
        onDelete: (timestamp) => {
            if (confirm('确定要删除这条战绩吗？')) {
                store.deleteSavedResult(timestamp);
                handleFilterAndSearchSaved(); // Refresh the view
            }
        }
    };
    
    function handleFilterAndSearchSaved() {
        const searchTerm = elements.searchSavedInput.value.toLowerCase();
        const filterTerm = elements.filterSavedSelect.value;
        const allResults = store.getSavedResults();

        const filteredResults = allResults.filter(r => {
            const matchesSearch = r.explanation.toLowerCase().includes(searchTerm);
            const matchesFilter = filterTerm === 'all' || r.verdict === filterTerm;
            return matchesSearch && matchesFilter;
        });

        ui.renderSavedResults(filteredResults, savedResultsEventHandlers);
    }

    // --- Advanced Features ---
    function setupDragAndDrop() {
        const dropZone = elements.uploadArea;
        dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); ui.setDragOver(true); });
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); ui.setDragOver(true); });
        dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); ui.setDragOver(false); });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            ui.setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
        });
    }

    function handlePaste(event) {
        // 确保焦点不在输入框内，以防干扰正常粘贴
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        const items = event.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    processFile(file);
                    break; // 只处理第一张图片
                }
            }
        }
    }

    /**
     * @param {File} file
     * @returns {Promise<string>}
     */
    function compressImage(file, maxWidth = 1024, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    /**
     * @param {object} resultData 
     * @returns {Promise<Blob>}
     */
    function generateShareCard(resultData) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const width = 600;
            const height = 800;
            const padding = 40;

            canvas.width = width;
            canvas.height = height;

            // Background - 使用更柔和的渐变或纯色
            ctx.fillStyle = '#2c3e50'; // 深色背景，或根据主题动态调整
            ctx.fillRect(0, 0, width, height);

            // Load original image
            const img = new Image();
            img.crossOrigin = "anonymous"; // Important for external images
            img.src = resultData.image;
            img.onload = () => {
                const imgHeight = 400; // 图片在卡片中的高度
                let drawWidth = img.width;
                let drawHeight = img.height;

                // 保持图片比例，使其适应imgHeight
                if (drawHeight > imgHeight) {
                    drawWidth = (imgHeight / drawHeight) * drawWidth;
                    drawHeight = imgHeight;
                }
                // 如果图片过宽，则按比例缩放
                if (drawWidth > width - padding * 2) {
                    drawHeight = ((width - padding * 2) / drawWidth) * drawHeight;
                    drawWidth = width - padding * 2;
                }

                const imgX = (width - drawWidth) / 2;
                const imgY = padding;
                ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);

                // Verdict - 更大的字体，更好的对比度
                ctx.font = 'bold 48px "Smiley Sans", sans-serif'; // 使用得意黑
                ctx.fillStyle = resultData.verdict === 'SMASH' ? '#ff6666' : '#66cc99'; // 更亮的颜色
                ctx.textAlign = 'center';
                ctx.fillText(`${resultData.verdict === 'SMASH' ? '🥵' : '🥶'} ${getRatingLabel(resultData.rating)} (${resultData.rating}/10)`, width / 2, imgY + drawHeight + 60);

                // Explanation - 使用得意黑，自动换行
                ctx.font = '22px "Smiley Sans", sans-serif'; // 使用得意黑，字体大一点
                ctx.fillStyle = '#f0f8ff'; // 亮色文字
                wrapText(ctx, resultData.explanation, width / 2, imgY + drawHeight + 120, width - padding * 2, 30); // 增加行高

                // Footer
                ctx.font = '16px "Smiley Sans", sans-serif'; // 使用得意黑
                ctx.fillStyle = '#99aab5';
                ctx.fillText('Generated by 幻海秘境 · Aetheria', width / 2, height - padding + 10);
                
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed.'));
                    }
                }, 'image/png');
            };
            img.onerror = () => reject(new Error('Failed to load image for canvas.'));
        });

        // Helper function for wrapping text on canvas
        function wrapText(context, text, x, y, maxWidth, lineHeight) {
            let lines = [];
            let currentLine = '';
            const words = text.split(''); // 按字符分割，更适合中文

            for (let i = 0; i < words.length; i++) {
                const char = words[i];
                const testLine = currentLine + char;
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth > maxWidth && i > 0) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine); // Add the last line

            for (let i = 0; i < lines.length; i++) {
                context.fillText(lines[i], x, y + i * lineHeight);
            }
        }
        
        // --- Utility (for generateShareCard to use) ---
        function getRatingLabel(rating) {
            if (rating <= 2) return '纯属答辩';
            if (rating <= 4) return '勉强能冲';
            if (rating <= 6) return '有点意思';
            if (rating <= 8) return '嗯了';
            return '直接开导';
        }
    }


    // --- Start the app ---
    initialize();
});