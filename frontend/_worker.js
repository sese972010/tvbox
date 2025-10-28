// --- FINAL Cloudflare Pages Function (_worker.js) ---
// Version 3.0.0 - Failsafe Restructure and Canary Route

/**
 * Why this file was restructured:
 * The persistent "Error 1019" even with a try-catch block suggests that the Cloudflare runtime
 * was failing to even parse this file, crashing before our code could execute.
 * This new structure uses a more explicit `export default` with an object containing the `fetch` handler.
 * This is a more robust pattern that can avoid subtle parsing issues.
 * We also add a simple `/api/ping` route as a "canary" to test if the worker is alive at all.
 */

const tasks = {};

// Helper for creating consistent JSON responses.
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  });
}

// The core aggregation logic.
async function runAggregation(taskId, env) {
  const log = (message) => {
    if (tasks[taskId]) tasks[taskId].logs += `[${new Date().toISOString()}] ${message}\n`;
  };

  try {
    tasks[taskId].status = 'running';
    log('任务开始: 聚合TVBox源');

    // Step 1: Search GitHub
    log('步骤 1/3: 正在从 GitHub 搜索...');
    const ghToken = env.GH_TOKEN;
    if (!ghToken) throw new Error("配置错误: 未找到 GH_TOKEN。请在Pages项目设置中添加此环境变量。");

    const query = 'q=sites+spider+extension:json+tvbox';
    const searchUrl = `https://api.github.com/search/code?${query}`;
    const searchResponse = await fetch(searchUrl, { headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${ghToken}`, 'User-Agent': 'TVBox-Aggregator' } });
    if (!searchResponse.ok) throw new Error(`GitHub API 搜索失败: ${searchResponse.status}`);

    const searchResult = await searchResponse.json();
    const sourceUrls = searchResult.items.map(item => item.html_url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'));
    if (sourceUrls.length === 0) {
      log("警告: 未找到任何源文件。");
      tasks[taskId].status = 'completed';
      return;
    }
    log(`搜索完成，发现 ${sourceUrls.length} 个潜在源。`);

    // Step 2: Download and Merge
    log(`步骤 2/3: 正在下载并合并...`);
    const downloadPromises = sourceUrls.map(url => fetch(url).then(res => res.json()).catch(() => null));
    const downloadResults = await Promise.all(downloadPromises);

    const aggregatedJson = { "sites": [], "lives": [], "rules": [], "ads": [], "spider": null };
    const siteKeys = new Set(), liveNames = new Set(), ruleNames = new Set();

    for (const sourceJson of downloadResults) {
      if (sourceJson) {
        if (Array.isArray(sourceJson.sites)) sourceJson.sites.forEach(s => { if (s && s.key && !siteKeys.has(s.key)) { aggregatedJson.sites.push(s); siteKeys.add(s.key); } });
        if (Array.isArray(sourceJson.lives)) sourceJson.lives.forEach(l => { if (l && l.name && !liveNames.has(l.name)) { aggregatedJson.lives.push(l); liveNames.add(l.name); } });
        if (Array.isArray(sourceJson.rules)) sourceJson.rules.forEach(r => { if (r && r.name && !ruleNames.has(r.name)) { aggregatedJson.rules.push(r); ruleNames.add(r.name); } });
      }
    }
    log(`合并完成。结果: ${aggregatedJson.sites.length} 站点, ${aggregatedJson.lives.length} 直播源, ${aggregatedJson.rules.length} 规则。`);

    // Step 3: Write to KV
    log('步骤 3/3: 正在写入KV存储...');
    if (!env.TVBOX_KV) throw new Error("配置错误: 未绑定 'TVBOX_KV'。请在Pages项目设置中绑定KV命名空间。");

    await env.TVBOX_KV.put('latest_result', JSON.stringify(aggregatedJson, null, 2));

    log('写入KV存储成功！任务完成！');
    tasks[taskId].status = 'completed';

  } catch (error) {
    log(`任务失败: ${error.message}`);
    tasks[taskId].status = 'failed';
    tasks[taskId].error = error.message;
  }
}

// This is the main fetch handler for all incoming requests.
// By destructuring the context object in the function signature, we get direct access to request, env, and next.
const fetchHandler = async ({ request, env, next }) => {
  try {
    const url = new URL(request.url);

    // --- NEW CANARY ROUTE ---
    // A simple test to see if the worker is executing at all.
    if (url.pathname === '/api/ping') {
      return jsonResponse({ status: "pong", message: "Worker is alive!" });
    }

    // --- API ROUTER ---
    if (url.pathname === '/api/start-task') {
      const taskId = `task-${Date.now()}`;
      tasks[taskId] = { id: taskId, status: 'pending', logs: '', result: null, error: null };
      context.waitUntil(runAggregation(taskId, env));
      return jsonResponse({ message: '任务已启动', taskId: taskId });
    }

    if (url.pathname === '/api/task-status') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务ID不存在' }, 404);
      return jsonResponse(tasks[taskId]);
    }

    // --- DYNAMIC CONTENT ROUTE ---
    if (url.pathname === '/subscribe.json') {
      if (!env.TVBOX_KV) return jsonResponse({ error: "后端配置错误: 未绑定KV存储。" }, 500);
      const latestResult = await env.TVBOX_KV.get('latest_result');
      if (latestResult === null) return jsonResponse({ "sites": [], "note": "尚未生成聚合数据。请先运行聚合任务。" }, 404);
      return new Response(latestResult, { headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
    }

    // For any other request, serve the static assets from the `frontend` directory.
    return next();

  } catch (e) {
    // This catch block will now properly execute if any error happens *during* runtime.
    return new Response(`Worker runtime error: ${e.message}\n${e.stack}`, { status: 500 });
  }
};

// Export the fetch handler in the robust object format.
export default {
  fetch: fetchHandler,
};
