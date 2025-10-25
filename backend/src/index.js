// 【核心修正】: 直接使用现代ESM `import` 语法，移除所有不兼容的 'createRequire' 补丁
import { searchGithub } from './github_search.js';
import { validateAndFilterSources } from './validator.js';
import { mergeSources } from './merger.js';

// 简单的内存任务存储
const tasks = {};

export default {
    async fetch(request, env, ctx) { // 添加 ctx 参数
        const url = new URL(request.url);
        // 为所有响应添加CORS头
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        let response;
        try {
            if (url.pathname === '/start-task') {
                response = await handleStartTask(request, env, ctx); // 传递 ctx
            } else if (url.pathname === '/task-status') {
                response = handleTaskStatus(request);
            } else if (url.pathname === '/get-result') {
                response = handleGetResult(request);
            } else {
                response = new Response(JSON.stringify({ error: 'API端点不存在' }), { status: 404 });
            }
        } catch (e) {
            response = new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }

        // 将CORS头附加到最终响应
        const finalHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            finalHeaders.set(key, value);
        });
        if (!finalHeaders.has('Content-Type')) {
            finalHeaders.set('Content-Type', 'application/json');
        }

        return new Response(response.body, {
            status: response.status,
            headers: finalHeaders,
        });
    },
};

async function handleStartTask(request, env, ctx) { // 接收 ctx
    const { keywords } = await request.json();
    const githubToken = env.GH_TOKEN || null;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tasks[taskId] = {
        status: 'running',
        logs: `[${new Date().toLocaleTimeString()}] 任务已创建，ID: ${taskId}\n`,
        result: null,
        error: null,
    };

    // 异步执行，不阻塞响应
    ctx.waitUntil(runAggregation(taskId, keywords, githubToken));

    return new Response(JSON.stringify({ success: true, taskId }), { status: 202 });
}

function handleTaskStatus(request) {
    const taskId = new URL(request.url).searchParams.get('taskId');
    if (!taskId || !tasks[taskId]) {
        return new Response(JSON.stringify({ error: '任务未找到' }), { status: 404 });
    }
    return new Response(JSON.stringify(tasks[taskId]));
}

function handleGetResult(request) {
    const taskId = new URL(request.url).searchParams.get('taskId');
    if (!taskId || !tasks[taskId]) {
        return new Response(JSON.stringify({ error: '任务未找到' }), { status: 404 });
    }
    if (tasks[taskId].status !== 'completed') {
        return new Response(JSON.stringify({ error: '任务尚未完成' }), { status: 400 });
    }
    const result = tasks[taskId].result;

    // 结果被获取后，从内存中清除以节省空间
    delete tasks[taskId];

    return new Response(JSON.stringify({ result }));
}

async function runAggregation(taskId, keywords, githubToken) {
    const log = (message) => {
        tasks[taskId].logs += `[${new Date().toLocaleTimeString()}] ${message}\n`;
    };

    try {
        log('开始在GitHub上搜索源...');
        const urls = await searchGithub(keywords, githubToken);
        if (urls.length === 0) {
            throw new Error('在GitHub上未找到任何相关的源文件。');
        }
        log(`搜索完成，找到 ${urls.length} 个潜在的URL。`);

        log('开始验证和筛选源...');
        const validSources = await validateAndFilterSources(urls);
        if (validSources.length === 0) {
            throw new Error('所有找到的源都无法通过验证。');
        }
        log(`验证完成，有 ${validSources.length} 个有效源。`);

        log('开始合并源...');
        const mergedSource = mergeSources(validSources);
        log('合并完成！');

        tasks[taskId].status = 'completed';
        tasks[taskId].result = mergedSource;
        log('任务成功结束。');

    } catch (error) {
        console.error(`任务 ${taskId} 失败:`, error);
        tasks[taskId].status = 'failed';
        tasks[taskId].error = error.message;
        log(`任务失败: ${error.message}`);
    }
}
