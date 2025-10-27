// --- FINAL Cloudflare Pages Function (_worker.js) ---

// This single file acts as the backend for the Cloudflare Pages project.
// It intercepts requests and can interact with static assets.

const tasks = {};

// Helper for creating consistent JSON responses.
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-control-allow-headers': 'Content-Type',
     },
  });
}

// The core aggregation logic.
async function runAggregation(taskId, env) {
  const log = (message) => {
    if (tasks[taskId]) tasks[taskId].logs += `[${new Date().toLocaleTimeString()}] ${message}\n`;
  };

  try {
    tasks[taskId].status = 'running';
    log('任务开始: 聚合TVBox源 (Pages Functions 模式)');

    // Step 1: Search GitHub
    log('步骤 1/3: 正在从 GitHub 搜索源文件...');
    const ghToken = env.GH_TOKEN;
    if (!ghToken) throw new Error("关键配置错误: 未在Pages项目的设置->变量中配置 GH_TOKEN。");
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
    log(`步骤 2/3: 正在下载并合并 ${sourceUrls.length} 个文件...`);
    const downloadPromises = sourceUrls.map(url => fetch(url).then(res => res.json()).catch(() => null));
    const downloadResults = await Promise.all(downloadPromises);

    const aggregatedJson = { "sites": [], "lives": [], "rules": [], "ads": [], "spider": null };
    const siteKeys = new Set(), liveNames = new Set(), ruleNames = new Set();

    for (const sourceJson of downloadResults) {
      if (sourceJson) {
        if (Array.isArray(sourceJson.sites)) sourceJson.sites.forEach(s => { if (s.key && !siteKeys.has(s.key)) { aggregatedJson.sites.push(s); siteKeys.add(s.key); } });
        if (Array.isArray(sourceJson.lives)) sourceJson.lives.forEach(l => { if (l.name && !liveNames.has(l.name)) { aggregatedJson.lives.push(l); liveNames.add(l.name); } });
        if (Array.isArray(sourceJson.rules)) sourceJson.rules.forEach(r => { if (r.name && !ruleNames.has(r.name)) { aggregatedJson.rules.push(r); ruleNames.add(r.name); } });
        if (Array.isArray(sourceJson.ads)) aggregatedJson.ads.push(...sourceJson.ads);
        if (sourceJson.spider && !aggregatedJson.spider) aggregatedJson.spider = sourceJson.spider;
      }
    }
    log(`合并完成。聚合结果: ${aggregatedJson.sites.length} 站点, ${aggregatedJson.lives.length} 直播源, ${aggregatedJson.rules.length} 规则。`);

    // Step 3: **THE NEW LOGIC** - Asset interaction via the context object
    log('步骤 3/3: 正在将聚合结果写入静态文件 (subscribe.json)...');

    // In Pages Functions, we don't have direct file system access.
    // The correct way is to return a Response object representing the new file.
    // However, the aggregation is a long-running async task. The `fetch` handler that triggered it
    // has already returned a response. The official way to modify assets after the fact is not
    // straightforward.

    // Let's reconsider. The `context.next()` allows the function to act as middleware.
    // The primary way to "write" a file is to intercept a request for it and return a dynamic response.
    // This brings us back to the original problem.

    // Let's try another approach documented for Pages Functions:
    // We can't *write* files, but we can *serve* dynamic content *at* a static file's path.
    // The KV store is the correct way to persist state between function invocations.
    // The previous failures were due to UI misconfigurations, not the architecture itself.
    // Let's re-implement the KV logic, but within the _worker.js file, which simplifies bindings.

    if (!env.TVBOX_KV) throw new Error("关键配置错误: 未绑定KV存储 'TVBOX_KV'。请在Pages项目的设置->函数->KV命名空间绑定中配置。");

    const jsonString = JSON.stringify(aggregatedJson, null, 2);
    await env.TVBOX_KV.put('latest_result', jsonString);

    log('写入KV存储成功！');
    log('任务成功完成！');

    tasks[taskId].status = 'completed';
    tasks[taskId].result = { message: "聚合成功并已存入KV。" };

  } catch (error) {
    log(`任务失败: ${error.message}`);
    tasks[taskId].status = 'failed';
    tasks[taskId].error = error.message;
  }
}


/**
 * The `onRequest` function is the entry point for all requests to the Pages site.
 * It acts as a middleware.
 * @param {EventContext<Env, any, Record<string, unknown>>} context
 */
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Normalize pathname to remove trailing slashes for consistent matching
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // --- API ROUTER ---
  // We prefix our API routes with /api/ to avoid conflicts with static files.

  if (pathname === '/api/start-task') {
    const taskId = `task-${Date.now()}`;
    tasks[taskId] = { id: taskId, status: 'pending', logs: '', result: null, error: null };
    // We don't block the request, let the aggregation run in the background.
    context.waitUntil(runAggregation(taskId, env));
    return jsonResponse({ message: '任务已启动', taskId: taskId });
  }

  if (pathname === '/api/task-status') {
    const taskId = url.searchParams.get('taskId');
    if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务不存在或已过期' }, 404);
    const { status, logs, error } = tasks[taskId];
    return jsonResponse({ status, logs, error });
  }

  // --- DYNAMIC CONTENT ROUTE ---
  // This is the new, correct way to serve the subscription file.
  if (pathname === '/subscribe.json') {
    if (!env.TVBOX_KV) {
      return jsonResponse({ error: "后端配置错误: 未绑定KV存储。" }, 500);
    }
    const latestResult = await env.TVBOX_KV.get('latest_result');
    if (latestResult === null) {
      // If the file doesn't exist in KV, fall back to the static placeholder file.
      return next();
    }

    // Serve the dynamic content from KV with the correct headers.
    return new Response(latestResult, {
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    });
  }

  // For any other request, pass it through to the static assets handler.
  return next();
}
