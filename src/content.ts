import {
  translateRequestMsgType,
  translateResponseMsgType,
  resDataType,
} from './background';

import css from '!!raw-loader!./content/card.css';
import lodash from 'lodash';


export interface translateMessageType {
  type: 'translate';
  word: string;
}

let send: NodeJS.Timeout;
let last_word: string;
let wordPos_x: number;
let wordPos_y: number;
const shadowHostId = 'ka_translate_root';

const buildYouDaoPop = (result: resDataType) => {
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
      'uk-phonetic': '英',
    };
    const phText: string[] = [];
    (Object.keys(phs) as Array<keyof typeof phs>).forEach((key) => {
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
      result.basic.explains.map((exp) => {
        let part = document.createElement('div');
        part.className = 'translate_basic_parts';

        let aj = exp.split('.');
        if (aj[1]) {
          // 英文
          let means = aj[1].split('；').map((mean) => {
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
    result.web.map((symbol) => {
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

const buildShadowDom = (result: resDataType) => {
  let shadowHost = document.querySelector(`#${shadowHostId}`) || null;
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = shadowHostId;
    document.body.appendChild(shadowHost);

    const style = document.createElement('style');
    style.innerHTML = css.toString();

    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const resDom = buildYouDaoPop(result);
    // shadowRoot.resetStyleInheritance = false;
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(resDom);
  } else {
    const shadowRoot = shadowHost.shadowRoot;
    if (shadowRoot) {
      const content = shadowRoot.querySelector('.translate_pop');
      content && shadowRoot.removeChild(content);
      shadowRoot.appendChild(buildYouDaoPop(result));
    }
  }
};

function handler(result: resDataType) {
  if (!result) {
    alert('translate result got error!');
  }
  try {
    buildShadowDom(result);
  } catch (e) {
    console.warn(e);
  }
}


const tryTranslate = (e: MouseEvent) => {
  const selection = window.getSelection();
  const word = selection ? selection.toString().trim() : '';

  // 防止翻译代码，简单抽取几种特殊字符
  const limitStr = /[，。{}()<>\[\]:=|+-\/?]/;
  if (word && word.match(limitStr)) {
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
      const content = shadowRoot?.querySelector('.translate_pop');
      content && shadowRoot?.removeChild(content);
    }
  }
};


function sendMsg(word: string) {
  const req: translateRequestMsgType = { type: 'translate', word };
  chrome.runtime.sendMessage(req, (res: translateResponseMsgType) => {
    handler(res.result);
  });
}

chrome.runtime.onMessage.addListener(function (request) {
  if (request.type == 'translate') {
    request.result.times = 1;
    handler(request.result);
  }
});

// click anchor to trytranslate
window.addEventListener('click', tryTranslate);
// function addAnchorEvent(dom: HTMLAnchorElement) {
//     dom.addEventListener('mouseleave', function (e: MouseEvent) {
//         tryTranslate(e);
//     });
// }

// let anchor = document.querySelectorAll('a');
// for (let i = 0; i < anchor.length; i++) {
//     addAnchorEvent(anchor[i]);
// }

// const wmsg: translateRequestMsgType = {type: 'translate', word: 'blur'};
// chrome.runtime.sendMessage(wmsg, (res) => {
//     console.log(res);
// });
