/* eslint-disable @typescript-eslint/interface-name-prefix */
import { Logger, ILogger } from '@lskjs/log2';
import get from 'lodash/get';
import assignProps from '@lskjs/utils/assignProps';
import createEventEmitter from './createEventEmitter';
import { IEventEmitter, IModule, IApp } from './types';

// abstract
class Module2 implements IModule {
  name: string;
  _module?: boolean | string;
  app?: IApp;
  parent?: IModule;
  ee?: IEventEmitter;
  log?: ILogger;
  debug?: boolean;
  config: {
    log?: any;
    [key: string]: any;
  };

  constructor(...props: any[]) {
    assignProps(this, ...props);
  }

  static async create(...props: any[]): Promise<IModule> {
    const instance = new this(...props);
    await instance.init();
    return instance;
  }

  static async createAndRun(...props: any[]): Promise<IModule> {
    const instance = await this.create(...props);
    await instance.run();
    return instance;
  }

  createLogger(): ILogger {
    const logProps = get(this, 'config.log', {});
    return new Logger({ ...logProps, name: this.name });
  }

  createEventEmitter(): IEventEmitter {
    return createEventEmitter() as IEventEmitter;
  }

  on(event: string, callback: (event: string, ...args: any[]) => void): void {
    if (!this.ee) this.ee = this.createEventEmitter();
    this.ee.on(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.ee) this.ee = this.createEventEmitter();
    this.ee.emit(event, ...args);
  }

  private __initAt: Date;
  private __runAt: Date;

  async init(): Promise<void> {
    if (this.__initAt) return;
    this.__initAt = new Date();
    this.name = this.constructor.name;
    if (!this.log) this.log = this.createLogger();
    if (this.debug && this.log) this.log.trace('init');
  }

  async run(): Promise<void> {
    if (this.__runAt) return;
    if (!this.__initAt) await this.init();
    this.__runAt = new Date();
    if (this.debug && this.log) this.log.trace('run');
  }

  async start(): Promise<void> {
    if (!this.__initAt) await this.init();
    if (!this.__runAt) await this.run();
  }

  async stop(): Promise<void> {
    // 
  }
}

export default Module2;
