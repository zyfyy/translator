const css = `
.translate_pop {
	position: absolute;
	background: rgba(120, 10, 120, 0.8);
  box-shadow: 1px 1px 3px rgba(120, 10, 120, 0.6);
  border-radius: 6px;
	color: #fff;
	padding: 12px 12px 12px 12px;
  z-index: 1000000;
  font-family: monospace, sans-serif;
  font-size: 16px;
}

.translate_pop::selection {
  color: #fff;
  background: transparent;
}

.translate_pop h3 {
  margin: 5px 0;
  padding: 0;
  border-bottom: 1px dotted #fff;
  font-size: 20px;
  font-weight: bold;
}

.translate_pop .translate_basic {
  margin: 6px 0;
}

.translate_pop .translate_basic_parts ol {
  font-size: 16px;
  margin: 0;
  display: block;
  list-style-type: decimal;
  margin-block-start: 0em;
  margin-block-end: 1em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  padding-inline-start: 40px;
}

.translate_pop .translate_basic_parts ol li {
  display: list-item;
  text-align: -webkit-match-parent;
}

.translate_pop .translate_web {
  border-top: 1px dotted #fff;
  margin-top: 16px;
}

.translate_pop .translate_web_parts h5 {
  font-size: 16px;
  margin: 5px 0 0 0;
}

.translate_pop .translate_web_parts p {
  margin: 0;
}
`;


let send;
let last_string;
let wordPos_x;
let wordPos_y;

window.addEventListener('click', tryTranslate);

let anchor = document.querySelectorAll('a');

for (let i = 0; i < anchor.length; i++) {
  addEvent(anchor[i]);
}

function addEvent(dom) {
  dom.addEventListener('mouseleave', function (e) {
    tryTranslate(e);
  });
}

function tryTranslate(e) {
  const string = window.getSelection().toString().trim();
  // 防止翻译代码，简单抽取几种特殊字符
  const limitStr = /[，。{}()<>\[\]:=|+-\/?]/;
  if (string.match(limitStr)) {
    return;
  }

  if (string) {
    wordPos_x = e.clientX + window.scrollX;
    wordPos_y = e.clientY + window.scrollY;

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
    }
  } else {
    last_string = '';
    let shadowHost = document.querySelector(`#${shadowHostId}`) || null;
    if (shadowHost) {
      const shadowRoot = shadowHost.shadowRoot;
      const content = shadowRoot.querySelector('.translate_pop');
      content && shadowRoot.removeChild(content);
    }
  }
}

function sendMsg(param) {
  chrome.extension.sendMessage({ greeting: 'hello', param: param });
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
    buildShadowDom(result);
    // buildYouDaoPop(result);
  } catch (e) {
    console.log(e);
  }
}

const shadowHostId = 'ka_translate_root';


function buildShadowDom(result) {
  let shadowHost = document.querySelector(`#${shadowHostId}`) || null;
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = shadowHostId;
    document.body.appendChild(shadowHost);
    
    const style = document.createElement('style');
    style.innerHTML = css;

    const shadowRoot = shadowHost.attachShadow({mode: 'open'});
    const resDom = buildYouDaoPop(result);
    shadowRoot.resetStyleInheritance = false;
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(resDom);
  } else {
    const shadowRoot = shadowHost.shadowRoot;
    const content = shadowRoot.querySelector('.translate_pop');
    content && shadowRoot.removeChild(content);

    shadowRoot.appendChild(buildYouDaoPop(result));
  }
}


function buildYouDaoPop(result) {
  let win_height = window.innerHeight;
  let win_width = window.innerWidth;
  let x_direct = 0;
  let y_direct = 0;

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
  return pop;
}

