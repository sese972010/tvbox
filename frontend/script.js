document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const keywordsInput = document.getElementById('keywords');
    const logOutput = document.getElementById('log-output');
    const resultLink = document.getElementById('result-link');

    // API的根URL，部署后需要替换成真实的Worker URL
    const API_BASE_URL = 'https://tvbox-source-aggregator.your-worker-name.workers.dev';

    let taskId = null;
    let pollInterval = null;

    startButton.addEventListener('click', async () => {
        const keywords = keywordsInput.value.trim();

        // UI状态重置
        logOutput.textContent = '';
        resultLink.textContent = '任务完成后将在此处显示...';
        startButton.disabled = true;
        startButton.textContent = '正在处理...';

        log('任务请求已发送，等待后端响应...');

        try {
            // 1. 调用/start-task启动任务
            const response = await fetch(`${API_BASE_URL}/start-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords: keywords || null })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '启动任务失败');
            }

            const data = await response.json();
            taskId = data.taskId;
            log(`后端任务已启动，任务ID: ${taskId}`);

            // 2. 开始轮询/task-status获取状态
            pollInterval = setInterval(getTaskStatus, 2000); // 每2秒查询一次

        } catch (error) {
            log(`错误: ${error.message}`);
            resetUI();
        }
    });

    async function getTaskStatus() {
        if (!taskId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/task-status?taskId=${taskId}`);
            if (!response.ok) {
                // 如果API返回错误（例如404），说明任务可能已完成并被清理
                log('无法获取任务状态，可能任务已完成或已过期。');
                stopPolling();
                getResult(); // 尝试获取最终结果
                return;
            }

            const data = await response.json();

            // 更新日志显示
            if (data.logs && logOutput.textContent !== data.logs) {
                logOutput.textContent = data.logs;
                logOutput.scrollTop = logOutput.scrollHeight;
            }

            if (data.status === 'completed') {
                log('任务已完成！正在获取最终结果...');
                stopPolling();
                getResult();
            } else if (data.status === 'failed') {
                log(`任务失败: ${data.error}`);
                stopPolling();
                resetUI();
            }

        } catch (error) {
            log(`轮询状态时出错: ${error.message}`);
            stopPolling();
            resetUI();
        }
    }

    async function getResult() {
        if (!taskId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/get-result?taskId=${taskId}`);
            const data = await response.json();

            if (response.ok) {
                const finalJsonString = JSON.stringify(data.result, null, 2);
                // 为了能在UI上直接展示，我们创建一个可下载的链接
                const blob = new Blob([finalJsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                resultLink.innerHTML = `<a href="${url}" download="tvbox_source.json">点击下载聚合后的订阅文件</a>`;
                log('订阅文件已生成！');
            } else {
                throw new Error(data.error || '获取结果失败');
            }
        } catch (error) {
            log(`获取最终结果时出错: ${error.message}`);
        } finally {
            resetUI();
        }
    }

    function log(message) {
        const timestamp = new Date().toLocaleTimeString();
        // 避免在已有日志上重复添加时间戳
        if (!message.startsWith('[')) {
            logOutput.textContent += `[${timestamp}] ${message}\n`;
        } else {
            logOutput.textContent = message; // 直接替换为后端传来的完整日志
        }
        logOutput.scrollTop = logOutput.scrollHeight;
    }

    function stopPolling() {
        clearInterval(pollInterval);
        pollInterval = null;
    }

    function resetUI() {
        startButton.disabled = false;
        startButton.textContent = '开始聚合';
        taskId = null;
    }
});