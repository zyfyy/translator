import React, { useState, useEffect, useRef } from 'react';

import {
  translateRequestMsgType,
  translateResponseMsgType,
  storageDataType,
} from '@/background';

import Sound from './sound.svg';

type ResultPopProps = {
  word: string;
};

type phoneticDataType = {
  phonetic?: string;
  'us-phonetic'?: string;
  'uk-phonetic'?: string;
};
type BasicExplainProps = {
  exp: string;
};

const BasicExplain = ({ exp }: BasicExplainProps) => {
  const aj = exp.split('.');
  if (aj[1]) {
    return (
      <>
        <div className="translate_basic_parts">
          {aj[0]}
          <ol>
            {aj[1].split('；').map((mean, idx) => {
              return <li key={idx}>{mean}</li>;
            })}
          </ol>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="translate_basic_parts">
          <li>{exp}</li>
        </div>
      </>
    );
  }
};

const buildPhText: (data: phoneticDataType) => string = (data) => {
  const phs = {
    phonetic: '标',
    'us-phonetic': '美',
    'uk-phonetic': '英',
  };
  const phText: string[] = [];
  data &&
    (Object.keys(phs) as Array<keyof typeof phs>).forEach((key) => {
      if (!data[key]) {
        return;
      }
      phText.push(`${phs[key]}: /${data[key]}/`);
    });
  return phText.join(' ❥➻ ');
};

const ResultPop = ({ word }: ResultPopProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<storageDataType | null>(null);

  useEffect(() => {
    setLoading(true);
    const req: translateRequestMsgType = { type: 'translate', word };
    word &&
      chrome.runtime.sendMessage(req, (res: translateResponseMsgType) => {
        setLoading(false);
        if (res.result && res.result.errorCode === '0') {
          // console.log(res);
          setResult(res.result as storageDataType);
        }
      });
  }, [word]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const playSound = (e: React.MouseEvent<SVGElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    word && audioRef.current?.play();
  };

  return (
    <div className="translate_pop">
      {loading || !result ? (
        <>loading...</>
      ) : (
        <>
          {word && (
            <audio
              ref={audioRef}
              preload="auto"
              src={`https://dict.youdao.com/dictvoice?audio=${word}&type=2`}></audio>
          )}
          <h3>
            {result.query}
            <Sound
              style={{
                margin: '0 6px -4px 4px',
                padding: '2px 5px',
                cursor: 'pointer',
              }}
              fill="#fff"
              width="13"
              onClick={playSound}
              onMouseOver={playSound}
            />
            <span>{result.count}次</span>
          </h3>

          <div className="translate_ph">{buildPhText(result.basic)}</div>
          {result.isWord && result.basic.explains && (
            <div className="translate_basic">
              {result.basic.explains.map((exp, idx) => {
                return <BasicExplain key={idx} exp={exp} />;
              })}
            </div>
          )}

          {!result.isWord && (
            <div className="translate_basic">
              {result.translation.map((exp, idx) => {
                return <BasicExplain key={idx} exp={exp} />;
              })}
            </div>
          )}

          {result.web && (
            <div className="translate_web">
              {result.web.map((symbol, idx) => {
                return (
                  <div key={idx} className="translate_web_parts">
                    <h5>{symbol.key}</h5>
                    <p>{symbol.value.join(',')}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResultPop;
