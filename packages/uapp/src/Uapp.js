/* eslint-disable global-require */
import map from 'lodash/map';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import forEach from 'lodash/forEach';
import UniversalRouter from 'universal-router';
import Promise from 'bluebird';
import { observable, reaction } from 'mobx';
import Favico from 'favico.js';
import Api from '@lskjs/apiquery';
import Apiq from '@lskjs/apiquery/q';
import scrollTo from '@lskjs/scroll';
import detectHtmlClasses from '@lskjs/utils/detectHtmlClasses';
import addClassToHtml from '@lskjs/utils/addClassToHtml';
import removeClassFromHtml from '@lskjs/utils/removeClassFromHtml';
import assignProps from '@lskjs/utils/assignProps';
import I18 from '@lskjs/i18';
import Module from '@lskjs/module';
import logger from '@lskjs/log';
import autobind from '@lskjs/utils/autobind';
import e from '@lskjs/utils/e';
import UappProvider from './UappProvider';
import wrapApi from './wrapApi';
import DefaultPage from './Page';
import defaultTheme from './theme';

global.DEV = () => null;
Promise.config({ cancellation: true });
// class Req {
//   // ...
//   @observable path = null;
//   @observable query = null;
// }

export default class Uapp extends Module {
  name = 'Uapp';
  _module = 'app';
  Api = Api;
  Apiq = Apiq;
  Page = DefaultPage;
  Provider = UappProvider;
  theme = defaultTheme;
  scrollTo = scrollTo;
  i18 = new I18({ ctx: this });
  // req = new Req();
  @observable req = {};

  constructor(...props) {
    // СМИРИТЕСЬ: Эта копипаста нужна, чтобы менять параметры сверху. (ex Api, Apiq, Page, Provider, theme, scrollTo)
    super(...props);
    assignProps(this, ...props);
  }

  createLogger(params) {
    const level = __DEV__ // eslint-disable-line no-nested-ternary
      ? __SERVER__
        ? 'warn'
        : 'trace'
      : 'error';

    return logger.createLogger({
      name: this.name || 'app',
      src: __DEV__,
      level,
      ...get(this, 'config.log', {}),
      ...params,
    });
  }

  async applyRootState(rootState = {}) {
    this._config = cloneDeep(this.config);
    this.rootState = rootState;
    this.config = merge(this.config, this.rootState.config);
  }

  getRootState() {
    return {
      ...(this.rootState || {}),
    };
  }

  async historyConfirm(message, callback) {
    if (!this.confirm || !this.confirm.open) return callback(false);
    const res = await this.confirm.open({
      title: this.i18.t('form.confirm.title'),
      text: message || this.i18.t('form.confirm.text'),
      cancel: this.i18.t('form.confirm.cancel'),
      submit: this.i18.t('form.confirm.submit'),
    });
    return callback(res);
  }
  async resolveStart() {
    if (this.progress && this.progress.current) {
      this.progress.current.start();
    }
  }
  async resolveFinish() {
    if (this.scrollTo) {
      let to = get(this, 'history.location.hash', 0);
      if (to === '') to = 0;
      setTimeout(() => this.scrollTo(to, get(this, 'config.uapp.scrollTo')), 10); // @TODO: back && go to page
    }
    try {
      const { title: firstTitle } = this.page.getMeta();
      if (firstTitle && typeof document !== 'undefined') {
        if (document.title !== firstTitle) {
          document.title = firstTitle;
        }
      }
      // Поддержка meta.observe
      reaction(
        () => this.page.state.meta,
        () => {
          const { title } = this.page.getMeta();
          if (title && typeof document !== 'undefined') {
            if (document.title !== title) {
              document.title = title;
            }
          }
        },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.error("Uapp can't set title");
      this.log.error('err', err);
    }
    if (this.progress && this.progress.current) {
      this.progress.current.finish();
    }
    this.req.path = this.history.location.path;
    this.req.query = this.history.location.query;
  }
  async initI18() {
    await this.i18
      .setState({
        log: this.log,
        config: this.app.config.i18,
        getLocale: this.getLocale,
      })
      .init();
  }
  async init() {
    await super.init();
    // this._config = cloneDeep(this.config); // backup for modifications
    if (this.rootState) {
      await this.applyRootState(this.rootState);
    }
    this.stores = this.getStores();
    this.api = this.getApi();
    this.apiq = new this.Apiq({
      config: this.config ? this.config.apiq : {},
      resolve: this.app.resolve,
    });

    if (this.i18) {
      await this.initI18();
    }
    if (__CLIENT__) {
      this.favico = new Favico({
        // @TODO: вынести как модуль
        animation: 'none',
      });

      this.on('resolve:start', () => this.resolveStart());
      this.on('resolve:finish', () => this.resolveFinish());

      const classes = detectHtmlClasses();
      classes.forEach(addClassToHtml);
    }
  }

  getApi() {
    const apiConfig = this.config ? this.config.api : {};
    const url = get(apiConfig, 'url', __CLIENT__ ? '/' : `http://127.0.0.1:${this.app.config.port}`);
    const api = new this.Api({
      ...apiConfig,
      url,
    });
    const { app } = this;
    if (__SERVER__ && app) {
      wrapApi({ api, app });
    }
    return api;
  }

  getLocale = require('./i18/getLocale').default;
  setLocale = require('./i18/setLocale').default;

  @autobind
  t(...args) {
    // console.log('DEPRECATED uapp.t', args[0]);
    if (this.i18) return this.i18.t(...args);
    return '!uapp.i18';
  }

  createOnSubmit(...props) {
    console.log('depreacted uapp.createOnSubmit=>catchError');  //eslint-disable-line
    return this.catchOnError(...props);
  }

  catchError(fn) {
    return async (...args) => {
      try {
        const res = await fn(...args);
        return res;
      } catch (err) {
        this.onError(err);
        throw err;
      }
    };
  }

  getStores() {
    return {};
  }

  async run() {
    await super.run();
    const context = this.provide();
    this.log.trace('router.context', Object.keys(context));
    this.routes = this.getRoutes();
    this.router = new UniversalRouter(this.routes, {
      context,
    });
    if (__CLIENT__) {
      setTimeout(() => this.checkVersion(), 120 * 1000);
    }
    await this.lazyRun();
  }

  async lazyRun() {
    if (this.auth) await this.auth.init();
    await this.reconnect();
    // await this.initStateStorage();
    // await super.run();
  }

  async reconnect() {
    // await this.auth.reconnect();
    // await this.initStateStorage();
  }

  // ////////////////////
  @observable state2 = {
    testInput: '',
    locale: '',
    helpers: {},
  };
  async setState(data = {}, params = {}) {
    const { ws, localStorage, appstate } = {
      appstate: true,
      ws: true,
      localStorage: true,
      ...params,
    };
    // console.log({ data });
    if (appstate) {
      forEach(data, (value, key) => {
        this.state2[key] = value;
      });
    }
    if (__CLIENT__) {
      // Object.assign(this.state2, data);
      if (localStorage) {
        window.localStorage.setItem('appstate', JSON.stringify(this.state2));
      }
      if (ws) {
        // TODO: websockets
        const state = await this.api.fetch('/api/module/appstate/save', {
          method: 'POST',
          body: {
            userId: this.user && this.user._id,
            ...data,
            // state: data,
          },
        });
        this.setState(state.data, {
          ws: false,
        });
        // forEach(state, (value, key) => {
        //   this.state2[key] = value;
        // });
        // this.setState(state);
      }
    }
  }

  async initStateStorage() {
    // if (__CLIENT__) {
    // this.state = storedObservable('uappState', this.state, 500);
    // this.state = storedObservable('uappState', this.state, 100);
    // console.log('initStateStorage');
    // let storageData = {};
    // let state = {};
    // state = {
    //   ...state,
    //   ...(this.rootState.appstate || {}),
    // };
    // if (__CLIENT__) {
    //   try {
    //     storageData = JSON.parse(window.localStorage.getItem('appstate'));
    //     state = {
    //       ...state,
    //       ...storageData,
    //     };
    //   } catch (err) {
    //     console.error("Uapp.initStateStorage: JSON.parse(window.localStorage.getItem('appstate'))", err); // eslint-disable-line
    //   }
    // }

    let state = {};
    const userId = this.user && this.user._id;
    if (userId) {
      // console.log('-- 1111');
      // console.log('-- 1111', this.api);
      const res = await this.api
        .fetch('/api/module/appstate/getOrCreate', {
          qs: {
            userId,
          },
        })
        .catch((err) => this.log.error('Uapp.initStateStorage: getOrCreate', err));
      // console.log('-- 2222');
      if (res && res.data) {
        state = {
          ...state,
          ...res.data,
        };
      }
    }
    // const updates = {
    //   appstate: true,
    //   ws: false,
    //   localstorage: true,
    // };

    // con
    // if (!DB) {
    //   updates.ws = true;
    // }

    this.setState(state, {
      ws: false,
      localstorage: false,
    });
    // console.log('initStateStorage /api/module/appstate/get', { data: res?.data });

    // if (__CLIENT__) this.setState();
    // autorun(() => {
    //   if (__DEV__ || __CLIENT__) {
    //     // console.log('uapp.state was updated, helpers.dashboard=', this.state.helpers?.dashboard);
    //   }
    //   // console.log(sum.get())
    // }, { delay: 100 });
    // }
  }

  url(str, params = null) {
    let query = '';
    if (params) {
      query = `?${map(params, (val, key) => `${key}=${val}`).join('&')}`;
    }
    return `${this.config.url || ''}${str}${query}`;
  }

  state = {
    secret: false,
  };

  e(...params) {
    return e.call(this, ...params);
  }

  // uapp.onError(t('common.errorData'), err); ??? // bad
  // uapp.onError(uapp.e('errorData', { err })); ???
  @autobind
  onError(err) {
    if ((err && err.type === 'cancel') || (err && err.code === 'page.cancel') || err === 'page.cancel') {
      return null;
    }
    return this.toast(err, { defaultType: 'error' });
  }

  toast(err, config) {
    // console.log('toast', err, this.notificationSystem);
    if (this.notificationSystem && this.notificationSystem.current) {
      this.notificationSystem.current.toast(err, config);
    } else {
      console.error('Uapp.toast', err); // eslint-disable-line no-console
    }
  }

  getRoutes() {
    return {};
  }

  async getPage() {
    // console.log('resetPage');
    const { Page } = this;
    if (!this.page) {
      this.page = new Page({
        Provider: this.Provider,
        rootState: this.getRootState(),
        uapp: this,
        app: this,
      });
    } else {
      await this.page.exit();
    }
    await this.page.init();
    return this.page;
  }

  resolve(reqParams = {}) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      this.emit('resolve:start', reqParams);
      const req = {
        ...this.req,
        path: reqParams.path,
        query: reqParams.query,
      };
      if (__CLIENT__ && __DEV__) this.log.trace('Uapp.resolve', req.path, req.query);
      const page = await this.getPage();
      let res;
      try {
        res = await this.router.resolve({
          pathname: reqParams.path,
          path: reqParams.path,
          query: reqParams.query,
          // req,
          page,
          req,
        });
        this.emit('resolve:finish', reqParams);
        resolve(res);
      } catch (err) {
        this.emit('resolve:error', err);
        this.log.error('uapp.router.resolve ERR:', err);
        // console.error('@@@@', err); // eslint-disable-line no-console
        reject(err);
      }
    });
  }

  refresh() {
    if (__CLIENT__) {
      // window.location.reload();
      this.app.render();
    }
  }

  redirect(...args) {
    if (__DEV__) console.log('Uapp.redirect', ...args); // eslint-disable-line no-console
    if (__CLIENT__) {
      const [link] = args;
      if ((link && link.startsWith('http://')) || link.startsWith('https://')) {
        window.location.href = link;
      } else {
        this.app.redirect(...args);
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (__DEV__) console.log('cant history.redirect because it server', ...args); // eslint-disable-line no-console
    }
  }

  restart() {}
  started() {
    if (__CLIENT__) {
      removeClassFromHtml('ua_js_no');
      addClassToHtml('ua_js_yes');
    }
  }

  async checkVersion() {
    const version = typeof __VERSION !== 'undefined' ? __VERSION : typeof __VERSION__ !== 'undefined' ? __VERSION__ : null;  // eslint-disable-line
    if (!version) return;
    const data = await this.api.fetch('/api/healthcheck?info=1');
    const dataVersion = data.__VERSION || data.__VERSION__;
    if (!dataVersion) return;
    if (version !== dataVersion) {
      window.location.reload(true);
    }
  }

  provide() {
    return {
      app: this,
      uapp: this,
      log: this.log,
      config: this.config,
      page: this.page,
      rootState: this.rootState,
      state: this.state, // appState
      req: this.req,

      api: this.api,
      auth: this.auth,
      user: this.user,

      i18: this.i18,
      t: this.t,
      module: this.module,

      // locale: this.locale,
      theme: this.theme,
    };
  }

  _provide() {
    if (this._provides) return this._provides;
    this._provides = this.provide();
    return this._provides;
  }
}
