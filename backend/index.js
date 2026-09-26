const { bootstrap } = require('./config/bootstrap');
const { createApp } = require('./server');

let app;

module.exports = (req, res) => {
  if (!app) app = createApp(bootstrap());
  return app(req, res);
};
