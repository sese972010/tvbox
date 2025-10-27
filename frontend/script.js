// frontend/script.js

// Correctly select elements from the DOM using their actual IDs from index.html
const startBtn = document.getElementById('startButton');
const logOutput = document.getElementById('log-output');
const statusDisplay = document.getElementById('status');
const resultLink = document.getElementById('result-link');

let taskId = null;
let intervalId = null;

// Function to poll for task status
async function checkTaskStatus() {
    if (!taskId) return;

    try {
        const response = await fetch(`/api/task-status?taskId=${taskId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Update logs and status
        logOutput.textContent = data.logs || '等待日志...';
        logOutput.scrollTop = logOutput.scrollHeight; // Auto-scroll to the bottom

        if (data.status === 'completed') {
            statusDisplay.textContent = '状态: 任务成功完成！';
            statusDisplay.className = 'status-completed';
            resultLink.innerHTML = `聚合订阅地址: <a href="/subscribe.json" target="_blank">${window.location.origin}/subscribe.json</a>`;
            clearInterval(intervalId);
            startBtn.disabled = false;
        } else if (data.status === 'failed') {
            statusDisplay.textContent = `状态: 任务失败 - ${data.error || '未知错误'}`;
            statusDisplay.className = 'status-failed';
            clearInterval(intervalId);
            startBtn.disabled = false;
        } else {
            statusDisplay.textContent = `状态: ${data.status}...`;
            statusDisplay.className = 'status-running';
        }
    } catch (error) {
        console.error('Polling for status failed:', error);
        statusDisplay.textContent = '状态: 轮询失败，请检查网络或后台日志。';
        statusDisplay.className = 'status-failed';
        clearInterval(intervalId);
        startBtn.disabled = false;
    }
}

// Event listener for the start button
startBtn.addEventListener('click', async () => {
    // Reset UI for a new task
    startBtn.disabled = true;
    logOutput.textContent = '正在启动任务...';
    statusDisplay.textContent = '状态: pending';
    statusDisplay.className = 'status-pending';
    resultLink.innerHTML = '任务完成后将在此处显示...';
    if (intervalId) clearInterval(intervalId);

    try {
        // Use a relative path for the API call, which is handled by _worker.js
        const response = await fetch('/api/start-task', { method: 'POST' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        taskId = data.taskId;
        if (!taskId) {
            throw new Error("Failed to get a task ID from the backend.");
        }

        statusDisplay.textContent = '状态: 任务已启动，正在等待日志...';
        statusDisplay.className = 'status-running';

        // Start polling for status updates every 3 seconds
        intervalId = setInterval(checkTaskStatus, 3000);

    } catch (error) {
        console.error('Failed to start task:', error);
        logOutput.textContent = `启动任务时出错: ${error.message}`;
        statusDisplay.textContent = '状态: 启动失败';
        statusDisplay.className = 'status-failed';
        startBtn.disabled = false;
    }
});
