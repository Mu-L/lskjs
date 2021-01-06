/* eslint-disable global-require */
import express from 'express';
import path from 'path';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';
import flattenDeep from 'lodash/flattenDeep';
import map from 'lodash/map';
import staticFileMiddleware from 'connect-static-file';
// import Apiquery from '@lskjs/apiquery';
import autobind from '@lskjs/utils/autobind';
import I18 from '@lskjs/i18';
import db from '@lskjs/db/server';
import e from '@lskjs/utils/e';
import asyncMapValues from '@lskjs/utils/asyncMapValues';
import Module from '@lskjs/module';
import http from 'http';
import defaultServerConfig from './config';

import createWs from './ws';

const DEBUG = __DEV__ && false;
export default class ServerApp extends Module {
  _module = 'app';
  name = 'App';
  // Api = Api;
  i18 = new I18({ ctx: this });
  async init() {
    await super.init();
    if (DEBUG) this.log.trace('ServerApp init');
    this.express = this.createExpress();
    // this.app = this.express; // Fallback
    this.serverConfig = this.config.server || defaultServerConfig;
    this.httpServer = http.createServer(this.express);
    if (this.serverConfig.express && Object.keys(this.serverConfig.express).length) {
      this.log.trace('serverConfig.express:', this.serverConfig.express);
      forEach(this.serverConfig.express || {}, (value, key) => {
        this.express.set(key, value);
      });
    }
    this.db = await this.getDatabase();
    this.responses = this.getResponses();
    if (DEBUG) this.log.debug('responses', Object.keys(this.responses));
    if (DEBUG) this.log.debug('serverConfig.middlewares', this.serverConfig.middlewares);
    this.middlewares = this.getMiddlewares();
    this.log.debug('middlewares', Object.keys(this.middlewares));
    this.helpers = this.getHelpers();
    if (DEBUG) this.log.debug('helpers', Object.keys(this.helpers));
    this.statics = this._getStatics();
    this.log.debug('statics', this.statics);
    // this.api = new Apiquery({
    //   url: this.url('/'),
    //   log: this.log,
    // });
    if (this.serverConfig.ws) this.initWs();
    if (this.i18) {
      await this.i18
        .setState({
          log: this.log,
          config: this.config.i18,
          getLocale: this.getLocale,
        })
        .init();
    }
  }

  async model(nameOrNames) {
    if (Array.isArray(nameOrNames)) return asyncMapValues(arrayToObject(nameOrNames), (n) => this.model(n));
    const name = nameOrNames;
    if (!this.models || !this.models[name]) throw Err('MODULE_MODEL_MISSING', { data: { name } });
    return this.models[name]
  }

  async afterInit() {
    this.log.debug(`modules [async]`, Object.keys(this._modules));
    this.log.debug(`modules [inited]`, Object.keys(this.modules));
    // super.afterInit(...arguments);
    this.models = await this.getMongooseModels();
    this.log.debug('models', Object.keys(this.models));
    await this.runModels();
  }

  @autobind
  url(str, params = null) {
    let query = '';
    if (params && Object.keys(params.length)) {
      query = `?${map(params, (val, key) => `${key}=${val}`).join('&')}`;
    }
    // `http://127.0.0.1:${this.config.port || this.serverConfig.port}`,
    return `${this.config.url || this.serverConfig.url || '/'}${str}${query}`;
  }

  e(...params) {
    return e.call(this, ...params);
  }

  // emit(...args) {
  //   this.modules && this.modules.events && this.modules.events.emit(...args); // eslint-disable-line
  // }
  // on(...args) {
  //   this.modules && this.modules.events && this.modules.events.on(...args); // eslint-disable-line
  // }
  // once(...args) {
  //   this.modules && this.modules.events && this.modules.events.once(...args); // eslint-disable-line
  // }

  getMiddlewares() {
    return require('./middlewares').default(this); // eslint-disable-line
  }
  async getMongooseModels() {
    const models = await this.getModels();
    await asyncMapValues(this.modules, async (mdl, moduleName) => {
      let models2 = {};
      if (mdl.getModels) {
        models2 = await mdl.getModels();
      } else if (mdl.models) {
        models2 = mdl.models;
      }
      // console.log('models2', Object.keys(models2));
      forEach(models2, (model, modelName) => {
        if (models[modelName]) {
          this.log.error(`ServerApp.getMongooseModels: CONFLICT modules/${moduleName}/${modelName}`); // eslint-disable-line no-console
          return;
        }
        models[modelName] = models2[modelName];
      });
    });
    if (Object.values(models).length && !this.db) {
      this.log.warn('ServerApp.getMongooseModels: !db, cant load mongoose models');
      return {};
    }
    return asyncMapValues(models, (model) => {
      if (model._universal) {
        return model.getMongooseModel(this.db);
      }
      return model;
    });
  }
  getModels() {
    return {};
  }
  async model(name) {
    if (!this.models[name]) throw `!model ${name}`;
    return this.models[name];
  }
  getDatabase() {
    return this.config.db && this.config.db.uri ? db(this, this.config.db) : null;
  }
  getErrors() {
    return require('./getErrors').default(this);
  }
  getResponses() {
    return require('./responses').default(this);
  }
  getHelpers() {
    return require('./helpers').default(this);
  }
  getStaticsDir(dirPath) {
    const fs = require('fs');
    const { readdirSync } = fs;
    const files = readdirSync(dirPath).filter((p) => p !== '.' && p !== '..');
    const res = {};
    files.forEach((file) => {
      res[`/${file}`] = `${dirPath}/${file}`;
    });
    return res;
  }

  getEnv(req) {
    return {
      __ROOT_STATE__: {
        token: req.token,
        user: req.user,
        req: {
          token: req.token,
          user: req.user,
        },
        config: this.config.client || {},
      },
      __DEV__,
      __STAGE__: global.__STAGE__,
    };
  }

  getStatics() {
    if (this.serverConfig && this.serverConfig.public) {
      return this.getStaticsDir(this.serverConfig.public);
    }
    return {};
  }

  _getStatics() {
    return mapValues(this.getStatics() || {}, (p) => path.resolve(p));
  }

  runStatics() {
    forEach(this.statics, (_path, url) => {
      this.express.use(url, express.static(_path));
      this.express.use(url, staticFileMiddleware(_path));
    });
  }

  getUsingMiddlewares() {
    return [
      this.middlewares.extendReqRes,
      this.middlewares.reqLog,
      this.middlewares.accessLogger,
      this.middlewares.reqParser,
      this.middlewares.reqData,
      this.middlewares.parseToken,
      this.middlewares.parseUser,
      this.middlewares.i18,
    ];
  }

  initWs() {
    this.ws = createWs(this);
    this.ws.wrapExpress(this.express);
  }
  async runWs() {
    if (!this.serverConfig.ws) return;
    if (DEBUG) this.log.trace('ServerApp.runWs');
    this.ws.serveClient(false);
    this.ws.attach(this.httpServer);
    const transports = this.serverConfig.ws.transports || ['websocket'];
    this.ws.set('transports', transports);
    if (this.serverConfig.ws.origins) this.ws.set('origins', this.serverConfig.ws.origins);
  }

  runMiddlewares() {
    if (DEBUG) this.log.trace('ServerApp.runMiddlewares');
    const middlewares = flattenDeep(this.getUsingMiddlewares());
    middlewares.forEach((middleware) => {
      if (middleware && typeof middleware === 'function') this.express.use(middleware);
    });
  }
  runDefaultRoute() {
    if (DEBUG) this.log.trace('ServerApp.runDefaultRoute');
    this.express.use((req, res, next) => {
      next(this.e('ROUTE_NOT_FOUND', { status: 404 }));
    });
  }

  runCatchErrors() {
    if (this.middlewares.catchError) this.express.use(this.middlewares.catchError);
  }

  runModels() {
    const promises = map(this.models, async (model, name) => {
      if (model.run) {
        this.models[name] = await model.run(this);
      }
    });
    return Promise.all(promises);
  }

  getDocsRouter = require('./methods/getDocsRouter').default;
  getDocsTemplate = () => 'deprecated';

  expressResolve = require('./methods/expressResolve').default;
  runRedis = require('./methods/runRedis').default;
  runRoutes = require('./methods/runRoutes').default;
  // getI18 = require('../Uapp/i18/getI18').default;
  // getI18Params = require('../Uapp/i18/getI18Params').default;
  // getLocale = require('../Uapp/i18/getLocale').default;
  // initI18 = require('../Uapp/i18/initI18').default;

  async run(...args) {
    await super.run(...args);
    if (DEBUG) this.log.trace('ServerApp.run');
    if (this.db) await this.db.run().catch((err) => this.log.error('ServerApp.db', err));
    if (this.serverConfig.ws) await this.runWs();
    if (this.config.redis) await this.runRedis();
    this.runStatics();
    this.runMiddlewares();
  }

  createExpress() {
    return express();
  }

  async afterRun() {
    if (DEBUG) this.log.trace('ServerApp afterRun');
    await this.runRoutes();
    this.runDefaultRoute();
    this.runCatchErrors();
    return new Promise((resolve) => {
      this.httpInstance = this.httpServer.listen(this.config.port || this.serverConfig.port, () => {
        resolve(this);
      });
    });
  }
  async stop() {
    await super.stop();
    if (this.db) await this.db.stop();
    await new Promise((resolved) => {
      if (this.httpInstance) {
        this.httpInstance.close(resolved);
      } else {
        resolved();
      }
    });
  }

  async started() {
    const timing = global.timing ? `[${global.timing()}ms]` : '';
    const str = `🎃  The server is running at http://127.0.0.1:${this.httpInstance.address().port}/ ${timing}`;
    if (__DEV__) {
      console.log(str); // eslint-disable-line no-console
    } else {
      this.log.warn(str);
    }
  }
}
