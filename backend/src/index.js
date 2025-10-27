// --- FINAL Production-Ready Script with CPU Limit Fix ---

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
    log('任务开始: 聚合TVBox源');

    // Step 1: Search GitHub (No changes needed here)
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

    // Step 2: Download files (No changes needed here)
    log(`步骤 2/4: 正在下载 ${sourceUrls.length} 个文件...`);
    const downloadPromises = sourceUrls.map(url => fetch(url).then(res => res.json()).catch(err => ({ error: err.message, url })));
    const downloadResults = await await Promise.allSettled(downloadPromises);

    // Step 3: Merge content (No changes here, we still build the objects in memory)
    log('步骤 3/4: 正在合并内容...');
    const sites = [], lives = [], rules = [], ads = [];
    let spider = null;
    const siteKeys = new Set(), liveNames = new Set(), ruleNames = new Set();

    for (const result of downloadResults) {
      if (result.status === 'fulfilled' && !result.value.error) {
        const sourceJson = result.value;
        if (Array.isArray(sourceJson.sites)) sourceJson.sites.forEach(s => { if (s.key && !siteKeys.has(s.key)) { sites.push(s); siteKeys.add(s.key); } });
        if (Array.isArray(sourceJson.lives)) sourceJson.lives.forEach(l => { if (l.name && !liveNames.has(l.name)) { lives.push(l); liveNames.add(l.name); } });
        if (Array.isArray(sourceJson.rules)) sourceJson.rules.forEach(r => { if (r.name && !ruleNames.has(r.name)) { rules.push(r); ruleNames.add(r.name); } });
        if (Array.isArray(sourceJson.ads)) ads.push(...sourceJson.ads);
        if (sourceJson.spider && !spider) spider = sourceJson.spider;
      }
    }
    log(`合并完成。聚合结果: ${sites.length} 站点, ${lives.length} 直播源, ${rules.length} 规则。`);

    // Step 4: **THE FIX** - Write to KV in chunks to avoid CPU limit
    log('步骤 4/4: 正在将结果分块写入永久存储...');
    if (!env.TVBOX_KV) throw new Error("关键配置错误: 未绑定KV存储 'TVBOX_KV'。");

    // We stringify and write each major component separately.
    log('--> 正在写入 [sites]...');
    await env.TVBOX_KV.put('result_sites', JSON.stringify(sites));
    log('--> [sites] 写入成功。');

    log('--> 正在写入 [lives]...');
    await env.TVBOX_KV.put('result_lives', JSON.stringify(lives));
    log('--> [lives] 写入成功。');

    log('--> 正在写入 [rules]...');
    await env.TVBOX_KV.put('result_rules', JSON.stringify(rules));
    log('--> [rules] 写入成功。');

    log('--> 正在写入 [ads]...');
    await env.TVBOX_KV.put('result_ads', JSON.stringify(ads));
    log('--> [ads] 写入成功。');

    log('--> 正在写入 [spider]...');
    await env.TVBOX_KV.put('result_spider', spider || ""); // Store spider, or empty string if null
    log('--> [spider] 写入成功。');

    log('全部分块写入成功！');

    tasks[taskId].status = 'completed';
    // The result is no longer a giant JSON, just a success message.
    tasks[taskId].result = { message: "聚合成功并已存入KV。" };

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

    if (pathname === '/task-status') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务不存在或已过期' }, 404);
      return jsonResponse(tasks[taskId]);
    }

    if (pathname === '/subscribe') {
      if (!env.TVBOX_KV) return jsonResponse({ error: "后端配置错误: 未绑定KV存储。" }, 500);

      // **THE FIX** - Read chunks from KV and assemble the final JSON on the fly.
      const [sites, lives, rules, ads, spider] = await Promise.all([
        env.TVBOX_KV.get('result_sites'),
        env.TVBOX_KV.get('result_lives'),
        env.TVBOX_KV.get('result_rules'),
        env.TVBOX_KV.get('result_ads'),
        env.TVBOX_KV.get('result_spider'),
      ]);

      if (sites === null) return jsonResponse({ message: "订阅源尚未生成，请先运行一次聚合任务。" }, 404);

      // This is just string concatenation, which is very fast and non-blocking.
      const finalJsonString = `{
        "sites": ${sites || '[]'},
        "lives": ${lives || '[]'},
        "rules": ${rules || '[]'},
        "ads": ${ads || '[]'},
        "spider": ${spider ? `"${spider}"` : 'null'}
      }`;

      return new Response(finalJsonString, {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8', ...corsHeaders },
      });
    }

    return jsonResponse({ error: `路径 '${pathname}' 未找到` }, 404);
  },
};
