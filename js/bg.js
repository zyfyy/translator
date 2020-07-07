/**
 * @file bg.js 后台页面相关功能逻辑
 */

import sha256 from './sha256.min.min.js';

const sendData = data => {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(
      tab.id,
      { type: 'translate', result: msg }
    );
  });
};

const buildYouDaoUrl = request => {
  // 有道接口
  const appKey = '41eb757863a2c342';
  const key = 'hAq4XkNzH54xcUkS4onvd4ofOLqgSWEE';
  const salt = new Date().getTime();
  const curTime = Math.round(new Date().getTime() / 1000);
  const word = request.word;

  const str = appKey + truncate(word) + salt + curTime + key;
  const sign = sha256(str);

  const data = {
    q: word,
    appKey: appKey,
    salt: salt,
    sign: sign,
    curtime: curTime,
    from: 'en',
    to: 'zh',
    signType: 'v3'
  };

  if (word.match(/[^\x00-\x80]/g)) {
    data.from = 'zh';
    data.to = 'en';
  }

  const params = Object.keys(data).map(key => `${key}=${data[key]}`);
  return 'http://openapi.youdao.com/api?' + params.join('&');
};

const truncate = q => {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
};

chrome.extension.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.type == 'translate') {
    try {
      const url = buildYouDaoUrl(request);
      const req = await fetch(url, {
        method: 'GET'
      });
      const data = await req.json();
      sendData(data);
    } catch (e) {
      console.warn('failed to request translation', e);
    }
  }
});

// notifications
var opt = {
  type: 'basic',
  title: 'Primary Title',
  message: 'Primary message to display',
  iconUrl: 'icon48.png'
};

var opt = {
  type: 'list',
  title: 'Primary Title',
  message: 'Primary message to display',
  iconUrl: 'icon48.png',
  items: [
    { title: 'Item1', message: 'This is item 1.' },
    { title: 'Item2', message: 'This is item 2.' },
    { title: 'Item3', message: 'This is item 3.' }
  ]
};

// chrome.notifications.create(opt, notificationId => {console.log(notificationId)});

// system
chrome.system.cpu.getInfo(data => {
  console.log(data);
});
chrome.system.memory.getInfo(data => {
  console.log(data);
});
chrome.system.storage.getInfo(data => {
  console.log(data);
});

// alarms
