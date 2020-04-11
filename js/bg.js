// 百度翻译 API
// http://api.fanyi.baidu.com/doc/21
// const baiduApiUrl = "https://fanyi-api.baidu.com/api/trans/vip/translate";
// const baiduAppId = "20181101000228392";
// const baiduKey = "1R5FL6RE9TDLJazPTere";

// let baiduBuildUrl = request => {
//   let salt = Math.floor(Math.random() * 10000);
//   let hashable = baiduAppId + request.param.q + salt + baiduKey;
//   let sign = md5(hashable);
//   let params = [
//     `appid=${baiduAppId}`,
//     `salt=${salt}`,
//     `from=${request.param.from}`,
//     `to=${request.param.to}`,
//     `q=${request.param.q}`,
//     `sign=${sign}`,
//   ].join("&");
//   var url = `${baiduApiUrl}?${params}`;
//   console.log(hashable, url, sign);
//   return url;
// }

// console.log(md5);


function buildYouDaoUrl(request) {
  // 有道接口
  var appKey = '41eb757863a2c342';
  var key = 'hAq4XkNzH54xcUkS4onvd4ofOLqgSWEE';
  var salt = (new Date).getTime();
  var curTime = Math.round(new Date().getTime() / 1000);
  var query = request.param.q;
  // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
  var from = request.param.from;
  var to = request.param.to;
  var str1 = appKey + truncate(query) + salt + curTime + key;

  var sign = sha256(str1);
  var data = {
    q: query,
    appKey: appKey,
    salt: salt,
    from: from,
    to: to,
    sign: sign,
    signType: "v3",
    curtime: curTime,
  };
  let params = Object.keys(data).map(key => `${key}=${data[key]}`);
  return 'http://openapi.youdao.com/api?' + params.join('&');
}


function truncate(q) {
  var len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
}

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.greeting == "hello") {
    // const url = baiduBuildUrl(request);
    const url = buildYouDaoUrl(request);

    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onload = function () {
      try {
        // console.log(JSON.parse(req.response));
        sendMsg(JSON.parse(req.response));
      } catch (e) {
        console.log(e, req.response);
        request.greeting == "farewell"
      }
    };
    req.send();

    sendResponse({ farewell: "bye" });
  } else if (request.greeting == "farewell") {
  }
});

function sendMsg(msg) {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(
      tab.id,
      { greeting: "hello", result: msg },
      function (response) { }
    );
  });
}
