const css = `
.translate_pop {
	position: absolute;
	background: rgba(120, 10, 120, 0.8);
  box-shadow: 1px 1px 3px rgba(120, 10, 120, 0.6);
  border-radius: 6px;
	color: #fff;
	padding: 12px 12px 12px 12px;
  z-index: 1000000;
  font-size: 12px;
}

.translate_pop::selection {
  color: #fff;
  background: transparent;
}

.translate_pop h3 {
  margin: 5px 0;
  padding: 0;
  border-bottom: 1px dotted #fff;
  font-size: 16px;
  font-weight: bold;
}

.translate_pop h3 span {
  font-size: 12px;
  color: #26ff00;
}

.translate_pop .translate_basic {
  margin: 6px 0;
}

.translate_pop .translate_basic_parts ol {
  font-size: 12px;
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
  margin-top: 12px;
}

.translate_pop .translate_web_parts h5 {
  font-size: 12px;
  margin: 5px 0 0 0;
}

.translate_pop .translate_web_parts p {
  margin: 0;
}
`;

let send;
let last_word;
let wordPos_x;
let wordPos_y;

const tryTranslate = e => {
  const word = window.getSelection().toString().trim();

  // 防止翻译代码，简单抽取几种特殊字符
  const limitStr = /[，。{}()<>\[\]:=|+-\/?]/;
  if (word.match(limitStr)) {
    return;
  }

  if (word) {
    wordPos_x = e.clientX + window.scrollX;
    wordPos_y = e.clientY + window.scrollY;
    clearTimeout(send);

    if (last_word !== word) {
      send = setTimeout(function () {
        sendMsg(word);
      }, 100);
    }
  } else {
    last_word = '';
    let shadowHost = document.querySelector(`#${shadowHostId}`) || null;
    if (shadowHost) {
      const shadowRoot = shadowHost.shadowRoot;
      const content = shadowRoot.querySelector('.translate_pop');
      content && shadowRoot.removeChild(content);
    }
  }
};

function handler(result) {
  if (!result) {
    alert('translate result got error!');
  }
  try {
    buildShadowDom(result);
  } catch (e) {
    console.warn(e);
  }
}

function sendMsg(word) {
  chrome.storage.local.get(word, function (result) {
    if (result && result[word]) {
      let data = JSON.parse(result[word]);
      data.times++;
      chrome.storage.local.set({
        [word]: JSON.stringify(data)
      });
      handler(data);
    }
  });
}

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.type == 'translate') {
    request.result.times = 1;
    chrome.storage.local.set({
      [request.result.query]: JSON.stringify(request.result)
    });
    handler(request.result);
  }
});

const shadowHostId = 'ka_translate_root';

const buildShadowDom = result => {
  let shadowHost = document.querySelector(`#${shadowHostId}`) || null;
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = shadowHostId;
    document.body.appendChild(shadowHost);

    const style = document.createElement('style');
    style.innerHTML = css;

    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
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
};

const buildYouDaoPop = result => {
  let pop = document.createElement('div');
  pop.className = 'translate_pop';
  pop.style.top = wordPos_y + 'px';
  pop.style.left = wordPos_x + 'px';

  // build title
  let title = document.createElement('h3');
  title.innerHTML =
    result.translation.join(', ') + `<span>${result.times} 次</span>`;
  pop.appendChild(title);
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
    });
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
        if (aj[1]) {
          // 英文
          let means = aj[1].split('；').map(mean => {
            return `<li>${mean}</li>`;
          });
          part.innerHTML = `${aj[0]}<ol>${means.join('')}</ol>`;
        } else {
          // 中文
          let means = `<li>${exp}</li>`;
          part.innerHTML = `${means}`;
        }

        tsBasic.appendChild(part);
      });
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
};

let showTranslate = result => {
  try {
    buildYouDaoPop(result);
  } catch (e) {
    console.warn(e);
  }
};

function addAnchorEvent(dom) {
  dom.addEventListener('mouseleave', function (e) {
    tryTranslate(e);
  });
}

// click anchor to trytranslate
window.addEventListener('click', tryTranslate);

let anchor = document.querySelectorAll('a');
for (let i = 0; i < anchor.length; i++) {
  addAnchorEvent(anchor[i]);
}

// response
chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.type == 'translate') {
    showTranslate(request.result);
  }
});
