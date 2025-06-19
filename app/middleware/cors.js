'use strict';

module.exports = () => {
  return async function cors(ctx, next) {
    // 设置允许的来源，* 代表所有
    ctx.set('Access-Control-Allow-Origin', '*');
    // 设置允许的 HTTP 方法
    ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS');
    // 设置允许的请求头
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 浏览器在发送复杂请求前会先发送一个 OPTIONS "预检"请求
    // 我们需要对这个 OPTIONS 请求直接返回 204 No Content 状态
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }

    // 执行后续的中间件或路由
    await next();
  };
};