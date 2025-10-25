/**
 * 验证并筛选TVBox源URL列表。
 * @param {string[]} urls - 从GitHub搜索到的URL数组。
 * @returns {Promise<Array<{url: string, content: object}>>} - 返回一个包含有效源URL及其JSON内容的数组。
 */
async function validateAndFilterSources(urls) {
    console.log(`开始验证 ${urls.length} 个源地址...`);

    // 使用Promise.all并行处理所有URL的验证过程
    const results = await Promise.all(urls.map(url => validateSingleSource(url)));

    // 过滤掉验证失败的结果（null）
    const validSources = results.filter(result => result !== null);

    console.log(`验证完成，找到 ${validSources.length} 个有效的源。`);
    return validSources;
}

/**
 * 验证单个源URL。
 * @param {string} url - 要验证的URL。
 * @returns {Promise<{url: string, content: object} | null>} - 如果源有效，则返回包含URL和内容的对象，否则返回null。
 */
async function validateSingleSource(url) {
    // 设置10秒的请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, { signal: controller.signal });

        // 清除超时计时器
        clearTimeout(timeoutId);

        if (!response.ok) {
            // console.log(`[失败] ${url} - HTTP状态码: ${response.status}`);
            return null;
        }

        const textContent = await response.text();

        // 尝试解析JSON
        let jsonContent;
        try {
            jsonContent = JSON.parse(textContent);
        } catch (e) {
            // console.log(`[失败] ${url} - JSON解析失败`);
            return null;
        }

        // 检查是否是有效的TVBox源格式（基础检查）
        if (isValidTvboxSource(jsonContent)) {
            console.log(`[成功] ${url} - 验证通过`);
            return { url, content: jsonContent };
        } else {
            // console.log(`[失败] ${url} - 格式不符合TVBox源标准`);
            return null;
        }

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            // console.log(`[失败] ${url} - 请求超时`);
        } else {
            // console.log(`[失败] ${url} - 未知错误: ${error.message}`);
        }
        return null;
    }
}

/**
 * 检查JSON对象是否符合TVBox源的基本结构。
 * @param {object} json - 解析后的JSON对象。
 * @returns {boolean} - 如果符合则返回true，否则返回false。
 */
function isValidTvboxSource(json) {
    // 这是一个基础的“鸭子类型”检查。
    // 一个TVBox源通常会包含 'sites', 'lives', 'rules' 或 'spider' 等顶级键。
    const typicalKeys = ['sites', 'lives', 'rules', 'spider', 'jar'];
    return typicalKeys.some(key => json && typeof json === 'object' && key in json);
}

module.exports = { validateAndFilterSources };
