// frontend/script.js

// Correctly select all necessary DOM elements from index.html.
const startBtn = document.getElementById('startButton');
const logOutput = document.getElementById('log-output');
const statusDisplay = document.getElementById('status');
const resultLink = document.getElementById('result-link');

let taskId = null;
let intervalId = null;

/**
 * Polls the backend for the status of the aggregation task.
 */
async function checkTaskStatus() {
    if (!taskId) return;

    try {
        // The API call is a relative path, which is correctly handled by the Cloudflare Pages Function.
        const response = await fetch(`/api/task-status?taskId=${taskId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Update the log display and automatically scroll to the bottom.
        logOutput.textContent = data.logs || 'Waiting for logs...';
        logOutput.scrollTop = logOutput.scrollHeight;

        // Update UI based on the task status.
        if (data.status === 'completed') {
            statusDisplay.textContent = 'Status: Task Completed Successfully!';
            statusDisplay.className = 'status-completed';
            resultLink.innerHTML = `Subscription URL: <a href="/subscribe.json" target="_blank">${window.location.origin}/subscribe.json</a>`;
            clearInterval(intervalId); // Stop polling
            startBtn.disabled = false;
        } else if (data.status === 'failed') {
            statusDisplay.textContent = `Status: Task Failed - ${data.error || 'Unknown error'}`;
            statusDisplay.className = 'status-failed';
            clearInterval(intervalId); // Stop polling
            startBtn.disabled = false;
        } else {
            statusDisplay.textContent = `Status: ${data.status}...`;
            statusDisplay.className = 'status-running';
        }
    } catch (error) {
        console.error('Polling for status failed:', error);
        statusDisplay.textContent = 'Status: Polling failed. Check console or network.';
        statusDisplay.className = 'status-failed';
        clearInterval(intervalId);
        startBtn.disabled = false;
    }
}

/**
 * Event listener for the start button.
 */
startBtn.addEventListener('click', async () => {
    // 1. Reset the UI to a clean state for the new task.
    startBtn.disabled = true;
    logOutput.textContent = 'Starting task...';
    statusDisplay.textContent = 'Status: pending';
    statusDisplay.className = 'status-pending';
    resultLink.innerHTML = 'The result will be displayed here after the task is completed...';
    if (intervalId) clearInterval(intervalId);

    try {
        // 2. Make the API call to start the aggregation task.
        const response = await fetch('/api/start-task', { method: 'POST' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        taskId = data.taskId;
        if (!taskId) {
            throw new Error("Failed to get a task ID from the backend.");
        }

        statusDisplay.textContent = 'Status: Task started, waiting for logs...';
        statusDisplay.className = 'status-running';

        // 3. Start polling every 3 seconds to get status updates.
        intervalId = setInterval(checkTaskStatus, 3000);

    } catch (error) {
        console.error('Failed to start task:', error);
        logOutput.textContent = `Error starting task: ${error.message}`;
        statusDisplay.textContent = 'Status: Failed to start';
        statusDisplay.className = 'status-failed';
        startBtn.disabled = false;
    }
});
