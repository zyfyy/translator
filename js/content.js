let send;
let last_string;
let wordPos_x;
let wordPos_y;

window.addEventListener('click', listen);

let anchor = document.querySelectorAll('a');

for (let i = 0; i < anchor.length; i++) {
  addEvent(anchor[i]);
}

function addEvent(dom) {
  dom.addEventListener('mouseleave', function (e) {
    listen(e);
  });
}

function listen(e) {
  let string = window.getSelection().toString().split(' ')[0];
  if (string) {
    clearTimeout(send);
    let param = {
      from: 'en',
      to: 'zh',
      q: string.trim().toLowerCase(),
    };
    if (string.match(/[^\x00-\x80]/g)) {
      param.from = 'zh';
      param.to = 'en';
    }
    if (last_string !== param.q) {
      send = setTimeout(function () {
        sendMsg(param);
      }, 100);
      last_string = param.q;
      wordPos_x = e.clientX + window.scrollX;
      wordPos_y = e.clientY + window.scrollY;
      // wordPos_x = e.clientX
      // wordPos_y = e.clientY
    }
  } else {
    last_string = '';
    if (document.getElementsByClassName('translate_pop').length) {
      document.getElementsByClassName('translate_pop')[0].remove();
    }
  }
}

function sendMsg(param) {
  chrome.extension.sendMessage({ greeting: 'hello', param: param }, function (
    response
  ) { });
}

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.greeting == 'hello') {
    handler(request.result);
    sendResponse({ farewell: 'bye' });
  } else if (request.greeting == 'farewell') {
  }
});

function handler(result) {
  if (!result) {
    alert('translate result got error!');
  }
  try {
    buildYouDaoPop(result);
  } catch (e) {
    console.log(e);
  }
}


function buildYouDaoPop(result) {
  let win_height = window.innerHeight;
  let win_width = window.innerWidth;
  let x_direct = 0;
  let y_direct = 0;

  // remove pop if exsit
  if (document.getElementsByClassName('translate_pop').length) {
    document.getElementsByClassName('translate_pop')[0].remove();
  }
  let pop = document.createElement('div');

  // build title
  let title = document.createElement('h3');
  title.innerText = result.translation.join(', ');
  pop.appendChild(title);
  pop.className = 'translate_pop';
  pop.style.top = wordPos_y + 'px';
  pop.style.left = wordPos_x + 'px';



  // 翻译主体
  let symbol_dom = document.createElement('div');
  symbol_dom.className = 'translate';


  if (result.basic) {
    // 音标
    let symbol_ph = document.createElement('div');
    symbol_ph.className = 'translate_ph';
    const phs = {
      phonetic: '标',
      'us-phonetic': '美',
      'uk-phonetic': '英'
    };
    const phText = [];
    Object.keys(phs).map(key => {
      if (!result.basic[key]) {
        return;
      }
      phText.push(`${phs[key]}: /${result.basic[key]}/`);
    })
    symbol_ph.innerHTML = phText.join(' ❥➻ ');
    symbol_dom.appendChild(symbol_ph);

    // 解释
    if (result.basic.explains) {
      let tsBasic = document.createElement('div');
      tsBasic.className = 'translate_basic';
      result.basic.explains.map(exp => {
        let part = document.createElement('div');
        part.className = 'translate_basic_parts';

        let aj = exp.split('.');
        if (aj[1]) { // 英文
          let means = aj[1].split('；').map(mean => {
            return `<li>${mean}</li>`
          })
          part.innerHTML = `${aj[0]}<ol>${means.join('')}</ol>`;
        } else {  // 中文
          let means = `<li>${exp}</li>`;
          part.innerHTML = `${means}`;
        }

        tsBasic.appendChild(part);
      })
      symbol_dom.appendChild(tsBasic);
    }
  }

  // web解释
  let tsWeb = document.createElement('div');
  if (result.web) {
    tsWeb.className = 'translate_web';
    result.web.map(symbol => {
      let part = document.createElement('div');
      part.className = 'translate_web_parts';
      part.innerHTML = `<h5>${symbol.key}:</h5>
          <p>${symbol.value.join(', ')}</p>`;
      tsWeb.appendChild(part);
    });
  }

  symbol_dom.appendChild(tsWeb);
  pop.appendChild(symbol_dom);
  document.getElementsByTagName('body')[0].appendChild(pop);
}