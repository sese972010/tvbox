// --- FINAL STATIC FILE WRITER SCRIPT (v2 - with fixes) ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-control-allow-headers': 'Content-Type',
};

const tasks = {};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8', ...corsHeaders },
  });
}

async function runAggregation(taskId, env) {
  const log = (message) => {
    if (tasks[taskId]) tasks[taskId].logs += `[${new Date().toLocaleTimeString()}] ${message}\n`;
  };

  try {
    tasks[taskId].status = 'running';
    log('任务开始: 聚合TVBox源 (静态文件写入模式)');

    // Steps 1, 2, 3: Search, Download, Merge
    log('步骤 1/4: 正在从 GitHub 搜索源文件...');
    const ghToken = env.GH_TOKEN;
    if (!ghToken) throw new Error("关键配置错误: 未找到 GH_TOKEN。");
    const query = 'q=sites+spider+extension:json+tvbox';
    const searchUrl = `https://api.github.com/search/code?${query}`;
    const searchResponse = await fetch(searchUrl, { headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${ghToken}`, 'User-Agent': 'TVBox-Aggregator-Worker' } });
    if (!searchResponse.ok) throw new Error(`GitHub API 搜索失败: ${searchResponse.status}`);
    const searchResult = await searchResponse.json();
    const sourceUrls = searchResult.items.map(item => item.html_url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'));
    if (sourceUrls.length === 0) {
      log("警告: 未找到任何源文件。");
      tasks[taskId].status = 'completed';
      return;
    }
    log(`搜索完成，发现 ${sourceUrls.length} 个潜在源。`);

    log(`步骤 2/4: 正在下载 ${sourceUrls.length} 个文件...`);
    const downloadPromises = sourceUrls.map(url => fetch(url).then(res => res.json()).catch(err => ({ error: err.message, url })));
    const downloadResults = await await Promise.allSettled(downloadPromises);

    log('步骤 3/4: 正在合并内容...');
    const aggregatedJson = { "sites": [], "lives": [], "rules": [], "ads": [], "spider": null };
    const siteKeys = new Set(), liveNames = new Set(), ruleNames = new Set();

    for (const result of downloadResults) {
      if (result.status === 'fulfilled' && !result.value.error) {
        const sourceJson = result.value;
        if (Array.isArray(sourceJson.sites)) sourceJson.sites.forEach(s => { if (s.key && !siteKeys.has(s.key)) { aggregatedJson.sites.push(s); siteKeys.add(s.key); } });
        if (Array.isArray(sourceJson.lives)) sourceJson.lives.forEach(l => { if (l.name && !liveNames.has(l.name)) { lives.push(l); liveNames.add(l.name); } });
        if (Array.isArray(sourceJson.rules)) sourceJson.rules.forEach(r => { if (r.name && !ruleNames.has(r.name)) { rules.push(r); ruleNames.add(r.name); } });
        if (Array.isArray(sourceJson.ads)) aggregatedJson.ads.push(...sourceJson.ads);
        if (sourceJson.spider && !aggregatedJson.spider) aggregatedJson.spider = sourceJson.spider;
      }
    }
    log(`合并完成。聚合结果: ${aggregatedJson.sites.length} 站点, ${aggregatedJson.lives.length} 直播源, ${aggregatedJson.rules.length} 规则。`);

    // Step 4: Write result to a static file in the Pages project
    log('步骤 4/4: 正在将聚合结果写入静态文件 (public/subscribe.json)...');

    if (!env.PAGES_PROJECT) throw new Error("关键配置错误: 未绑定Pages项目 'PAGES_PROJECT'。");
    if (!env.PAGES_PROJECT_NAME) throw new Error("关键配置错误: 未设置Pages项目名称 'PAGES_PROJECT_NAME'。");

    const jsonString = JSON.stringify(aggregatedJson, null, 2);

    const formData = new FormData();
    formData.append('file', new Blob([jsonString], { type: 'application/json' }), '/public/subscribe.json');

    // Use the environment variable for the project name
    const projectName = env.PAGES_PROJECT_NAME;
    const response = await env.PAGES_PROJECT.fetch(`https://_api.pages.dev/v1/projects/${projectName}/deployments`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`写入静态文件失败: ${response.status} ${errorText}`);
    }

    log('静态文件写入成功！订阅链接已更新。');
    log('任务成功完成！');

    tasks[taskId].status = 'completed';
    tasks[taskId].result = { message: "聚合成功并已写入静态文件。" };

  } catch (error) {
    log(`任务失败: ${error.message}`);
    tasks[taskId].status = 'failed';
    tasks[taskId].error = error.message;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    if (pathname === '/start-task') {
      const taskId = `task-${Date.now()}`;
      tasks[taskId] = { id: taskId, status: 'pending', logs: '', result: null, error: null };
      ctx.waitUntil(runAggregation(taskId, env));
      return jsonResponse({ message: '任务已启动', taskId: taskId });
    }

    // **FIX**: Restore the /task-status endpoint for the frontend to poll
    if (pathname === '/task-status') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务不存在或已过期' }, 404);
      const { status, logs, error } = tasks[taskId];
      return jsonResponse({ status, logs, error });
    }

    return jsonResponse({ error: `路径 '${pathname}' 未找到。请注意：订阅地址已变更为 /subscribe.json` }, 404);
  },
};
