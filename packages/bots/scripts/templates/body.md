# Bots Plugin Portal

__Bots Plugin Portal__ (*@lskjs/bots-plugin-portal*) - плагин, позволяющий настраивать реакции бота на различные триггеры. 

Конфиг плагина находится по пути `bots.plugins.portal` и имеет вид:

```js
bots: {
  plugins: {
    portal: {
      group: true,
      rules: [
        //...
      ],
    },
  },
},
```

__Params:__

| Field | Type | Desription |
| ------ | :------: | ------ |
| group | Boolean | Группировать ли медиа-файлы |
| rules | Array of Objects | Массив правил, которым следует бот при обработке входящих сообщений или при срабатывании крона |

__Group values:__

| Field | Value | Description | 
| ------ | :------: | ------ |
| group | true | Группирует медиа-файлы в одно сообщение и помещает их в `ctx.group` |
| group | false | Медиа-файлы приходят на сервер разными сообщениями |
    
    /Reference/: При отправке боту нескольких медиа-файлов одним сообщением, на сервер медиа-файлы приходят разными сообщениями. Т.е. при отправке 5 изображений одним сообщением, на сервер приходит не одно сообщение, а 5.

---

## Правила (rules)
Правила позволяют устанавливать триггеры на действия пользователей или на срабатывание крона. Представляют из себя объекты и могут быть вложены друг в друга.

__Правила состоят из 3-х частей:__
|  Rule Part  | Type | Required | Description |
|  ------  |  :------:  | :------: |  ------  |
|  cron  |  Array of String\String | - | Позволяет устанавливать расписания срабатываний экшона |
|criteria| Object | - | Критерии срабатывания экшона при обработке действий пользователя |
| action | Object | + | Экшоны. Описания действий, которые выполняет бот |


### `cron` 

Параметр позволяет устанавливать время срабатывания действия бота. Например, если необходимо установить отправку сообщений в чат каждую минуту, то конфиг будет выглядеть `cron: '* * * * *'`. 

Официальный пакет крона: [node-cron - npm](https://www.npmjs.com/package/node-cron) 

### `criteria`

Параметр позволяет устанавливать критерии на триггеры срабатывания бота. Например, если необходимо, чтобы бот реагировал только на сообщения в определенном чате, то критерий будут выглядеть  `chatId: 12345678`.

Если criteria отсутствует, то правила могут срабатывать только по крону. Если же `criteria: {}`, то считается, что критерий отбора нет и правила будут срабатывать на любые взаимодействия с ботом.

### `action`

Параметр задает действия бота. Здесь настраивается, будет бот искать сообщения, оправлять или удалять их и тд. 

Действия могут быть вложенными и составлять цепочки при помощи полей `then` и `else`.  При удачном выполнении действия-родителя бот будет выполнять действия из поля `then`. При неудачном - `else`. Аналогия с if/else, где if - then, а else - else. Например, при проверке checkMessage, если сообщение существует, то бот пройдет по ветке `then`, в противном случае по `else`.

Кроме вложенности, action/then могут быть массивами и содержать параллельные действия.

__Examples:__ 

```js
{
  cron: '* * * * *',
  criteria: {
    chatId: 12345678,
  },
  action: {
    type: 'checkMessage',
    chatId: -123114346456,
    userId: 12345678,
    then: {
      type: 'sendMessage',
      text: 'some text by true checkMessage',
      to: 12345678,
    },
    else: {
      type: 'sendMessage',
      text: 'some text by false checkMessage',
      to: 12345678,
    },
  },
},
```

```js
{
  cron: ['*/20 * * * *', '*/15 * * * * *'],
  action: [
    {
      type: 'sendMessage',
      text: 'some text 1',
      to: 12345678,
    },
    {
      type: 'sendMessage',
      text: 'some text 2',
      to: -87654321123,
    },
  ],
}
```

```js
{
  criteria: {
    chatId: 12345678,
  },
  action: {
    type: 'reply',
    text: 'some text by reply',
  },
},
```

## Параметры, используемые при настройке критериев:

| Criteria Field | Type | Values | Description | 
| ------ | :------: | ------ | ------ | 
| userId | Array of Number\Array of String\Number\String | | ID пользователя, который взаимодействует с ботом |
| chatId | Array of Number\Array of String\Number\String | | ID чата, в котором происходит взаимодействие с ботом |
| chatType | String | private\group\supergroup\channel | Тип чата, в котором происходит взаимодействие |
| messageType | String | | Тип сообщения. Различают множество типов сообщений |
| messageText | String\RegExp | | Текст сообщения. Например, можно сделать критерий на команду запуска бота `messageText: /start` |
| nextRoute | String\RegExp | |  Следующий роут. Используется только при заполнении формы. Необходимо устанавливать данный критерий для блокировки каких-либо действий во время заполнения формы в целях избежать спама и лишних триггеров. |

__Chat types:__
1. `private` - личные диалог с ботом
2. `group` - общий чат
3. `supergroup` - общий чат
4. `channel` - канал

__Message types:__
1. `mediaGroup` - группа медиа-файлов
2. `audio` - приложен аудио-файл
3. `document` - приложен документ
4. `animation` - гифка
5. `photo` - приложено изображение
6. `sticker` - стикер
7. `video` - приложено видео
8. `video_note` - видео-кружочек
9. `voice` - голосовое сообщение
10. `contact` - контакт
11. `dice` - игральная кость
12. `game` - игра
13. `poll` - голосование
14. `quiz` - викторина
15. `location` - геоданные
16. `venue` - место
17. `text` - текстовое сообщение

## Список действий, которые реализованы в плагине:
1. [createMessage](#createMessage) - создание сообщений
2. [messageAppend](#messageAppend) - добавление текста в конец
3. [messageTrim](#messageTrim) - фильтр текста
4. [messageEditExtra](#messageEditExtra) - редактирование кнопок
5. [messageAddExtra](#messageAddExtra) - добавление кнопок
6. [sendMessage](#sendMessage) - отправка сообщений
7. [reply](#reply) - реплай
8. [repost](#repost) - репост
9. [copyMessage](#copyMessage) - копирование сообщений
10. [remove](#remove) - удаление сообщений
11. [findMessage](#findMessage) - поиск сообщения
12. [pinChatMessage](#pinChatMessage) - закрепление сообщения
13. [messageSplit](#messageSplit) - разделение сообщения на элементы
14. [messagesJoin](#messagesJoin) - группировка сообщений в одно
15. [checkInterview](#checkInterview) - проверка заполнения формы
16. [replyInterview](#replyInterview) - отправка формы

### createMessage

__createMessage__ - действие бота, необходимое для создания сообщения и последующего редактирования перед отправкой. После создания сообщения, к нему можно добавить/изменить кнопки, отредактировать его текст и тд. 

При срабатывании createMessage от крона, создается пустое сообщение, которое можно заполнять различным контентом.<br/>
При срабатывании createMessage от действия пользователя, сообщение создается на основе входящих данных. Т.е. в текст созданного сообщения помещается текст, написанный пользователем. С кнопками и файлами происходят аналогичные действия.

__Params:__

| Field | Type | Description |
| ------ | :------: | ------ |
| text | String | текст сообщения |
| to | Array of Number\Array of String\Number\String | ID чата, в который будет отправлено сообщение |

__Example:__

```js
{
  criteria: {},
  action: {
    type: 'createMessage',
    text: "It's field from message text",
    to: 12345678,
  },
},
```


### messageAppend
__messageAppend__ - действие бота, позволяющее добавить текст в конец сообщения.

__Params:__

| Field | Type | Description |
| ------ | :------: | ------ |
| text | String | Добавочный текст |

__Example:__

```js
{
  criteria: {
    messageText: /\/trim/,
  },
  action: {
    type: 'messageAppend',
    text: 'by @download4bot',
    then: {
      type: 'repost',
      to: 12345678,
    },
  },
},

```

### messageTrim
__messageTrim__ - действие бота, позволяющее отфильтровать текст сообщения.

__Params:__

| Field | Type | Description |
| ------ | :------: | ------ |
| hashtags | Boolean |Удаляет все хештеги из текста сообщения |
| links | Boolean | Удаляет все ссылки из текста сообщения |
| regExp |  RegExp | Позволяет удалять любые пользовательские шаблоны из текста сообщения |

__Example:__

```js
{
  criteria: {
    messageText: /\/trim/,
  },
  action: {
    type: 'messageTrim',
    hashtags: 1,
    links: 1,
    regExp: /1?123\n?/,
    then: {
      type: 'repost',
      to: 12345678,
    },
  },
},

```

### messageEditExtra
__messageEditExtra__ - действие бота, позволяющее отредактировать клавиатуру сообщения.

__Params:__

| Field | Type | Description |
| ------ | :------: |------ |
| extra | Array | Содержит редактируемые кнопки клавиатуры |

__Extra params for type *LIKE*__:

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| type | String | + | Кнопки лайк/дисслайк к сообщению |
| buttons | Array | - | Содержит редактируемые кнопки клавиатуры |
| buttons.disslike | Object | - | Настройка кнопки дисслайка |
| buttons.like | Object | - | Настройка кнопки дисслайка |

__Extra params for type *ANSWER*__:

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| type | String | + | Кнопка для установления соединения с другим пользователем через бота (чат) |
| text | String | - | Настройка текста кнопки |

__Extra params for type *SENDER*__:

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| type | String | + | Кнопка для перехода к отправителю сообщения |
| text | String | - | Настройка текста кнопки |

__Example:__

```js
{
  criteria: {}
  action: {
    type: 'createMessage',
    text: 'Title text',
    then: {
      type: 'messageEditExtra',
      extra: [
        {
          type: 'like',
          buttons: {
            disslike: {
              title: 'test 💔', // default: '💔'
              value: 10, // default: 0
            },
            like: {
              title: 'test ❤️', // default: '❤️'
              value: 0, // default: 0
            },
          },
        },
        {
          type: 'answer',
          text: 'Answer @{{username}}', // default: '@username'
        },
        {
          type: 'sender',
          text: 'Sender: @{{username}}', // default: '@username'
        },
      ],
      then: {
        type: 'sendMessage',
        to: 12345678,
      },
    },
  },
},
```

### messageAddExtra
__messageAddExtra__ - действие бота, позволяющее добавить новую клавиатуру сообщения. Если клавиатура уже существует, то messageAddExtra заменит текущую на новую.

__Params:__
| Field | Type | Description |
| ------ | :------: | ------ |
| extra | Array | Содержит редактируемые кнопки клавиатуры |

__Extra params for type *LIKE*__:

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| type | String | + | Кнопки лайк/дисслайк к сообщению |
| buttons | Array | - | Содержит редактируемые кнопки клавиатуры |
| buttons.disslike | Object | - | Настройка кнопки дисслайка |
| buttons.like | Object | - | Настройка кнопки дисслайка |

__Extra params for type *ANSWER*__:

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| type | String | + | Кнопка для установления соединения с другим пользователем через бота (чат) |
| text | String | - | Настройка текста кнопки |

__Extra params for type *SENDER*__:

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| type | String | + | Кнопка для перехода к отправителю сообщения |
| text | String | - | Настройка текста кнопки |

__Example:__

```js
{
  criteria: {}
  action: {
    type: 'createMessage',
    text: 'Title text',
    then: {
      type: 'messageAddExtra',
      extra: [
        {
          type: 'like',
          buttons: {
            disslike: {
              title: 'New disslike  💔', // default: '💔'
              value: 10, // default: 0
            },
            like: {
              title: 'New like  ❤️', // default: '❤️'
              value: 0, // default: 0
            },
          },
        },
        {
          type: 'answer',
          text: 'Answer @{{username}}', // default: '@username'
        },
        {
          type: 'sender',
          text: 'Sender: @{{username}}', // default: '@username'
        },
      ],
      then: {
        type: 'sendMessage',
        to: 12345678,
      },
    },
  },
},
```

### sendMessage

__sendMessage__ - действие бота, при котором бот отправляет сообщение заданному пользователю. Для настройки сообщения используется цепочка действий: `createMessage` -> `messageAddExtra` -> `messageAppend` -> `messageTrim` -> `sendMessage`.

__Params:__

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| text | String | - | Текст сообщения |
| to | Array of String/Array of Number/String/Number | - | ID получателя(-ей) |

__Example:__

```js
{
  criteria: {},
  action: {
    type: 'createMessage',
    then: {
      type: 'sendMessage',
      text: 'Text by sendMessage',
      to: 12345678,
    },
  },
},
```

### reply

__reply__ - действие бота, при котором бот отвечает на сообщение пользователя.

__Params:__

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| text | String | - | Текст сообщения |

__Example:__

```js
{
  criteria: {
    messageText: 'ping',
  },
  action: {
    type: 'reply',
    text: 'pong',
  },
},
```

### repost

__repost__ - действие бота, при котором бот пересылает активное сообщение в заданных чат.

__Params:__

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| to | Array of String/Array of Number/String/Number | - | ID получателя(-ей) |

__Example:__

```js
{
  criteria: {
    chatId: -136512436512436,
  },
  action: {
    type: 'repost',
    to: 12345678,
  },
},
```

### copyMessage

__sendMessage__ - действие бота, при котором бот копирует активное сообщение и пересылает его в заданных чат.

__Params:__

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| to | Array of String/Array of Number/String/Number | - | ID получателя(-ей) |

__Example:__

```js
{
  criteria: {
    chatId: -136512436512436,
  },
  action: {
    type: 'copyMessage',
    to: 12345678,
  },
},
```

### remove

__remove__ - действие бота, при котором бот удаляет активное сообщение. Активным сообщением является полученное сообщение, либо найденное при помощи findMessage.

__Example:__

```js
{
  criteria: {
    messageText: 'попит',
  },
  action: {
    type: 'remove',
  },
},
```

### findMessage

__findMessage__ - действие бота, позволяющее найти сообщение в чате по заданным параметрам. Поиск осуществляется в модели `BotsTelegramMessageModel`.

__Params:__

| Field | Type | Required | Description | 
| ------ | :------: | :------: | ------ |
| random | Boolean | - | Если нашлось несколько сообщений, выбирать ли случайное. По умолчанию: последнее полученное ботом сообщение. |
| criteria | Object | - | Критерии поиска сообщения в базе |
| criteria.userId | Array of Number\Array of String\Number\String | - | ID пользователя |
| criteria.chatId | Array of Number\Array of String\Number\String | - | ID чата |
| criteria.chatType | String | - | Тип чата |
| criteria.messageType | String | - | Тип сообщения |
| criteria.messageDate | Number | - | Дата сообщения в ms |
| criteria.messageText | String\RegExp | - | Текст сообщения |
| criteria.messageId | String\RegExp | - | ID сообщения |


__Example:__

```js
{
  criteria: {
    messageText: '/checkMessage',
  },
  action: {
    type: 'findMessage',
    criteria: {
      chatId: -1232343354655,
      messageText: '*message.text',
    },
    then: {
      type: 'repost',
      to: 12345678,
    },
  },
},
```

### pinChatMessage

__pinChatMessage__ - действие бота, при котором бот закрепляет активное сообщение. Активным сообщением является полученное сообщение, либо сообщение после `findMessage`/`createMessage`.

__Example:__

```js
{
  criteria: {
    messageText: /^#закрепить.*/,
  },
  action: {
    type: 'pinChatMessage',
  },
},
```

### messageSplit

__messageSplit__ - действие бота,  позволяющее разделять входящее сообщение на элементы для последующей работы. Например, если пользователь пишет боту сообщение, содержащее 5 изображений и подпись, то бот разделит сообщение на 6 элементов.

__Example:__

```js
{
  criteria: {},
  action: {
    type: 'messageSplit',
    then: {
      type: 'sendMessage',
      to: 12345678,
    },
  },
},
```

### messagesJoin

__messagesJoin__ - действие бота, позволяющее объединять несколько сообщений, переданных боту (например, пересылая сообщения). Если среди сообщений несколько подписей, то они объединятся в единый текст. 

__Example:__

```js
{
  criteria: {},
  action: {
    type: 'messagesJoin',
    then: {
      type: 'sendMessage',
      to: 12345678,
    },
  },
},
```

### checkInterview

__checkInterview__  - действие бота для проверки, заполнил ли пользователь необходимые формы.

__Params:__

| Field | Type | Description |
| ------ | :------: | ------ |
| type | String | Тип действия бота. Запускает проверку на заполненность формы |
| forms | Array of String/String | Список с названиями форм, которые следует заполнить для прохождения проверки |

__Example:__

```js
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
```

### replyInterview

__replyInterview__  - действие бота для отправки формы пользователю.

__Params:__

| Field | Type | Value | Description |
| ------ | :------: | ------ | ------ |
| type | String |  | Тип действия бота. Отправляет форму пользователю |
| formName | String |  | Название формы, которая будет отправлена пользователю |
| mode | String | form/dialog | Режим работы формы |
| preview | Boolean |  | Параметр, который указывает, необходимо ли выводить title формы перед вводом данных |
| autosubmit | Boolean |  | Параметр, который указывает, необходимо ли подтверждение данных формы |

__Example:__

```js
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
```

# Bots Plugin Interview

__Bots Plugin Interview__ (*@lskjs/bots-plugin-interview*) - плагин, позволяющий создавать формы ввода в боте. Реализована вариация с классической браузерной формой с подтверждением введенных данных. Режим диалога находится в стации разработки.

Конфиг для плагина состоит из двух частей - interview и portal. Interview отвечает за настройку формы, её полей и их валидацию. Portal реализует взаимодействие с формой. Например, при каких действиях пользователя будет вызвана форма.

Входные данные сохраняются в базу и хранятся в модели `BotsTelegramUserModel`. Путь в модели  `meta.interview.[formName]`.  

## Interview
Конфиг для настройки формы, её полей и их валиацию.

`bot/plugins/interview/forms` - обязательный путь до форм.

__Params:__

| Field | Type | Description |
| ------ | :------: | ------ |
| intro | String | Название формы. Название формы должно быть уникально и используется в portal-части для коннекта с формой |
| intro.title |  String | Текст, который видит пользователь при появлении формы |
| intro.controls | Object | Поля формы, которые будут заполняться пользователем |
| controls.[name/city/age] | String | Названия полей формы внутри конфига |
| controls.name.title | String | Название поля формы, которое видит пользователь в `intro.title` |
| controls.name.placeholder | String | Текст, выводимый перед заполнением поля формы |
| controls.name.format | Func | Валидация входных данных |
| intro.fields | Array of String |  Массив с активными полями формы |

__Example:__

```js
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
  },
},
```

## Portal
*см. Bost Plugin Portal - checkInterview & replyInterview.*