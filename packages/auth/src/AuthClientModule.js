/* global window */
import { isClient, isDev } from '@lskjs/env';
// import Err from '@lskjs/err';
import Module from '@lskjs/module';
import cookie from 'js-cookie';
import get from 'lodash/get';

import LocalStorage from './Storage/LocalStorage';
import MemoryStorage from './Storage/MemoryStorage';
import stores from './stores';

// const DEBUG = __DEV__ && __STAGE__ === 'isuvorov';
// const DEBUG = false;

export default class AuthClientModule extends Module {
  async init() {
    await super.init();
    // this.stores = require('./stores').default(this.app);
    const AuthStore = await this.module('stores.AuthStore');
    this.store = new AuthStore();
    if (isClient) {
      this.localStorage = new LocalStorage({
        // memoryState: this.app.rootState,
        config: get(this, 'app.config.storage', {}),
      });
      await this.localStorage.init();
    }
    this.memoryStorage = new MemoryStorage({
      state: this.app.rootState,
      config: get(this, 'app.config.storage', {}),
    });
    await this.memoryStorage.init();
  }

  async getModules() {
    return {
      ...(await super.getModules()),
      stores: [() => import('@lskjs/mobx/mobxStores'), { stores }],
    };
  }

  async run() {
    await super.run();
    await this.loadStore();
    if (this.store.isAuth()) {
      const timeout = isDev ? 10000 : 1000;
      setTimeout(() => {
        this.updateSession();
      }, timeout);
    }
  }

  setToken(token, expires = 365, cookies = true) {
    if (this.debug) this.log.trace('AuthClientModule.setToken', token);
    if (this.app.api) this.app.api.setAuthToken(token);
    if (this.app.apiq) this.app.apiq.setToken(token);
    if (this.memoryStorage) this.memoryStorage.set('req.token', token);
    const { name = 'token', ...options } = get(this.app, 'config.jwt.cookie', {});
    if (this.debug) this.log.trace('AuthClientModule.setToken cookie', { name, options, token });
    if (isClient && cookies) {
      if (token == null) {
        cookie.remove(name, options);
      } else {
        cookie.set(name, token, { expires, ...options });
      }
    }
  }

  async loadStore() {
    let state = {};
    if (this.memoryStorage) {
      state = {
        ...state,
        ...this.memoryStorage.get('auth'),
      };
    }
    if (this.localStorage) {
      state = {
        ...state,
        ...this.localStorage.get('auth'),
      };
    }
    if (!state.session && this.memoryStorage.get('req.user')) {
      const session = {
        // _id: this.memoryStorage.get('req.userId'),
        _id: this.memoryStorage.get('req.user._id'),
        user: this.memoryStorage.get('req.user'),
        token: this.memoryStorage.get('req.token'),
      };
      state = {
        ...state,
        session,
        sessions: [session],
      };
    }

    if (this.debug) this.log.trace('loadStore', state);
    this.store.setState(state);

    const { session } = this.store;
    await this.setToken(session ? session.token : null);
  }

  async saveStore() {
    const { session } = this.store;
    if (this.localStorage) this.localStorage.set('auth', this.store.getState());
    if (this.memoryStorage) this.memoryStorage.set('auth', this.store.getState());
    await this.setToken(session ? session.token : null);
    // try {
    //   await this.app.reconnect();
    // } catch (err) {
    //   console.error('AuthStore.applyPromise: this.app.reconnect', err);  //eslint-disable-line
    // }
  }

  isAuth() {
    return this.store.isAuth();
  }
  getSession() {
    return this.store.getSession();
  }
  getUserId() {
    return this.store.getUserId();
  }

  async logout(redirect = true) {
    await this.store.logout();
    await this.saveStore();
    if (redirect) this.app.redirect('/');
  }

  async signup(...args) {
    const res = await this.store.signup(...args);
    await this.saveStore();
    return res;
  }

  async login(...args) {
    const res = await this.store.login(...args);
    await this.saveStore();
    return res;
  }

  async updateSession(...args) {
    try {
      const res = await this.store.updateSession(...args);
      await this.saveStore();
      return res;
    } catch (err) {
      if (err.code === 'auth.userNotFound') {
        await this.logout();
      }
      throw err;
    }
  }

  confirm(values) {
    return this.app.api.fetch('/api/auth/permit/confirm', {
      method: 'POST',
      data: values,
    });
  }

  restorePassword({ email }) {
    return this.app.api.fetch('/api/auth/restorePassword', {
      method: 'POST',
      data: { email },
    });
  }

  setPassword({ permitId, code, password }) {
    return this.app.api.fetch('/api/auth/setPassword', {
      method: 'POST',
      data: { permitId, code, password },
    });
  }

  confirmEmail({ permitId, code }) {
    return this.app.api.fetch('/api/auth/confirmEmail', {
      method: 'POST',
      data: { permitId, code },
    });
  }

  setData(...args) {
    return this.store.setData(...args);
  }

  loginPassport(data) {
    return this.applyPromiseAndFetchProfile(this.app.api.authLoginPassport(data));
  }

  authPassport(provider) {
    if (typeof window !== 'undefined') window.location = `/api/module/auth/${provider}`;
  }
}

// export default ctx => ({
//   init() {
//     // this.components = require('./uapp/components').default(ctx);
//     // this.socials = require('./uapp/socials').default;// (ctx);
//     // this.models = require('./uapp/models').default(ctx);
//     this.stores = require('./uapp/stores').default(ctx);
//     // this.router = require('./uapp/router').default;
//   },
//   // getStores
// });
