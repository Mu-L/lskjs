# LSK.js – bots-plugin-interview

> @lskjs/bots-plugin-interview – LSK.js plugin for @lskjs/bots module for telegram, slack, discord, whatsapp, twitter, instagram and vk bots creation

[![LSK logo](https://badgen.net/badge/icon/MADE%20BY%20LSK?icon=zeit\&label\&color=red\&labelColor=red)](https://github.com/lskjs)
[![NPM version](https://badgen.net/npm/v/@lskjs/bots-plugin-interview)](https://www.npmjs.com/package/@lskjs/bots-plugin-interview)
[![NPM downloads](https://badgen.net/npm/dt/@lskjs/bots-plugin-interview)](https://www.npmjs.com/package/@lskjs/bots-plugin-interview)
[![NPM Dependency count](https://badgen.net/bundlephobia/dependency-count/@lskjs/bots-plugin-interview)](https://bundlephobia.com/result?p=@lskjs/bots-plugin-interview)
[![Have TypeScript types](https://badgen.net/npm/types/@lskjs/bots-plugin-interview)](https://www.npmjs.com/package/@lskjs/bots-plugin-interview)
[![Have tree shaking](https://badgen.net/bundlephobia/tree-shaking/@lskjs/bots-plugin-interview)](https://bundlephobia.com/result?p=@lskjs/bots-plugin-interview)
[![NPM Package size](https://badgen.net/bundlephobia/minzip/@lskjs/bots-plugin-interview)](https://bundlephobia.com/result?p=@lskjs/bots-plugin-interview)
[![Package size](https://badgen.net//github/license/lskjs/lskjs)](https://github.com/lskjs/lskjs/blob/master/LICENSE)
[![Ask us in Telegram](https://img.shields.io/badge/Ask%20us%20in-Telegram-brightblue.svg)](https://t.me/lskjschat)

<!-- template file="scripts/templates/preview.md" start -->

<!-- template end -->

***

<!-- # 📒 Table of contents  -->

# Table of contents

*   [⌨️ Install](#️-install)

    *   [Описание](#описание)

        *   [Interview](#interview)

        *   [Portal](#portal)

            *   [Конфиг с проверкой, заполнил ли пользователь необходимые формы.](#конфиг-с-проверкой-заполнил-ли-пользователь-необходимые-формы)
            *   [Конфиг с вызовом формы по триггеру](#конфиг-с-вызовом-формы-по-триггеру)

*   [📖 License](#-license)

*   [👥 Contributors](#-contributors)

*   [👏 Contributing](#-contributing)

*   [📮 Any questions? Always welcome :)](#-any-questions-always-welcome-)

# ⌨️ Install

```sh
# yarn
yarn i @lskjs/bots-plugin-interview lodash

# npm
npm i @lskjs/bots-plugin-interview lodash
```

***

## Описание

*Bots Interview Plugin* (*@lskjs/bots-plugin-interview*) - плагин, позволяющий создавать формы ввода в боте. Реализована вариация с классической браузерной формой с подтверждением введенных данных. Режим диалога находится в стации разработки.

Конфиг для плагина состоит из двух частей - interview и portal. Interview отвечает за настройку формы, её полей и их валидацию. Portal реализует взаимодействие с формой. Например, при каких действиях пользователя будет вызвана форма.

Входные данные сохраняются в базу и хранятся в модели `BotsTelegramUserModel`. Путь в модели  `meta.interview.[formName]`.

### Interview

    bots: {
        plugins: {
          interview: {
            forms: {
              intro:  {
                title: 'Добро пожаловать. Для продолжения пройдите краткую регистрацию!',
                controls: {
                  name: {
                    title: 'Имя',
                    placeholder: 'Введите имя',
                    format: String,
                  },
                  city: {
                    title: 'Город',
                    placeholder: 'Введите город',
                  },
                  age: {
                    title: 'Возраст',
                    placeholder: 'Введите ваш возраст',
                    format: Number,
                  },
                },
                fields: ['name', 'city', 'age'],
              },
            },
          },

*   `bot/plugins/interview/forms` - обязательный путь до форм.

*   `intro`  \[String] - название формы.
    1.  Название формы должно быть уникально.
    2.  Название формы используется в portal-части для коннекта с формой.

*   `intro.title`  \[String] - текст, который видит пользователь при появлении формы.

*   `intro.controls`  \[Object] - поля формы, которые будут заполняться пользователем.

*   `controls.[name/city/age]`  \[String] - названия полей формы внутри конфига.

*   `controls.name.title`  \[String] -  название поля формы, которое видит пользователь в `intro.title`.

*   `controls.name.placeholder`  \[String] - текст, выводимый перед заполнением поля формы.

*   `controls.name.format` \[function] - валидация входных данных.

*   `intro.fields`  \[Array of String] - массив с активными полями формы.

### Portal

#### Конфиг с проверкой, заполнил ли пользователь необходимые формы.

    { 
      criteria: {
        messageText: /^(?!\/registration).*$/,
        nextRoute: /^(?!\/interview).*$/,
      },
      action: {
        type: 'checkInterview',
        forms: ['intro'],
        then: [
    		type: 'reply',
          text: 'Успех!',
    	  ],
        else: {
          type: 'reply',
          text: 'Необходима регистрация! /registration'
        },
      },
    },

*   `criteria.messageText`  \[String | RegExp] - если текст сообщения не содержит  /registration, то запусти action. Критерий необходим, чтобы при вызове формы не вызывалась проверка на её заполненность.

*   `criteria.nextRoute`  \[String | RegExp] - если следующее сообщение не содержит  /interview, то запусти action. Данный критерий блокирует вызов action в процессе заполнения формы (иначе проверка на заполненность будет вызываться при каждом вводе поля формы).

*   `action.type`  \[String] - тип действия бота. Запускает проверку на заполненность формы.

*   `action.forms`  \[Array of String | String] - список с названиями форм, которые следует заполнить для прохождения проверки.

*   `action.then`  \[Object]  - действие, если все формы из списка заполнены.

*   `action.else`  \[Object]  - действие, если хотя бы одна форма из списка не заполнена.

***

#### Конфиг с вызовом формы по триггеру

    {
      criteria: {
        chatType: 'private',
        messageText: '/registration',
      },
      action: {
        type: 'replyInterview',
        formName: 'intro',
        mode: 'form',
        preview: false,
        autosubmit: false,
        then: {
          type: 'reply',
          text: 'Успех!',
        },
      },
    },

*   `criteria.chatType`  \[String] - тип чата, в котором будет действовать конфиг.

*   `criteria.messageText`  \[String] - если текст сообщения “/registration”, то запусти action.

*   `action.type`  \[String] - тип действия бота. Отправляет форму пользователю.

*   `action.formName`  \[String]- название формы, которая будет отправлена пользователю.

*   `action.mode`  \[String] - режим для формы -> \[form/dialog] .
    1.  form - классическая форма.
    2.  dialog - режим живого диалога с ботом (в разработке).

*   `action.preview`  \[Boolean] - параметр, который указывает, необходимо ли выводить title формы перед вводом данных.

*   `action.autosubmit`  \[Boolean] - параметр, который указывает, необходимо ли подтверждение данных формы.

*   `action.then`  \[Object] - действие после завершения ввода данных.

# 📖 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

# 👥 Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

<!-- prettier-ignore-start -->

<!-- markdownlint-disable -->

<table>
  <tr>
    <td align="center"><a href="https://isuvorov.com"><img src="https://avatars2.githubusercontent.com/u/1056977?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Igor Suvorov</b></sub></a><br /><a href="lskjs/lskjs///commits?author=isuvorov" title="Code">💻</a> <a href="#design-isuvorov" title="Design">🎨</a> <a href="#ideas-isuvorov" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

# 👏 Contributing

1.  Fork it (<https://github.com/yourname/yourproject/fork>)
2.  Create your feature branch (`git checkout -b features/fooBar`)
3.  Commit your changes (`git commit -am 'feat(image): Add some fooBar'`)
4.  Push to the branch (`git push origin feature/fooBar`)
5.  Create a new Pull Request

# 📮 Any questions? Always welcome :)

*   [Email](mailto:hi@isuvorov.com)
*   [LSK.news – Telegram channel](https://t.me/lskjs)
*   [Спроси нас в телеграме ;)](https://t.me/lskjschat)
