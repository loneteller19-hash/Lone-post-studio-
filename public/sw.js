const C="lps-v1",A=["/","/manifest.json","/icons/icon-192.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||e.request.url.includes("/api/")||e.request.url.includes("/auth/"))return;
e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
