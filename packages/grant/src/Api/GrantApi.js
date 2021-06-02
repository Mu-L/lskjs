import Api from '@lskjs/server-api';
import Bluebird from 'bluebird';
import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';

import CacheStorage from '../CacheStorage';

export default class GrantApi extends Api {
  getRoutes() {
    return {
      '/can': this.can.bind(this),
      '/canGroup': this.canGroup.bind(this),
      '/batch': this.batch.bind(this),
    };
  }
  async check(rule, userId) {
    const grant = await this.app.module('grant');
    if (!isPlainObject(rule)) throw 'data is not object';
    if (rule.userId && rule.userId !== userId) {
      // eslint-disable-next-line no-console
      console.log('ALARMAAAAAA ALARMAAAAAAALARMAAAAAAALARMAAAAAA -- userId is changed');
    }
    const cache = new CacheStorage();
    const res = await grant.can({
      ...rule,
      userId,
      cache,
    });
    return res;
  }
  async checkGroup(rules, userId) {
    const grant = await this.app.module('grant');
    // if (!isPlainObject(rule)) throw 'data is not object';
    // if (rule.userId && rule.userId !== userId) {
    //   // eslint-disable-next-line no-console
    //   console.log('ALARMAAAAAA ALARMAAAAAAALARMAAAAAAALARMAAAAAA -- userId is changed');
    // }
    const _rules = rules.map((rule) => ({
      ...rule,
      userId,
    }));
    const cache = new CacheStorage();
    return grant.canGroup(_rules, cache);
  }
  async can(req) {
    const userId = req.user && req.user._id;
    return this.check(req.data, userId);
  }
  async canGroup(req) {
    // return console.log(req.data);
    const userId = req.user && req.user._id;
    const data = get(req.data, 'data', []);
    if (!Array.isArray(data)) throw 'data is not array';
    return this.checkGroup(data, userId);
  }
  async batch(req) {
    const userId = req.user && req.user._id;
    const { rules } = req.data;
    return Bluebird.map(rules, (rule) => this.check(userId, rule));
  }
}
