// 【最终功能版 - 用于手动部署】
// 1. 修正了 'Access-Control-Allow-Origin' 的拼写错误。
// 2. 增强了路由逻辑，使其能够正确处理 '//start-task' 等异常路径。
// 3. 恢复了所有功能，并保留了全局错误捕获。

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const tasks = {};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      ...corsHeaders,
    },
  });
}

async function runAggregation(taskId, env) {
  const log = (message) => {
    if (tasks[taskId]) {
      tasks[taskId].logs += `[${new Date().toLocaleTimeString()}] ${message}\n`;
    }
  };

  try {
    tasks[taskId].status = 'running';
    log('任务开始: 聚合TVBox源');

    // 步骤 1: 使用 GitHub API 搜索源文件
    log('步骤 1/4: 正在从 GitHub 搜索源文件...');
    const ghToken = env.GH_TOKEN;
    if (!ghToken) {
      throw new Error("关键错误: 未在环境中找到 GH_TOKEN。请检查Cloudflare Worker的Secrets配置。");
    }

    // 构建更精确的搜索查询：查找包含 "sites" 和 "spider" 关键词，扩展名为 .json 的文件
    const query = 'q=sites+spider+extension:json+tvbox';
    const searchUrl = `https://api.github.com/search/code?${query}`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${ghToken}`,
        'User-Agent': 'TVBox-Aggregator-Worker'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`GitHub API 搜索失败: ${searchResponse.status} ${errorText}`);
    }

    const searchResult = await searchResponse.json();
    const sourceUrls = searchResult.items.map(item => item.html_url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'));

    if (sourceUrls.length === 0) {
      log("警告: GitHub API 未返回任何源文件。任务结束。");
      tasks[taskId].status = 'completed';
      tasks[taskId].result = { "message": "未找到任何源文件。" };
      return;
    }
    log(`搜索完成，发现 ${sourceUrls.length} 个潜在的源地址。`);


    // 步骤 2: 并行下载所有源文件的内容
    log(`步骤 2/4: 开始并行下载 ${sourceUrls.length} 个源文件的内容...`);
    const downloadPromises = sourceUrls.map(url =>
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`下载 ${url} 失败`);
          return res.json();
        })
        .catch(err => ({ error: err.message, url }))
    );
    const downloadResults = await Promise.allSettled(downloadPromises);

    // 步骤 3: 验证内容并进行智能合并与去重
    log('步骤 3/4: 正在验证内容并进行智能合并...');
    const aggregatedJson = {
      "sites": [],
      "lives": [],
      "rules": [],
      "ads": [],
      "spider": null,
    };
    const siteKeys = new Set();
    const liveNames = new Set();
    const ruleNames = new Set();

    let validSourceCount = 0;
    for (const result of downloadResults) {
      if (result.status === 'fulfilled' && !result.value.error) {
        const sourceJson = result.value;

        // 合并 & 去重 'sites'
        if (Array.isArray(sourceJson.sites)) {
          for (const site of sourceJson.sites) {
            if (site.key && !siteKeys.has(site.key)) {
              aggregatedJson.sites.push(site);
              siteKeys.add(site.key);
            }
          }
        }

        // 合并 & 去重 'lives'
        if (Array.isArray(sourceJson.lives)) {
          for (const live of sourceJson.lives) {
            if (live.name && !liveNames.has(live.name)) {
              aggregatedJson.lives.push(live);
              liveNames.add(live.name);
            }
          }
        }

        // 合并 & 去重 'rules'
        if (Array.isArray(sourceJson.rules)) {
            for (const rule of sourceJson.rules) {
                if (rule.name && !ruleNames.has(rule.name)) {
                    aggregatedJson.rules.push(rule);
                    ruleNames.add(rule.name);
                }
            }
        }

        // 合并 'ads' (通常不需要去重)
        if (Array.isArray(sourceJson.ads)) {
            aggregatedJson.ads.push(...sourceJson.ads);
        }

        // 保留第一个找到的 'spider' jar 地址
        if (sourceJson.spider && !aggregatedJson.spider) {
          aggregatedJson.spider = sourceJson.spider;
        }

        validSourceCount++;
      }
    }
    log(`合并完成！成功处理了 ${validSourceCount} 个有效源。`);
    log(`最终聚合结果: ${aggregatedJson.sites.length} 个站点, ${aggregatedJson.lives.length} 个直播源, ${aggregatedJson.rules.length} 条规则。`);

    // 步骤 4: 将聚合结果写入 KV 存储
    log('步骤 4/5: 正在将最新结果写入永久存储...');
    if (!env.TVBOX_KV) {
        throw new Error("关键错误: 未绑定KV存储。请在Cloudflare后台创建并绑定一个名为 'TVBOX_KV' 的KV命名空间。");
    }
    await env.TVBOX_KV.put('latest_source', JSON.stringify(aggregatedJson, null, 2));
    log('写入成功！订阅地址现在已更新。');

    log('步骤 5/5: 任务成功完成！');
    tasks[taskId].status = 'completed';
    // 我们仍然在任务结果中返回聚合JSON，以便UI可以显示“下载”按钮作为备用
    tasks[taskId].result = aggregatedJson;

  } catch (error) {
    log(`任务执行时发生错误: ${error.message}`);
    log(`堆栈跟踪: ${error.stack}`);
    tasks[taskId].status = 'failed';
    tasks[taskId].error = error.message;
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      const url = new URL(request.url);
      const pathname = url.pathname.replace(/\/+/g, '/');

      if (pathname === '/start-task' && request.method === 'GET') {
        const taskId = `task-${Date.now()}`;
        tasks[taskId] = { id: taskId, status: 'pending', logs: '', result: null, error: null };
        ctx.waitUntil(runAggregation(taskId, env));
        return jsonResponse({ message: '任务已成功启动', taskId: taskId });
      }

      if (pathname === '/task-status' && request.method === 'GET') {
        const taskId = url.searchParams.get('taskId');
        if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务不存在或已过期' }, 404);
        const { status, logs, error } = tasks[taskId];
        return jsonResponse({ status, logs, error });
      }

      if (pathname === '/get-result' && request.method === 'GET') {
        const taskId = url.searchParams.get('taskId');
        if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务不存在或已过期' }, 404);
        if (tasks[taskId].status !== 'completed') return jsonResponse({ error: '任务尚未完成' }, 400);
        return jsonResponse({ result: tasks[taskId].result });
      }

      // 【新增】永久订阅地址路由
      if (pathname === '/subscribe' && request.method === 'GET') {
        if (!env.TVBOX_KV) {
            return jsonResponse({ error: "关键错误: 未绑定KV存储。请联系管理员。" }, 500);
        }
        const latestSource = await env.TVBOX_KV.get('latest_source');
        if (latestSource === null) {
            return jsonResponse({ message: "订阅源尚未生成，请先在控制面板运行一次聚合任务。" }, 404);
        }
        // 直接返回存储的JSON字符串，并设置正确的Content-Type
        return new Response(latestSource, {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8', ...corsHeaders },
        });
      }

      return jsonResponse({ error: `路径 '${pathname}' 未找到` }, 404);

    } catch (e) {
      console.error("Worker发生致命错误:", e);
      return jsonResponse({
          error: "后端Worker发生了一个意外的致命错误。",
          details: e.message,
        }, 500);
    }
  },
};
