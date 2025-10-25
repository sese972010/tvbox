/**
 * 使用GitHub API搜索包含指定关键字的源文件。
 * @param {string} keywords - 用于搜索的关键字，例如 "tvbox源"。
 * @param {string | null} githubToken - 用于认证的GitHub Token，可以提高API速率限制。
 * @returns {Promise<string[]>} - 返回一个包含原始文件URL的数组。
 */
async function searchGithub(keywords, githubToken = null) {
    // 如果没有提供关键字，则使用一组默认的高频关键字
    const defaultKeywords = '"饭太硬" OR "tvbox" OR "发布" in:file extension:json';
    const query = keywords ? `${keywords} in:file extension:json` : defaultKeywords;

    // 构建GitHub API的搜索URL，按最新索引排序
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&sort=indexed&order=desc`;

    console.log(`正在使用URL进行GitHub搜索: ${url}`);

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TVBox-Source-Aggregator' // GitHub API要求设置User-Agent
    };

    if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
    }

    let response; // 在try块外部声明
    try {
        // 使用fetch API发起请求
        response = await fetch(url, { headers });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`GitHub API请求失败，状态码: ${response.status}, 信息: ${errorBody}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            // 将搜索结果中的html_url转换为raw.githubusercontent.com的URL
            const urls = data.items.map(item =>
                item.html_url
                    .replace('https://github.com/', 'https://raw.githubusercontent.com/')
                    .replace('/blob/', '/')
            );

            console.log(`成功找到 ${urls.length} 个潜在的源地址。`);
            return urls;
        } else {
            console.log('未找到相关结果。');
            return [];
        }

    } catch (error) {
        // 如果认证请求失败（例如Token无效），则尝试以降级的、非认证的方式重试
        if (response && response.status === 401) {
            console.warn('GitHub Token无效或已过期，正在尝试以降级模式（非认证）进行搜索...');
            // 创建一个全新的、不包含认证信息的头进行重试
            const retryHeaders = {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'TVBox-Source-Aggregator'
            };
            try {
                const retryResponse = await fetch(url, { headers: retryHeaders });
                if (!retryResponse.ok) {
                    const errorBody = await retryResponse.text();
                    throw new Error(`非认证的GitHub API请求也失败了，状态码: ${retryResponse.status}, 信息: ${errorBody}`);
                }
                const data = await retryResponse.json();
                // ... (重复之前的成功逻辑)
                const urls = data.items.map(item =>
                    item.html_url
                        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
                        .replace('/blob/', '/')
                );
                console.log(`在降级模式下成功找到 ${urls.length} 个潜在的源地址。`);
                return urls;
            } catch (retryError) {
                console.error('降级模式的GitHub搜索也失败了:', retryError);
                return [];
            }
        }

        console.error('GitHub搜索过程中发生错误:', error);
        return []; // 发生其他错误时返回空数组
    }
}

// 导出模块，以便在其他文件中使用
export { searchGithub };
