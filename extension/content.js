function createAIDetectionPopup(data) {

    const isAI = data.analysis.isAIGenerated;
    const probability = data.analysis.aiProbability;
    const confidence = data.analysis.confidence;

    return `
    <style>
      #ai-detection-popup {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 340px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 2147483647;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .popup-header {
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .popup-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #6b7280;
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: background 0.2s;
      }
      
      .close-btn:hover {
        background: #f3f4f6;
      }
      
      .popup-content {
        padding: 20px;
      }
      
      .result-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      .badge-ai {
        background: #fef3c7;
        color: #92400e;
      }
      
      .badge-human {
        background: #d1fae5;
        color: #065f46;
      }
      
      .probability-section {
        margin-bottom: 20px;
      }
      
      .probability-label {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .probability-value {
        font-size: 32px;
        font-weight: 700;
        color: ${isAI ? '#d97706' : '#059669'};
        margin-bottom: 8px;
      }
      
      .confidence-tag {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        background: #f3f4f6;
        color: #374151;
      }
      
      .details-section {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
      }
      
      .details-title {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .detail-label {
        font-size: 13px;
        color: #6b7280;
        text-transform: capitalize;
      }
      
      .detail-score {
        font-size: 13px;
        font-weight: 600;
        color: #111827;
      }
      
      .progress-bar {
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        margin-top: 4px;
      }
      
      .progress-fill {
        height: 100%;
        background: ${isAI ? '#f59e0b' : '#10b981'};
        transition: width 0.3s ease;
      }
    </style>
    
    <div class="popup-header">
      <div class="popup-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        AI Image Detection
      </div>
      <button class="aiclose-btn  close-btn">×</button>
    </div>
    
    <div class="popup-content">
      <div class="result-badge ${isAI ? 'badge-ai' : 'badge-human'}">
        ${isAI ? '⚠️ AI Generated' : '✓ Human Created'}
      </div>
      
      <div class="probability-section">
        <div class="probability-label">${isAI ? 'AI' : 'Human'} Probability</div>
        <div class="probability-value">${probability}%</div>
        <span class="confidence-tag">${confidence} Confidence</span>
      </div>
      
      <div class="details-section">
        <div class="details-title">Detection Details</div>
        ${data.analysis.details.map(detail => `
          <div class="detail-item">
            <span class="detail-label">${detail.label}</span>
            <span class="detail-score">${(detail.score * 100).toFixed(2)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${detail.score * 100}%"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

}
function createLoadingPopup() {

    return `
    <style>
      #ai-detection-loading {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 340px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 2147483647;
        animation: slideIn 0.3s ease-out;
        padding: 24px;
      }
      
      @keyframes slideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      
      .loading-icon {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-size: 15px;
        font-weight: 500;
        color: #374151;
      }
      
      .progress-bar-container {
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      
      .progress-bar-fill {
        height: 100%;
        width: 60%;
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
        border-radius: 3px;
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    </style>
    
    <div class="loading-content">
      <div class="loading-icon"></div>
      <div class="loading-text">Analyzing image...</div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill"></div>
      </div>
    </div>
  `;

    return popup;
}

let Aidiv = document.createElement('div');
Aidiv.className = 'ai-detection-popup';
(document.documentElement || document.body).appendChild(Aidiv);

chrome.runtime.onMessage.addListener((m, s, sr) => {
    document.querySelector('.ai-detection-popup')?.classList.remove("ai-hide")
    if (m.ref == 'ai_response') {
        let htmlCode = createAIDetectionPopup(m.data);
        let aiResultContainer = document.querySelector('.ai-detection-popup')
        aiResultContainer.id = 'ai-detection-popup';
        aiResultContainer.innerHTML = htmlCode;
        let aiCloseButton = document.querySelector(".aiclose-btn");
        console.log(aiCloseButton);

        aiCloseButton?.addEventListener('click', () => document.querySelector('.ai-detection-popup').classList.add("ai-hide"))
    } else if (m.ref === 'analyzing') {
        let container = document.querySelector('.ai-detection-popup')
        container.innerHTML = ''
        let htmlCode = createLoadingPopup()
        container.id = 'ai-detection-loading';
        container.innerHTML = htmlCode;
    }
    sr('thanks')
}) 