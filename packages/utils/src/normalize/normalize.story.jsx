import React from 'react';
import normalize from './normalize';

const arrayOfNames = [
  'ᴇʟɪ ᴠᴀsɪʟᴇɴᴋᴏ',
  'ᴇʟɪᴢᴀᴠᴇᴛᴀ ᴘᴏᴢʜɪᴅᴀᴇᴠᴀ',
  'Єℓιƨα Ѵαℓαƨтяσ 🗝️',
  '𝑬𝒍𝒊𝒛𝒂𝒗𝒆𝒕𝒂 𝑨𝒓𝒕𝒂𝒎𝒐𝒏𝒐𝒗𝒂🙊',
  '𝕰𝖑𝖎𝖟𝖆𝖛𝖊𝖙𝖆 𝕿𝖊𝖕𝖐𝖞𝖆𝖈𝖐𝖔𝖛𝖆',
  'Ｅｌｉｚａｖｅｔａ　Ｐａｎｋｏｖａ',
  '•ℰlise•',
  '𝓔𝓵𝓲𝔃𝓪𝓫𝓮𝓽𝓱 ✨',
  '♌️Elina Flöer💜',
  '👑 𝐸𝑙𝑖𝑧𝑎𝑣𝑒𝑡𝑎 👑',
  '𝕰𝖑𝖎𝖓𝖆',
  'Eliška Čápová',
  '𝐄𝐋𝐈𝐙𝐀𝐁𝐄𝐓𝐇',
  '𝙵𝙴𝚁𝙽𝙰𝙽𝙳𝙾 𝚃𝙾𝚁𝚁𝙴𝚂',
  'ɴᴀᴄʜᴅᴀʟʏ ᴏɴ ᴛʜᴇ ʙᴇᴀᴛ',
  'ayca çelik',
  '𝓘𝔃𝓪𝓫𝓮𝓵𝓵𝓪🍭',
  '🎀 𝓟𝓪𝓾𝓵𝓲𝓷𝓪 𝓩𝓪𝔀𝓪𝓭𝔃𝓴𝓪🎀',
  '🇷 🇴 🇲 🇦🎃  ꪜ',
  'ℑ𝔫𝔢𝔰 𝔊𝔦𝔞𝔫𝔫𝔬𝔱𝔱𝔞🧸',
  '🐥🐤🐣𝕄𝕒𝕥𝕖𝕠 ℙ𝕒𝕤𝕔𝕦𝕒𝕝 𝔾𝕒𝕣𝕔í𝕒🐣🐤🐥',
  'Ａｎｄｒｅａ Ｓａｎｎａ | 𝔸𝕟𝕕ℝ𝕙𝕠𝕕𝕖𝕤',
  '𝓑𝓸𝓱𝓭𝓪𝓷𝓪 𝓢𝔂𝓻𝓸𝓽𝓲𝓾𝓴',
  '⚡️Verónica Coloma⚡️',
  'No Bra Naija 🇳🇬🇬🇭🇿🇦🇹🇿🇪🇹🇪🇬🇬🇦🇸🇴',
  '𝙎𝙤𝙛𝙞𝙮𝙠𝙖 𝙈𝙮𝙠𝙮𝙩𝙮𝙪𝙠',
  '♪♪ ꧁ℍ𝕒𝕤𝕥𝕖𝕜꧂ ♪♪',
  'İSHAK “ AĞIRMAN',
  'Sergio 🅲🅷🅴🅺🆈',
  '♂️ Milton Fernández 🇦🇷',
];

module.exports = function ({ storiesOf, action, knob }) {
  return storiesOf('normalize', module).add('names', () => (
    <div>
      {arrayOfNames.map((name) => (
        <p>
          {name} > {normalize(name)}
        </p>
      ))}
    </div>
  ));
};
