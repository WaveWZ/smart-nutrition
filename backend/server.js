const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { bootstrap } = require('./config/bootstrap');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

function createApp(env) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  if (env.nodeEnv !== 'production') {
    app.use((req, res, next) => {
      const started = Date.now();
      res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
      });
      next();
    });
  }

  app.use('/api', apiRoutes);

  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
        if (error) next(error);
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  const env = bootstrap();
  const app = createApp(env);
  const server = app.listen(env.port, () => {
    console.log(`Smart Nutrition Recommend API listening on port ${env.port}`);
  });
  server.on('error', (error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { createApp };
