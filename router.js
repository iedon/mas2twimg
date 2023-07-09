import KoaRouter from 'koa-router'
const _router = new KoaRouter()

export function router(app) {

    (async () => {
        app._routeClasses={}
        for (let i = 0; i < app.localConfig.handlers.length; i++) {
            const h = app.localConfig.handlers[i]
            if (h !== 'base') {
                const handlerName = `${h.charAt(0).toUpperCase() + h.slice(1)}Handler`
                app._routeClasses[handlerName] = new (await import(`./handlers/${h}.js`))[handlerName](app, _router)
            }
        }
        app.use(_router.routes(), _router.allowedMethods())
    })()

    return async (_, next) => await next()
}
