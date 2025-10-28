// --- TVBox Aggregator _worker.js - Final Version 4.0 ---
// This version is a complete rewrite focusing on maximum simplicity and compatibility
// to eliminate any potential Cloudflare Pages runtime parsing errors.

/**
 * Creates a standard JSON response object.
 * @param {any} data - The data to be stringified.
 * @param {number} status - The HTTP status code.
 * @returns {Response}
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
        status: status,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
    });
}

/**
 * The core aggregation logic. This function runs in the background.
 * @param {string} taskId - The unique ID for this task.
 * @param {object} env - The environment object containing secrets and bindings.
 */
async function runAggregation(taskId, env) {
    // A simple in-memory log. In a real-world scenario, this might use a more persistent store.
    const logs = [];
    const log = (message) => logs.push(`[${new Date().toISOString()}] ${message}`);

    // In-memory task state.
    let taskState = { status: 'running', logs: '' };
    const updateTaskState = () => {
        taskState.logs = logs.join('\n');
        // Note: This is a simplified in-memory approach. In a multi-worker environment,
        // a KV store or Durable Object would be needed to share state. For this single-user
        // deploy, this is sufficient.
    };

    try {
        log('任务开始: 聚合TVBox源');
        updateTaskState();

        // 1. Search GitHub for source files.
        log('步骤 1/3: 正在从 GitHub 搜索...');
        const ghToken = env.GH_TOKEN;
        if (!ghToken) throw new Error("配置错误: 未找到 GH_TOKEN 环境变量。");

        const query = 'q=sites+spider+extension:json+tvbox';
        const searchUrl = `https://api.github.com/search/code?${query}`;
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${ghToken}`,
                'User-Agent': 'TVBox-Aggregator-Cloudflare'
            }
        });
        if (!searchResponse.ok) throw new Error(`GitHub API 搜索失败: ${searchResponse.status}`);
        const searchResult = await searchResponse.json();
        const sourceUrls = searchResult.items.map(item => item.html_url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'));

        if (sourceUrls.length === 0) {
            log("警告: 未找到任何源文件。任务结束。");
            taskState.status = 'completed';
            updateTaskState();
            await env.TVBOX_KV.put(taskId, JSON.stringify(taskState));
            return;
        }
        log(`搜索完成，发现 ${sourceUrls.length} 个潜在源。`);
        updateTaskState();

        // 2. Download and merge all sources.
        log('步骤 2/3: 正在下载并合并...');
        const downloadPromises = sourceUrls.map(url => fetch(url).then(res => res.json()).catch(() => null));
        const downloadResults = await Promise.all(downloadPromises);

        const aggregatedJson = { "sites": [], "lives": [], "rules": [] };
        const siteKeys = new Set();
        for (const sourceJson of downloadResults) {
            if (sourceJson && Array.isArray(sourceJson.sites)) {
                sourceJson.sites.forEach(site => {
                    if (site && site.key && !siteKeys.has(site.key)) {
                        aggregatedJson.sites.push(site);
                        siteKeys.add(site.key);
                    }
                });
            }
        }
        log(`合并完成。聚合站点数: ${aggregatedJson.sites.length}`);
        updateTaskState();

        // 3. Store the final result in the KV store.
        log('步骤 3/3: 正在将最终结果写入KV...');
        if (!env.TVBOX_KV) throw new Error("配置错误: 未绑定 TVBOX_KV 命名空间。");

        // We store the result under a consistent key to be retrieved by the /subscribe.json endpoint.
        await env.TVBOX_KV.put('latest_aggregated_result', JSON.stringify(aggregatedJson, null, 2));
        log('写入成功！');

        taskState.status = 'completed';
        updateTaskState();
        // Also save the final log to the task-specific key.
        await env.TVBOX_KV.put(taskId, JSON.stringify(taskState));

    } catch (error) {
        log(`任务失败: ${error.message}`);
        taskState.status = 'failed';
        taskState.error = error.message;
        updateTaskState();
        await env.TVBOX_KV.put(taskId, JSON.stringify(taskState));
    }
}


/**
 * This is the main entry point for all requests.
 * It follows the most standard and robust signature for Cloudflare Pages Functions.
 * @param {object} context - The context object provided by the Cloudflare runtime.
 */
export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // --- API: Start Task ---
    if (url.pathname === '/api/start-task' && request.method === 'POST') {
        const taskId = `task-${Date.now()}`;
        // We don't wait for the aggregation to finish. It runs in the background.
        context.waitUntil(runAggregation(taskId, env));
        // Immediately return the task ID so the frontend can start polling.
        return jsonResponse({
            message: '任务已启动，请稍后查询状态。',
            taskId: taskId
        });
    }

    // --- API: Get Task Status ---
    if (url.pathname === '/api/task-status') {
        const taskId = url.searchParams.get('taskId');
        if (!taskId) return jsonResponse({ error: '缺少 taskId' }, 400);

        const taskStateJson = await env.TVBOX_KV.get(taskId);
        if (!taskStateJson) return jsonResponse({ status: 'pending', logs: '正在初始化任务...' });

        return new Response(taskStateJson, { headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
    }

    // --- Dynamic Route: Get Subscription File ---
    if (url.pathname === '/subscribe.json') {
        const latestResult = await env.TVBOX_KV.get('latest_aggregated_result');
        if (!latestResult) {
            return jsonResponse({ note: "尚未生成聚合数据，请先启动聚合任务。" }, 404);
        }
        return new Response(latestResult, { headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
    }

    // If no route matches, serve the static assets from the `frontend` directory.
    return next();
}
