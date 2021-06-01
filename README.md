# stimsrv-client-puppeteer

A client for [stimsrv](https://github.com/floledermann/stimsrv) to use with old & simple browsers. This client renders stimuli on the server using [puppeteer](https://pptr.dev).

This allows to incorporate old phones which cannot be updated to a modern browser, or devices with simple web browsers like e-book readers, in your experiments.

**Note that user input is currently not supported with this client, so this can only be used to *display* stimuli.**

To use stimsrv-client-puppeteer, run **`npm install stimsrv-client-puppeteer`** in your experiment directory.

You then need to create a server configuration file (e.g. `stimsrv-config.js`) and add the configuration for this client:

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

In your experiment definition, you need to provide the location of this server config file. You can then specify to use the puppeteer client for specific devices by adding a matching **`client`** property to those clients who should use it. The image size to deliver to the client can be configured alongside the other client properties.

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

This device will then receive a simple html page with the display contents rendered as an image, instead of the fully interactive stimsrv client code.

See the [simple-browser example](https://github.com/floledermann/stimsrv-examples/tree/main/examples/simple-browser) for a fully configured example.

## Headless rendering

Puppeteer can render in "headless" mode (without showing a browser window). However, graphical output in headless mode may deviate slightly from regular browsers. Therefore, headless mode is disabled by default, which means a browser window will pop up on the server when this client is used.

If you can tolerate small inconsistencies in the rendering and want to suppress the browser window, you can pass the **`headless`** option to the initializer:

```js
// stimsrv-config.js
// ...
  clients: {
    "browser-simple": puppeteerClient({
      headless: true
    })
  }
// ...
```
