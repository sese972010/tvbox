document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const keywordsInput = document.getElementById('keywords');
    const logOutput = document.getElementById('log-output');
    const resultLink = document.getElementById('result-link');

    // API的根URL，部署后需要替换成真实的Worker URL
    const API_BASE_URL = 'https://tvbox-api.pimm520.qzz.io';

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
            const response = await fetch(`${API_BASE_URL}/start-task`);

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
        // 【UI升级】任务完成后，不再获取临时结果，而是直接显示永久订阅地址
        try {
            // 确保 API_BASE_URL 末尾没有斜杠，以构建正确的订阅地址
            const cleanApiBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            const subscribeUrl = `${cleanApiBase}/subscribe`;

            resultLink.innerHTML = `您的永久订阅地址已更新，请复制以下地址到TVBox中：<br><a href="${subscribeUrl}" target="_blank">${subscribeUrl}</a>`;
            log('永久订阅地址已更新！');

            // （可选）我们仍然可以获取一次结果，以便用户需要立即下载
            const response = await fetch(`${API_BASE_URL}/get-result?taskId=${taskId}`);
            if (!response.ok) {
              log('（备用下载链接生成失败，但不影响永久地址的使用。）');
            }
        } catch (error) {
            log(`在尝试显示永久订阅地址时发生错误: ${error.message}`);
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