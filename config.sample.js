export default {
    listenPort: 3000,
    handlers: [ 'mas2twimg' ],
    useProxy: false,
    proxyUrl: 'socks5://127.0.0.1:1080',
    /* ignore lines below */
    useAcorle: false,
    acorle: {
        centerUrl: '',
        registrationInterval: 30,
        zoneKey: '',
        zoneSecret: '',
        serviceKey: 'mas2twimg',
        serviceName: 'Mastodon to Twitter with images',
        localUrl: ''
    }
}
