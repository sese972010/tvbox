// --- FINAL Cloudflare Pages Function (_worker.js) ---
// Version 2.0.1 - With Enhanced Error Handling

// In-memory store for task statuses. This is temporary and resets on worker deploy.
const tasks = {};

// Helper for creating consistent JSON responses with CORS headers.
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
     },
  });
}

// The core aggregation logic that runs asynchronously.
async function runAggregation(taskId, env) {
  // Helper to log progress into the in-memory task object.
  const log = (message) => {
    if (tasks[taskId]) {
      tasks[taskId].logs += `[${new Date().toISOString()}] ${message}\n`;
    }
  };

  try {
    tasks[taskId].status = 'running';
    log('任务开始: 聚合TVBox源 (Pages Functions 模式)');

    // Step 1: Search GitHub for source files.
    log('步骤 1/3: 正在从 GitHub 搜索源文件...');
    const ghToken = env.GH_TOKEN;
    if (!ghToken) {
      throw new Error("关键配置错误: 未在Pages项目的'设置'->'变量'中配置 GH_TOKEN。");
    }
    const query = 'q=sites+spider+extension:json+tvbox';
    const searchUrl = `https://api.github.com/search/code?${query}`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${ghToken}`,
        'User-Agent': 'TVBox-Aggregator'
      }
    });
    if (!searchResponse.ok) {
      throw new Error(`GitHub API 搜索失败: ${searchResponse.status} ${await searchResponse.text()}`);
    }
    const searchResult = await searchResponse.json();
    const sourceUrls = searchResult.items.map(item => item.html_url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'));

    if (sourceUrls.length === 0) {
      log("警告: GitHub API搜索未找到任何源文件。任务提前结束。");
      tasks[taskId].status = 'completed';
      return;
    }
    log(`搜索完成，发现 ${sourceUrls.length} 个潜在源。`);

    // Step 2: Download all found files and merge them.
    log(`步骤 2/3: 正在下载并合并 ${sourceUrls.length} 个文件...`);
    const downloadPromises = sourceUrls.map(url =>
      fetch(url).then(res => res.json()).catch(() => null)
    );
    const downloadResults = await Promise.all(downloadPromises);

    const aggregatedJson = { "sites": [], "lives": [], "rules": [], "ads": [], "spider": null };
    const siteKeys = new Set(), liveNames = new Set(), ruleNames = new Set();

    for (const sourceJson of downloadResults) {
      if (!sourceJson) continue;
      if (Array.isArray(sourceJson.sites)) sourceJson.sites.forEach(s => { if (s && s.key && !siteKeys.has(s.key)) { aggregatedJson.sites.push(s); siteKeys.add(s.key); } });
      if (Array.isArray(sourceJson.lives)) sourceJson.lives.forEach(l => { if (l && l.name && !liveNames.has(l.name)) { aggregatedJson.lives.push(l); liveNames.add(l.name); } });
      if (Array.isArray(sourceJson.rules)) sourceJson.rules.forEach(r => { if (r && r.name && !ruleNames.has(r.name)) { aggregatedJson.rules.push(r); ruleNames.add(r.name); } });
      if (Array.isArray(sourceJson.ads)) aggregatedJson.ads.push(...sourceJson.ads);
      if (sourceJson.spider && !aggregatedJson.spider) aggregatedJson.spider = sourceJson.spider;
    }
    log(`合并完成。聚合结果: ${aggregatedJson.sites.length} 站点, ${aggregatedJson.lives.length} 直播源, ${aggregatedJson.rules.length} 规则。`);

    // Step 3: Write the final aggregated JSON to the KV store.
    log('步骤 3/3: 正在将聚合结果写入KV存储...');
    if (!env.TVBOX_KV) {
      throw new Error("关键配置错误: 未绑定KV存储 'TVBOX_KV'。请在Pages项目的'设置'->'函数'->'KV命名空间绑定'中配置。");
    }

    const jsonString = JSON.stringify(aggregatedJson, null, 2);
    await env.TVBOX_KV.put('latest_result', jsonString);

    log('写入KV存储成功！');
    log('任务成功完成！');

    tasks[taskId].status = 'completed';
    tasks[taskId].result = { message: "聚合成功并已存入KV。" };

  } catch (error) {
    log(`任务失败: ${error.message}`);
    console.error(error); // Log full error for debugging
    tasks[taskId].status = 'failed';
    tasks[taskId].error = error.message;
  }
}

/**
 * The `onRequest` function is the entry point for all requests to the Pages site.
 * It acts as a router and middleware.
 * @param {EventContext<Env, any, Record<string, unknown>>} context
 */
export async function onRequest(context) {
  // **NEW**: Add a global try-catch block to prevent 1019 errors.
  try {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // --- API ROUTER ---
    if (url.pathname === '/api/start-task') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }});
      }

      const taskId = `task-${Date.now()}`;
      tasks[taskId] = { id: taskId, status: 'pending', logs: '', result: null, error: null };
      context.waitUntil(runAggregation(taskId, env));
      return jsonResponse({ message: '任务已启动', taskId: taskId });
    }

    if (url.pathname === '/api/task-status') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId || !tasks[taskId]) {
        return jsonResponse({ error: '任务ID不存在或已过期' }, 404);
      }
      const { status, logs, error } = tasks[taskId];
      return jsonResponse({ status, logs, error });
    }

    // --- DYNAMIC CONTENT ROUTE ---
    if (url.pathname === '/subscribe.json') {
      if (!env.TVBOX_KV) {
        return jsonResponse({ error: "后端配置错误: 未绑定KV存储。" }, 500);
      }
      const latestResult = await env.TVBOX_KV.get('latest_result');
      if (latestResult === null) {
        return jsonResponse({ "sites": [], "note": "No aggregated data found. Please run the aggregation task first." }, 404);
      }

      return new Response(latestResult, {
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      });
    }

    // For any other request, pass it to the static asset server.
    return next();

  } catch (error) {
    // If ANY unhandled error occurs, return a detailed error response
    // instead of crashing with a 1019 error.
    console.error('Unhandled error in onRequest:', error);
    return new Response(
      `An unexpected error occurred: ${error.message}\n\nStack Trace:\n${error.stack}`,
      { status: 500 }
    );
  }
}
