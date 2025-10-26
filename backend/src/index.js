// 【最终版核心修正】: 采用更稳健的CORS处理模式，确保所有响应都包含正确的跨域头
import { searchGithub } from './github_search.js';
import { validateAndFilterSources } from './validator.js';
import { mergeSources } from './merger.js';

const tasks = {};

// 主fetch处理程序：捕获所有请求，处理CORS，并将请求分发给应用逻辑
export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // 首先处理CORS预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        let response;
        try {
            // 将请求传递给核心应用逻辑
            response = await handleRequest(request, env, ctx);
        } catch (err) {
            console.error(err); // 在后台记录真实错误
            response = new Response(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 创建一个可变的新响应，并确保CORS头被应用到每一个从这里发出的响应上
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            newResponse.headers.set(key, value);
        });

        return newResponse;
    },
};

// 核心应用逻辑：处理路由和具体任务
async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);

    switch (url.pathname) {
        case '/start-task':
            return await handleStartTask(request, env, ctx);
        case '/task-status':
            return handleTaskStatus(request);
        case '/get-result':
            return handleGetResult(request);
        default:
            return new Response(JSON.stringify({ error: 'API端点不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
    }
}


async function handleStartTask(request, env, ctx) {
    const { keywords } = await request.json();
    const githubToken = env.GH_TOKEN || null;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tasks[taskId] = {
        status: 'running',
        logs: `[${new Date().toLocaleTimeString()}] 任务已创建，ID: ${taskId}\n`,
        result: null,
        error: null,
    };

    ctx.waitUntil(runAggregation(taskId, keywords, githubToken));

    return new Response(JSON.stringify({ success: true, taskId }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
    });
}

function handleTaskStatus(request) {
    const taskId = new URL(request.url).searchParams.get('taskId');
    if (!taskId || !tasks[taskId]) {
        return new Response(JSON.stringify({ error: '任务未找到' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(tasks[taskId]), { headers: { 'Content-Type': 'application/json' } });
}

function handleGetResult(request) {
    const taskId = new URL(request.url).searchParams.get('taskId');
    if (!taskId || !tasks[taskId]) {
        return new Response(JSON.stringify({ error: '任务未找到' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if (tasks[taskId].status !== 'completed') {
        return new Response(JSON.stringify({ error: '任务尚未完成' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const result = tasks[taskId].result;
    delete tasks[taskId];
    return new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } });
}

async function runAggregation(taskId, keywords, githubToken) {
    const log = (message) => {
        tasks[taskId].logs += `[${new Date().toLocaleTimeString()}] ${message}\n`;
    };

    try {
        log('开始在GitHub上搜索源...');
        const urls = await searchGithub(keywords, githubToken);
        if (urls.length === 0) throw new Error('在GitHub上未找到任何相关的源文件。');
        log(`搜索完成，找到 ${urls.length} 个潜在的URL。`);

        log('开始验证和筛选源...');
        const validSources = await validateAndFilterSources(urls);
        if (validSources.length === 0) throw new Error('所有找到的源都无法通过验证。');
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
