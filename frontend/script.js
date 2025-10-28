// --- TVBox Aggregator script.js - Final Version 4.0 ---
// This version is rewritten to be simpler and more robust,
// aligning with the simplified backend logic in the new _worker.js.

const startBtn = document.getElementById('startButton');
const logOutput = document.getElementById('log-output');
const statusDisplay = document.getElementById('status');
const resultLink = document.getElementById('result-link');

let intervalId = null;

/**
 * Polls the backend for the status of a given task.
 * @param {string} taskId - The ID of the task to poll.
 */
async function pollTaskStatus(taskId) {
    if (!taskId) return;

    try {
        const response = await fetch(`/api/task-status?taskId=${taskId}`);
        if (!response.ok) {
            // If the task is not found (404), it might still be initializing.
            // We'll just wait for the next poll.
            if (response.status === 404) {
                statusDisplay.textContent = '状态: 正在初始化任务...';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update UI elements with the latest state from the backend.
        logOutput.textContent = data.logs || '等待日志...';
        logOutput.scrollTop = logOutput.scrollHeight;
        statusDisplay.textContent = `状态: ${data.status}`;

        // Handle terminal states: completed or failed.
        if (data.status === 'completed') {
            statusDisplay.className = 'status-completed';
            resultLink.innerHTML = `订阅地址: <a href="/subscribe.json" target="_blank">${window.location.origin}/subscribe.json</a>`;
            clearInterval(intervalId); // Stop polling
            startBtn.disabled = false;
        } else if (data.status === 'failed') {
            statusDisplay.className = 'status-failed';
            statusDisplay.textContent = `状态: 任务失败 - ${data.error || '未知错误'}`;
            clearInterval(intervalId); // Stop polling
            startBtn.disabled = false;
        } else {
            statusDisplay.className = 'status-running';
        }

    } catch (error) {
        console.error('轮询失败:', error);
        statusDisplay.textContent = '状态: 轮询失败，请检查控制台。';
        statusDisplay.className = 'status-failed';
        clearInterval(intervalId);
        startBtn.disabled = false;
    }
}

/**
 * Event listener for the start button.
 */
startBtn.addEventListener('click', async () => {
    // 1. Reset UI to initial state.
    startBtn.disabled = true;
    logOutput.textContent = '正在向后端发送启动请求...';
    statusDisplay.textContent = '状态: 请求中...';
    statusDisplay.className = 'status-pending';
    resultLink.innerHTML = '任务完成后将在此处显示...';
    if (intervalId) clearInterval(intervalId);

    try {
        // 2. Call the backend to start the task.
        const response = await fetch('/api/start-task', { method: 'POST' });
        if (!response.ok) {
            throw new Error(`启动任务失败: ${response.statusText}`);
        }
        const data = await response.json();

        if (!data.taskId) {
            throw new Error("后端未返回有效的任务ID。");
        }

        // 3. Start polling for the status of the returned task ID.
        statusDisplay.textContent = '状态: 任务已启动，正在获取状态...';
        statusDisplay.className = 'status-running';
        intervalId = setInterval(() => pollTaskStatus(data.taskId), 3000);

    } catch (error) {
        console.error('启动任务时出错:', error);
        logOutput.textContent = `错误: ${error.message}`;
        statusDisplay.textContent = '状态: 启动失败';
        statusDisplay.className = 'status-failed';
        startBtn.disabled = false;
    }
});
