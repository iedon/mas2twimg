import { BaseHandler } from "./base.js"
import { XMLParser } from "fast-xml-parser"
import nodeFetch from 'node-fetch'
import { SocksProxyAgent } from "socks-proxy-agent"
import { HttpProxyAgent } from "http-proxy-agent"
import { HttpsProxyAgent } from "https-proxy-agent"

export class Mas2twimgHandler extends BaseHandler {

    constructor(app, router) {
        super(app, router)
        this.router.get('/getTootImages', async (ctx, _) => {
            ctx.status = 200
            ctx.response.type = 'html'
            ctx.body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mastodon To Twitter with Images</title><meta name="viewport" content="width=device-width,initial-scale=1.0"><style><!-- body{padding-top:30px;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:14px;line-height:1.4;color:#333;background-color:#fff}code,pre{font-family:Monaco,Courier,Lucida,Arial}.navbar-default{background-color:#f8f8f8;border-color:#e7e7e7}.navbar-fixed-top,.navbar-fixed-bottom{border-radius:0}.navbar-fixed-top,.navbar-fixed-bottom{position:fixed;right:0;left:0;z-index:1030;top:0}.navbar{min-height:50px;margin-bottom:20px;border:1px solid transparent}.container{padding-right:15px;padding-left:15px;margin-right:auto;margin-left:auto}.navbar-default .navbar-brand{color:#777}.navbar>.container .navbar-brand{margin-left:-20px}.navbar-brand{float:left;padding:15px 15px;font-size:18px;line-height:20px}a{color:#428bca;text-decoration:none;}.post p,.post pre{padding-left:10px}h2,.h2{font-size:28px}h1,h2,h3{margin-top:20px;margin-bottom:10px}pre{padding:15px;border-top:1px solid #eee}footer{border-top:1px solid #eee;padding:auto 15px}code{padding:2px 4px;font-size:90%;color:#c7254e;background-color:#f9f2f4;border-radius:4px}.codeblue{padding:2px 4px;font-size:90%;color:#2096F3;background-color:#f2f5f9;border-radius:4px} --></style></head><body><header class="navbar navbar-default navbar-fixed-top"><div class="container"><div class="navbar-header"><a class="navbar-brand">Mastodon To Twitter with Images</a></div></div></header><div class="container"><div class="post"><div class="page-header"><h2><code class="codeblue">IFTTT filter code</code></h2></div><p>- Configure a Mastodon RSS trigger and then create a query with Webhook.</p><p>- Type URL: <code id="url"></code> , method: <code>POST</code> , content type: <code>application/json</code> , body: <code>{ "EntryUrl": "{{EntryUrl}}" }</code></p><p>- Save the query and add a filter with the following code, save and create IFTTT THEN action with a "Post a tweet(Tweet text: <code>{{EntryContent}}</code> )" and a "Post a tweet with image(Tweet text: <code>{{EntryContent}}</code> , Image URL: <code>{{EntryImageUrl}}</code> )".</p><pre>${ctx.app.iftttCode}</pre></div></div><footer><p>This service will not save your data or access your IFTTT account.</p></footer><script type="text/javascript">document.getElementById('url').innerText = window.location.href</script></body></html>`
        })
        this.router.post('/getTootImages', async (ctx, _) => {
            try {
                ctx.status = 200
                ctx.response.type = 'json'
                ctx.body = await this.getTootImages(ctx)
            } catch(error) {
                ctx.status = 500
                ctx.response.type = 'json'
                ctx.body = {
                    message: error.toString()
                }
            }
        })
    }


    async getTootImages(ctx) {
        if (!ctx.request.body.EntryUrl) throw 'no EntryUrl specified'
        const userUrl = ctx.request.body.EntryUrl.match(/https:\/\/[^\/]+\/@[^\/]+/)
        if (!userUrl) throw 'parse: invalid userUrl'
        const rss = `${userUrl[0]}.rss`

        const resp = await (await this._fetch(rss, {
            method: 'GET',
            header: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        })).text()

        const xml = new XMLParser({ ignoreAttributes: false }).parse(resp)
        if (!xml.rss || !xml.rss.channel) throw 'invalid rss response'
        const posts = xml.rss.channel.item

        const post = posts.find(item => item.link === ctx.request.body.EntryUrl)
        if (!post) throw 'cannot get relevant post from given EntryUrl'

        const result = []
        if (Array.isArray(post['media:content'])) {
            // multiple images posted
            post['media:content'].forEach(item => {
                if (item['@_url']) result.push(item['@_url'])
            })
        } else { // only one image posted
            if (post['media:content'] && post['media:content']['@_url'])
                result.push(post['media:content']['@_url'])
        }
        return {
            images: result
        }
    }


    async _fetch(resource, options = {}) {
        const { timeout = 10000 } = options

        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)

        if (this.app._proxyType) switch (this.app._proxyType) {
            case 'socks5': options.agent = new SocksProxyAgent(this.app.localConfig.proxyUrl); break
            case 'https': options.agent = new HttpsProxyAgent(this.app.localConfig.proxyUrl); break
            case 'http': options.agent = new HttpProxyAgent(this.app.localConfig.proxyUrl); break
            default: break
        }

        const response = await nodeFetch(resource, {
            ...options,
            signal: controller.signal,
        })
        clearTimeout(id)

        return response
    }
}
