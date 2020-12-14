/**
 * @file bg.js 后台页面相关功能逻辑
 */

import { sha256 } from 'js-sha256';

interface YouDaoQueryInfo {
  q: string;
  appKey: string;
  salt: number;
  sign: string;
  curtime: number;
  from: string;
  to: string;
  signType: 'v3';
}

// 请求有道翻译返回数据
export interface resDataType {
  errorCode: string;
  isWord: boolean;
  l: string;
  query: string;
  translation: string[];
  times: number;
  basic: {
    phonetic?: string;
    'us-phonetic'?: string;
    'uk-phonetic'?: string;
    explains?: string[];
    exam_type?: string[];
  };
  web?: {
    key: string;
    value: string[];
  }[];
}

// 请求bg js接口
export interface translateRequestMsgType {
  type: 'translate';
  word: string;
}

// bg返回Msg type
export interface translateResponseMsgType {
  type: 'translate';
  result: resDataType;
}

// 有道接口
const YouDaoAppKey = '41eb757863a2c342';
const YouDaoKey = 'hAq4XkNzH54xcUkS4onvd4ofOLqgSWEE';

const buildYouDaoUrl = (request: translateRequestMsgType) => {
  const salt = new Date().getTime();
  const curTime = Math.round(new Date().getTime() / 1000);
  const word = request.word;

  const str = YouDaoAppKey + truncate(word) + salt + curTime + YouDaoKey;
  const sign = sha256(str);

  const query: YouDaoQueryInfo = {
    q: word,
    appKey: YouDaoAppKey,
    salt: salt,
    sign: sign,
    curtime: curTime,
    from: 'en',
    to: 'zh',
    signType: 'v3',
  };

  if (word.match(/[^\x00-\x80]/g)) {
    query.from = 'zh';
    query.to = 'en';
  }

  const params = (Object.keys(query) as Array<keyof typeof query>).map(
    (key) => `${key}=${query[key]}`
  );
  return 'http://openapi.youdao.com/api?' + params.join('&');
};

const truncate = (q: string) => {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
};

chrome.runtime.onMessage.addListener((request, sender, sendMessage) => {
  if (request.type == 'translate') {
    const url = buildYouDaoUrl(request);
    fetch(url, {
      method: 'GET',
    })
      .then((req) => {
        req.json().then((data: resDataType) => {
          sendMessage({ type: 'translate', result: data });
        });
      })
      .catch((e) => {
        console.warn('failed to request translation', e);
        sendMessage({ type: 'error', msg: 'failed to query youdao' });
      });
    return true;
  } else {
    sendMessage('pong');
  }
});
