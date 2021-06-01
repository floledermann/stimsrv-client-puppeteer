# stimsrv-client-puppeteer

A client for [stimsrv](https://github.com/floledermann/stimsrv) to use with old & simple browsers. This client renders stimuli on the server using [puppeteer](https://pptr.dev).

To enable server-side rendering in your experiment, you need to create a server configuration file (e.g. `stimsrv-config.js`) and add the configuration for this client:

```js
// stimsrv-config.js
const puppeteerClient = require("stimsrv-client-puppeteer");

module.exports = {
  clients: {
    "browser-simple": puppeteerClient({
      // config options go here
    })
  }
}
```

In your experiment definition, you need to provide the location of the server config file. You can then specify to use the configured puppeteer client by adding a matching `client` property to those clients who need it. The image size to deliver to the client can be configured alongside the other client properties.

```js
// experiment.js
// ...

  serverConfigFile: "stimsrv-config.js",
  
  devices: [
    {
      id: "oldphone",
      client: "browser-simple",
      imageSize: "600x600",
      pixeldensity: 91,
      viewingdistance: 600,
    },
    // ... more devices
  ]
  
// ...
```

This device will then receive a simple html page with the display contents rendered to an image, instead of the fully interactive stimsrv client code.

**Note that user input is currently not supported with this client, so this can only be used to display stimuli.**

See the [simple-browser example](https://github.com/floledermann/stimsrv-examples/tree/main/examples/simple-browser) for a fully configured example.