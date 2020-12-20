import React, { useState, useEffect } from 'react';

import {
  translateRequestMsgType,
  translateResponseMsgType,
  resDataType,
} from '@/background';

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
  const [result, setResult] = useState<resDataType | null>(null);

  useEffect(() => {
    setLoading(true);
    const req: translateRequestMsgType = { type: 'translate', word };
    word &&
      chrome.runtime.sendMessage(req, (res: translateResponseMsgType) => {
        setLoading(false);
        if (res.result && res.result.errorCode === '0') {
          // console.log(res);
          setResult(res.result as resDataType);
        }
      });
  }, [word]);

  return (
    <div className="translate_pop">
      {loading || !result ? (
        <>loading...</>
      ) : (
        <>
          <h3>
            {result.query} <span></span>
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
