// URL生成测试脚本
// 模拟生成URL的逻辑来验证修复是否正确

function testUrlGeneration() {
  console.log('🧪 URL生成逻辑测试');
  console.log('=' * 50);
  
  const testCases = [
    { baseUrl: 'http://localhost:9622', path: '/webui/' },
    { baseUrl: '/matgraph', path: '/webui/' },
    { baseUrl: 'http://127.0.0.1:9622', path: 'health' },
    { baseUrl: 'https://api.example.com', path: '/v1/test/' },
  ];
  
  function generateUrl(baseUrl, path) {
    if (!path) {
      return baseUrl;
    }
    
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    let finalUrl = `${baseUrl}/${cleanPath}`;
    
    // 正确处理URL清理，避免破坏协议部分
    if (finalUrl.includes('://')) {
      const [protocol, rest] = finalUrl.split('://');
      finalUrl = protocol + '://' + rest.replace(/\/+/g, '/');
    } else {
      // 对于相对路径，直接清理多余斜杠
      finalUrl = finalUrl.replace(/\/+/g, '/');
    }
    
    return finalUrl;
  }
  
  testCases.forEach(({ baseUrl, path }, index) => {
    const result = generateUrl(baseUrl, path);
    console.log(`Test ${index + 1}:`);
    console.log(`  Input: baseUrl='${baseUrl}', path='${path}'`);
    console.log(`  Output: '${result}'`);
    console.log(`  Valid: ${result.includes('://') ? result.includes('://') && !result.includes(':/') : true}`);
    console.log('');
  });
}

testUrlGeneration();