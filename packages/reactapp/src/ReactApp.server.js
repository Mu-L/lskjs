import get from 'lodash/get';
import { createMemoryHistory } from 'history';
import Module from '@lskjs/module';
import pick from 'lodash/pick';
// import BaseUapp from '@lskjs/uapp';
import Promise from 'bluebird';
import autobind from '@lskjs/autobind';
import collectExpressReq from '@lskjs/utils/collectExpressReq';
// import antimergeDeep from '@lskjs/utils/antimergeDeep';
// import ReactDOM from 'react-dom/server';
import { renderToStaticMarkup, renderToString, renderToNodeStream } from 'react-dom/server';
// import { renderStylesToString, renderStylesToNodeStream } from 'emotion-server';
import BaseHtml from './Html';

export default class ReactApp extends Module {
  name = 'App';

  getRootState() {
    // ({ req } = {}) {
    return { __EMPTY__: true };
    // const rootState = {
    //   reqId: req.reqId,
    //   token: req.token,
    //   user: req.user,
    //   ...(this.rootState || {}),
    // };
    // if (this.config.remoteConfig) {
    //   const realConfig = this.config.client || {};
    //   if (__DEV__) {
    //     rootState.config = realConfig;
    //   } else {
    //     rootState.config = antimergeDeep(realConfig, this.initConfigClient);
    //   }
    // }
    // return rootState;
  }

  async getUapp({ req: initReq, ...params } = {}) {
    const { Uapp } = this;
    const req = collectExpressReq(initReq);

    const url = initReq.originalUrl; // || req.url || req.path;
    const uapp = new Uapp({
      ...params,
      history: createMemoryHistory({
        initialEntries: [url],
      }),
      req,
      rootState: this.getRootState({ req: initReq }),
      config: get(this, 'config.client', {}),
      app: this,
    });
    try {
      if (uapp.start) {
        await uapp.start();
      }
    } catch (err) {
      this.log.error('uapp.start()', err);
      throw err;
    }
    return uapp;
  }

  async getPage({ req } = {}) {
    const uapp = await this.getUapp({ req });
    await uapp.resolve({
      path: req.originalUrl || req.url || req.path,
      query: req.query,
    });
    return uapp.page;
  }

  async renderToNodeStream({ res, render, component }) {
    const delemitter = `<!-- renderToNodeStream ${Math.random()} renderToNodeStream --->`;
    const content = await render(delemitter);
    const [before, after] = content.split(delemitter);
    res.write(before);
    const stream = renderToNodeStream(component); // .pipe(renderStylesToNodeStream());
    stream.pipe(res, { end: false });
    stream.on('end', () => {
      res.write(after);
      res.end();
    });
  }

  getAssetManifest() {
    const publicPath = get(this, 'config.server.public', `${process.cwd() + (__DEV__ ? '' : '/..')}/public`);
    const assetManifestPath = `${publicPath}/asset-manifest.json`;
    try {
      const str = require('fs').readFileSync(assetManifestPath);
      const json = JSON.parse(str);
      return json;
    } catch (err) {
      this.app.log.error(`Html getAssetManifest can't open: ${assetManifestPath}`, err);
      return {};
    }
  }

  createHtmlRender(page) {
    const { Html = BaseHtml } = this;
    return content => {
      const html = new Html({
        content,
        assetManifest: this.getAssetManifest(),
        meta: get(page, 'state.meta', {}),
        rootState: get(page, 'rootState.rootState,', { SOME_ROOT_STATE: 1 }),
      });
      return html.render();
    };
  }

  @autobind
  async render(req, res) {
    const strategy = get(req, 'query.__strategy') || get(this, 'config.reactApp.strategy') || null;
    // const strategy = 'stream' in req.query ? 'renderToNodeStream' : null;
    let status = 200;
    let page;
    let component;
    let content;
    try {
      try {
        page = await this.getPage({ req });
      } catch (err) {
        throw { err, stack: ['Error SSR', 'ReactApp.render', 'ReactApp.getPage(req)'] };
      }
      if (get(page, 'state.redirect')) {
        // eslint-disable-next-line no-shadow
        const { redirect: redirectArgs, status = 300 } = get(page, 'state', {});
        const [redirect] = redirectArgs;
        if (__DEV__) {
          this.log.debug('ReactApp.redirect', redirect);
          await Promise.delay(2000);
        }
        if (strategy === 'json') {
          return { status, redirect };
        }
        return res.redirect(redirect);
      }
      try {
        ({ status = 200 } = get(page, 'state', {}));
        component = page.render();
      } catch (err) {
        throw { err, stack: ['Error SSR', 'ReactApp.render', 'page.render()'] };
      }

      // console.log('component', component);
      try {
        if (strategy === 'nodeStream') {
          // рендерим потом асинхронно
        } else if (strategy === 'staticMarkup') {
          content = renderToStaticMarkup(component);
        } else {
          content = renderToString(component);
        }
      } catch (err) {
        throw { err, stack: ['Error SSR', 'ReactApp.render', 'ReactDOM.renderToStaticMarkup(component)'] };
      }
      // console.log('content', content);
    } catch ({ err, stack }) {
      status = 505;
      if (__DEV__) {
        const text = [...stack, ''].join(':\n');
        if (this.log && this.log.error) {
          this.log.error(text, err);
        } else {
          console.error(text, err); // eslint-disable-line no-console
        }
        content = `<pre>${text}${err ? JSON.stringify(err.stack) : ''}</pre>`;
      } else {
        content = err.message;
      }
    }
    const render = this.createHtmlRender(page);
    if (strategy === 'nodeStream' && !content && component) {
      return this.renderToNodeStream({
        req,
        res,
        render,
        component,
      });
    }
    try {
      content = await render(content);
    } catch (err2) {
      status = 505;
      content = 'ERROR: Html.render()';
      if (this.log && this.log.error) {
        this.log.error(content, err2);
      } else {
        console.error(content, err2); // eslint-disable-line no-console
      }
    }

    if (strategy === 'json') {
      return { status, content };
    }

    return res.status(status).send(content);
  }
}
