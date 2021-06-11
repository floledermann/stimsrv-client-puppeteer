const puppeteer = require("puppeteer");

const stream = require("stream");
const path = require("path");

module.exports = function(config) {
  
  config = Object.assign({
    // GPU rendering is not enabled in headless mode, which can lead to
    // slight differences in graphical output.
    // See https://bugs.chromium.org/p/chromium/issues/detail?id=765284
    // Therefore, render in non-headless mode by default.
    headless: false,
    refreshDelay: 5,
    fallbackRefreshDelay: 59,
    requestTimeout: 60,
    // the id of this client type - has to match your experiment.clients setup
    clientId: "browser-simple",
    // which client to use in puppeteer browser - must not recursively invoke puppeteer!
    subClient: "browser"
  }, config);
  
  function clientFactory(experiment, controller) {
  
    return function(client, role) {
      
      let imageWidth = 480;
      let imageHeight = 480;
      
      client = Object.assign({
        imageType: "png", // "png" or "jpeg"
        imageQuality: 80,
      }, client);

      if (client.imageType == "jpg") {
        client.imageType = "jpeg";
      }
      if (client.imageType == "png") {
        // puppeteer complains about setting this for png
        delete client.imageQuality;
      }
      
      if (client.imageSize) {
        let [w,h] = client.imageSize.split("x").map(n => +n);
        imageWidth = w || imageWidth;
        imageHeight = h || imageHeight;
      }
      //console.log(imageWidth);
      
      // we need these to keep track of the background color - this should be simplified
      let taskIndex = -1;
      let currentTaskUI = null;
      let currentDisplay = null;
      let currentContext = null;
      let currentCondition = null;
      let localContext = {
        clientid: client.id,
        device: client,
        role: role.role, // TODO: this should be the whole role object, but check/test this
      };
      
      let browserP = puppeteer.launch({
        defaultViewport: {
          width: imageWidth,
          height: imageHeight
        },
        headless: config.headless
      });
      let pageP = null;
      let navP = null;

      navP = browserP.then(browser => {
        pageP = browser.newPage();
        navP = pageP.then(page => {
          navP = page.goto("http://localhost:8080/?clientId=" + client.id + "&role=" + role.role + "&client=" + config.subClient, {
            waitUntil: "networkidle0"
          });
          /*
          navP.then(page => {
            console.log("###### Page loaded! ######");
          });
          */
          return navP;
        });
        
        return navP;
      });
          
      //await browser.close();

      function warn(message, data) {
        controller.warn(message, data);
      }
      
      function showCondition(condition) {
        
        currentCondition = condition;
        
        update();
        
      }    
      
      function renderCurrentImage(response) {
        navP.then(() => pageP.then(page => {    
          page.screenshot({
            type: client.imageType,
            quality: client.imageQuality,
          }).then(buffer => {
            console.log("Rendering image...");
            response.write(buffer, 'binary');
            response.end(null, 'binary');
          });
        }));
      }
      
      let updateResponse = null;
      let updated = false;
      
      function update() {
        if (!updated && updateResponse) {
          updateResponse.send("reload");
          //console.log("Requesting update!");
          updateResponse = null;
          updated = true;
        }
        else {
          updated = false;
        }
      }
      
      return {
        message: function(type, data) {
          
          lastMessage = type;
          lastMessageData = data;
          
          if (type == "condition") {        
            showCondition(data.condition);
          }
          
          if (type == "task init") {
            
            taskIndex = data.taskIndex;
            currentContext = data.context;
            let fullContext = Object.assign({}, currentContext, localContext);
            
            currentTaskUI = experiment.tasks[data.taskIndex].ui(fullContext);
            currentDisplay = currentTaskUI.interfaces[role.role + ".display"] || currentTaskUI.interfaces["display"] || currentTaskUI.interfaces["*"];

            if (data.condition) {
              showCondition(data.condition);
            }
          }
        },
        
        render: function(req, res) {
          
          if (req.path == "/image/") {
            renderCurrentImage(res); 
          }
          else if (req.path == "/update/") {
            //console.log("Update Request Received...");
            if (updateResponse) {
              //console.log("Abandoning old update request.");
              // abort old update
              updateResponse.send("");
            }
            updateResponse = res;
            update();
          }
          else {
            res.render("experiment-client-puppeteer.html", {
              message: lastMessage,
              data: lastMessageData,
              role: req.clientRole,
              imageSize: [imageWidth/(client.devicePixelRatio || 1), imageHeight/(client.devicePixelRatio || 1)],
              backgroundColor: currentDisplay?.backgroundColor || "#000000",
              foregroundColor: currentDisplay?.foregroundColor || "#ffffff",
              config: config
            });
          }
        }
        
      }
    }
  }
  
  clientFactory.templateDir = path.join(__dirname, "views");
  
  return clientFactory;
}