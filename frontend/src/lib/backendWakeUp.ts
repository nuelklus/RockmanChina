// Backend health check and wake-up service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rockmanchina.onrender.com';

// Health check endpoint (lightweight, doesn't hit database)
const HEALTH_CHECK_ENDPOINT = `${API_BASE_URL}/health/`;

// Backend wake-up state
let isWakingUp = false;
let lastWakeUpTime = 0;
const WAKE_UP_COOLDOWN = 55000; // 55 seconds (less than Render's 60s sleep)

// Show user-friendly alert
const showWakeUpAlert = () => {
  // Create or update alert element
  let alertElement = document.getElementById('api-wake-up-alert');
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.id = 'api-wake-up-alert';
    alertElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(alertElement);
  }
  
  alertElement.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div>
        <strong>🚀 Backend Starting Up</strong><br>
        <small>Please wait about 60 seconds...</small>
      </div>
    </div>
  `;
  
  // Auto-hide after 90 seconds (backend should be up by then)
  setTimeout(() => {
    hideWakeUpAlert();
  }, 90000);
  
  // Add CSS animation
  if (!document.getElementById('wake-up-styles')) {
    const style = document.createElement('style');
    style.id = 'wake-up-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
};

// Hide the alert
const hideWakeUpAlert = () => {
  const alertElement = document.getElementById('api-wake-up-alert');
  if (alertElement) {
    alertElement.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.parentNode.removeChild(alertElement);
      }
    }, 300);
  }
};

// Wake up the backend with a simple ping
export const wakeUpBackend = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Don't wake up if we're already in the process or recently did it
  if (isWakingUp || (now - lastWakeUpTime) < WAKE_UP_COOLDOWN) {
    return false;
  }

  isWakingUp = true;
  showWakeUpAlert(); // Show user-friendly alert
  
  try {
    // Simple health check request
    const response = await fetch(HEALTH_CHECK_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      hideWakeUpAlert(); // Hide alert when successful
      lastWakeUpTime = now;
      return true;
    } else {
      console.log('⚠️ Backend responded but not healthy');
      return false;
    }
  } catch (error) {
    console.log('🔄 Backend is waking up (this is expected for free tier)...');
    // Even if it fails, the request has triggered the wake-up
    lastWakeUpTime = now;
    return false; // Still return false as it's not ready yet
  } finally {
    isWakingUp = false;
  }
};

// Force hide alert (for when API calls succeed)
export const hideBackendAlert = () => {
  hideWakeUpAlert();
};

// Check if backend is responsive
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(HEALTH_CHECK_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

// Enhanced API wrapper that handles wake-up
export const apiCallWithWakeUp = async (
  apiCall: () => Promise<any>,
  maxRetries = 2
): Promise<any> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // First, try to wake up the backend if needed
      if (attempt === 0) {
        await wakeUpBackend();
        // Wait a moment for the backend to start
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Try the actual API call
      const result = await apiCall();
      hideBackendAlert(); // Hide alert on success (even if health check failed)
      return result;
    } catch (error) {
      console.log(`❌ API call attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries) {
        // Show final error message
        const alertElement = document.getElementById('api-wake-up-alert');
        if (alertElement) {
          alertElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="color: #ff6b6b; font-size: 20px;">⚠️</div>
              <div>
                <strong>Backend Unavailable</strong><br>
                <small>Please try again in a few minutes...</small>
              </div>
            </div>
          `;
          // Auto-hide after 5 seconds
          setTimeout(() => hideBackendAlert(), 5000);
        }
        throw error;
      }
      
      // Update alert message for retry
      const alertElement = document.getElementById('api-wake-up-alert');
      if (alertElement && attempt < maxRetries) {
        const remainingTime = (attempt + 1) * 3;
        alertElement.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div>
              <strong>🔄 Retrying...</strong><br>
              <small>Attempt ${attempt + 2}/${maxRetries + 1} - Please wait ${remainingTime}s...</small>
            </div>
          </div>
        `;
      }
      
      // Wait before retry (longer on subsequent attempts)
      const waitTime = 3000 * (attempt + 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Auto wake-up on app start
export const initializeBackendWakeUp = () => {
  // Wake up backend when user first interacts with the app
  const wakeUpOnInteraction = () => {
    wakeUpBackend();
    // Remove listener after first interaction
    document.removeEventListener('click', wakeUpOnInteraction);
    document.removeEventListener('keydown', wakeUpOnInteraction);
    document.removeEventListener('scroll', wakeUpOnInteraction);
  };

  // Add event listeners for user interaction
  document.addEventListener('click', wakeUpOnInteraction, { once: true });
  document.addEventListener('keydown', wakeUpOnInteraction, { once: true });
  document.addEventListener('scroll', wakeUpOnInteraction, { once: true });
};
