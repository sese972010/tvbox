// frontend/script.js

const API_BASE_URL = ''; // No longer needed, all calls are relative.

const startTaskBtn = document.getElementById('start-task-btn');
const logsContainer = document.getElementById('logs');
const statusDiv = document.getElementById('status');
const subscriptionUrlDiv = document.getElementById('subscription-url');

let taskId = null;
let intervalId = null;

// Function to poll for task status
async function checkTaskStatus() {
    if (!taskId) return;

    try {
        // Corrected: Use a relative path for the API call.
        const response = await fetch(`/api/task-status?taskId=${taskId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Update logs
        logsContainer.textContent = data.logs || '等待日志...';
        logsContainer.scrollTop = logsContainer.scrollHeight; // Auto-scroll

        // Update status and stop polling if finished
        if (data.status === 'completed') {
            statusDiv.textContent = '状态: 任务成功完成！';
            statusDiv.className = 'status-completed';
            subscriptionUrlDiv.innerHTML = `聚合订阅地址: <a href="/subscribe.json" target="_blank">${window.location.origin}/subscribe.json</a>`;
            clearInterval(intervalId);
            startTaskBtn.disabled = false;
        } else if (data.status === 'failed') {
            statusDiv.textContent = `状态: 任务失败 - ${data.error}`;
            statusDiv.className = 'status-failed';
            clearInterval(intervalId);
            startTaskBtn.disabled = false;
        } else {
            statusDiv.textContent = `状态: ${data.status}...`;
            statusDiv.className = 'status-running';
        }
    } catch (error) {
        console.error('轮询状态失败:', error);
        statusDiv.textContent = '状态: 轮询失败，请检查控制台。';
        statusDiv.className = 'status-failed';
        clearInterval(intervalId);
        startTaskBtn.disabled = false;
    }
}


// Event listener for the start button
startTaskBtn.addEventListener('click', async () => {
    // Reset UI
    startTaskBtn.disabled = true;
    logsContainer.textContent = '正在启动任务...';
    statusDiv.textContent = '状态: pending';
    statusDiv.className = 'status-pending';
    subscriptionUrlDiv.innerHTML = '';
    if (intervalId) clearInterval(intervalId);

    try {
        // Corrected: Use a relative path for the API call.
        const response = await fetch('/api/start-task', { method: 'POST' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        taskId = data.taskId;
        if (!taskId) {
            throw new Error("未能从后端获取任务ID。");
        }

        statusDiv.textContent = '状态: 任务已启动，正在等待日志...';
        statusDiv.className = 'status-running';

        // Start polling every 3 seconds
        intervalId = setInterval(checkTaskStatus, 3000);

    } catch (error) {
        console.error('启动任务失败:', error);
        logsContainer.textContent = `启动任务时出错: ${error.message}`;
        statusDiv.textContent = '状态: 启动失败';
        statusDiv.className = 'status-failed';
        startTaskBtn.disabled = false;
    }
});
