const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });
  
const routes = require('./api/routes/recognaizeRoutes'); //importing route
routes(app); //register the route
app.listen(port);

console.log(`RecognAIze_api running on PORT ${port}`);

