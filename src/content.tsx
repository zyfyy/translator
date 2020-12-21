import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

import Content from './content/index';


import css from '!!raw-loader!./content/card.css';

export interface translateMessageType {
  type: 'translate';
  word: string;
}

// shadowhost style
const style = document.createElement('style');
style.innerHTML = css.toString();
const mouseGap = 20;

// react mount id
const MOUNT_POINT_ID = 'translator-verbose';
var mountedPoint = document.createElement('div');
mountedPoint.id = MOUNT_POINT_ID;

// shadow host
const SHADOW_HOST_ID = 'ka_translate_root';
const shadowHost = document.createElement('div');
shadowHost.id = SHADOW_HOST_ID;
shadowHost.style.position = 'absolute';
shadowHost.style.zIndex = `${Number.MAX_SAFE_INTEGER}`;
document.body.appendChild(shadowHost);

// shadow root
const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
shadowRoot.appendChild(style);
shadowRoot.appendChild(mountedPoint);


export const useSelectWord = () => {
  const mouseGap = 8;
  const [word, setWord] = useState('');

  useEffect(() => {
    const updateClickState = (e: MouseEvent) => {
      const selection = window.getSelection();
      const selected = selection ? selection.toString().trim() : '';

      // 防止翻译代码，简单抽取几种特殊字符
      const limitStr = /[，。{}()<>\[\]:=|+-\/?]/;
      if (selected.match(limitStr)) {
        setWord('');
        return;
      }
      setWord(selected);
  
      Promise.resolve((() => {
        const wordPos_x = e.clientX + window.scrollX + mouseGap;
        const wordPos_y = e.clientY + window.scrollY + mouseGap;
        shadowHost.style.top = wordPos_y + 'px';
        shadowHost.style.left = wordPos_x + 'px';
      })());
    };

    window.addEventListener('click', updateClickState);
    return () => {
      window.removeEventListener('click', updateClickState);
    };
  }, []);

  return word;
};

ReactDOM.render(<Content />, mountedPoint);
