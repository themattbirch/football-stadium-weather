// offlineDetection.js

/**
 * Handles the display of offline messages based on network status.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!navigator.onLine) {
    const offlineMessage = document.getElementById('offlineMessage');
    if (offlineMessage) {
      offlineMessage.style.display = 'block';
    }
  }

  // Optional: Listen for online and offline events to dynamically update the UI
  window.addEventListener('online', () => {
    const offlineMessage = document.getElementById('offlineMessage');
    if (offlineMessage) {
      offlineMessage.style.display = 'none';
    }
  });

  window.addEventListener('offline', () => {
    const offlineMessage = document.getElementById('offlineMessage');
    if (offlineMessage) {
      offlineMessage.style.display = 'block';
    }
  });
});
