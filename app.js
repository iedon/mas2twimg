import localConfig from './config.js'
import { readFile } from 'fs'
import Koa from 'koa'
import KoaBodyParser from 'koa-bodyparser'
import { router } from './router.js'

// remove this and turn useAcorle off to disable use acorle
import { acorleKoa, AcorleService } from './acorle-sdk/acorleKoa.js'


const app = new Koa()
readFile('./ifttt-filter.js', (err, data) => {
    if (err) console.error(err)
    app.iftttCode = data.toString()
})

app.localConfig = localConfig

if (app.localConfig.useProxy) {
    app._proxyType = new URL(app.localConfig.proxyUrl).protocol.replace(':', '')
}

app.use(KoaBodyParser())
app.use(router(app))


if (app.localConfig.useAcorle) {
    app.use(acorleKoa(app,
        app.localConfig.acorle.centerUrl,
        app.localConfig.acorle.zoneKey,
        app.localConfig.acorle.zoneSecret,
        app.localConfig.acorle.registrationInterval,
        (level, log) => console[level](log)
    ))
    
    app.acorle.registerServices([
        new AcorleService(
            app.localConfig.acorle.serviceKey,
            app.localConfig.acorle.localUrl,
            app.localConfig.acorle.serviceName, false)
    ])
}

export default app
