import Module from '@lskjs/module';
import elasticsearch from 'elasticsearch';
import mexp from 'mongoose-elasticsearch-xp-async';
import merge from 'lodash/merge';
import get from 'lodash/get';

export default class ElasticServerModule extends Module {
  enabled = false;
  delayedModels = [];
  config = {
    sync: true,
    client: {
      host: 'localhost:9200',
      maxRetries: 10000,
      log: {
        level: 'error',
      },
    },
    pingTimeout: 5000,
    settings: {
      analysis: {
        filter: {
          ngram_filter: {
            type: 'ngram',
            min_gram: 3,
            max_gram: 4,
            token_chars: ['letter', 'digit'],
          },
          autocomplete_filter: {
            type: 'edge_ngram',
            min_gram: 1,
            max_gram: 20,
          },
          stopprotocol_filter: {
            type: 'stop',
            stopwords: ['http', 'https', 'ftp', 'www'],
          },
        },
        analyzer: {
          ngram_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['ngram_filter', 'lowercase'],
          },
          autocomplete: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'autocomplete_filter'],
          },
          url_lowercase_without_protocols: {
            type: 'custom',
            tokenizer: 'lowercase',
            filter: ['stopprotocol_filter'],
          },
        },
      },
    },
  };

  async getConfig() {
    return merge(
      //
      {},
      await super.getConfig(),
      get(this, 'config', {}),
      get(this, '__config', {}),
    );
  }

  async init() {
    await super.init();
    this.enabled = true;
    this.nowSync = [];
    this.client = new elasticsearch.Client(this.config.client);
    this.delayedModels.forEach(([schema, params]) => {
      this.addModel(schema, params);
    });
  }
  getProjectionModel(model) {
    const projection = {};
    Object.keys(model.schema.obj).forEach((key) => {
      const field = model.schema.obj[key];
      if (field.es_indexed) {
        projection[key] = 1;
      }
    });
    return projection;
  }

  async sync({ model, params, again = false } = {}) {
    const projection = this.getProjectionModel(model);
    const { modelName } = model;
    if (params || !this.nowSync.includes(modelName)) {
      try {
        if (!params) {
          this.nowSync.push(modelName);
        }
        await model.esCreateMapping();
        await model.esSynchronize(params || {}, projection);
        if (!params) {
          this.removeFromNowSync(modelName);
        }
        if (again) {
          setTimeout(() => {
            this.sync({ model, again });
          }, parseInt(this.config.syncTimeDelay, 10) || 5000);
        }
      } catch (err) {
        if (!params) {
          this.removeFromNowSync(modelName);
        }
        if (again) {
          setTimeout(() => {
            this.sync({ model, again });
          }, parseInt(this.config.syncTimeDelay, 10) || 5000);
        }
        // eslint-disable-next-line no-console
        console.error(err, 'es error', modelName);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(modelName, 'already in sync');
    }
  }

  async syncAll({ again = false } = {}) {
    const modelNames = this.app.db.modelNames();
    modelNames.forEach(async (modelName) => {
      const model = this.app.db.model(modelName);
      if (model.esCreateMapping) {
        this.sync({ model, again });
      }
    });
  }

  removeFromNowSync(modelName) {
    this.nowSync = this.nowSync.filter((item) => item !== modelName);
  }

  addModelWithDelay(schema, params = {}) {
    this.delayedModels.push([schema, params]);
  }

  addModel(schema, params = {}) {
    if (!this.enabled) return;
    const options = merge(
      {
        client: this.client,
        bulk: {
          batch: 1000,
        },
        mappingSettings: {
          settings: this.config.settings,
        },
        numberOfShards: this.config.numberOfShards,
      },
      params,
    );
    schema.getMongooseSchema().plugin(mexp.v7, options);
  }

  async run() {
    if (!this.enabled) return;
    if (this.config.sync) {
      this.syncAll({ again: true });
    }
  }
}
