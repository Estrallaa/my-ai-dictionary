// 定义缓存名称和版本
const CACHE_NAME = 'ai-dictionary-cache-v1';

// 定义需要缓存的核心资源
// 注意：你必须创建 manifest.json 中引用的图标文件
const FILES_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
  // 如果你有其他 CSS 或 JS 文件，也在这里添加
];

// 1. 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 正在缓存核心资源...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        self.skipWaiting(); // 强制激活
        console.log('[Service Worker] 核心资源缓存完毕！');
      })
      .catch(err => {
        console.error('[Service Worker] 缓存失败:', err);
      })
  );
});

// 2. 激活 Service Worker (清理旧缓存)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 如果缓存名称不是当前版本，则删除
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 正在清理旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即控制所有客户端
  );
});

// 3. 拦截网络请求 (Fetch 事件)
// 策略：优先从缓存中获取，如果缓存中没有，则从网络获取
self.addEventListener('fetch', (event) => {
  // 我们只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有匹配的响应，则直接返回
        if (response) {
          console.log('[Service Worker] 从缓存中找到:', event.request.url);
          return response;
        }

        // 如果缓存中没有，则从网络获取
        console.log('[Service Worker] 从网络获取:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // (可选) 你可以在这里将新的网络响应也缓存起来
            // 但对于核心文件，install 时缓存通常足够了
            return networkResponse;
          })
          .catch(err => {
            console.error('[Service Worker] 网络请求失败:', err);
            // 在这里可以返回一个统一的离线页面（如果已缓存）
          });
      })
  );
});
