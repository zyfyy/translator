import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import Table, {ColumnsType} from 'antd/es/table';

import {storageDBType, storageDataType} from './background';

const Print = () => {
  const [words, setWords] = useState<storageDataType[] | null>(null);
  useEffect(() => {
    chrome.runtime.sendMessage({type: 'queryAll'}, resopnse => {
      const res = resopnse.result;
      const arr = [];
      for (const key in res) {
        const item: storageDataType = res[key];
        arr.push(item);
      }
      arr.sort((a: storageDataType, b: storageDataType) => {
        return b.ut - a.ut;
      });
      setWords(arr);
    });
  }, []);
  const columns: ColumnsType<storageDataType> = [
    {
      title: 'word',
      dataIndex: 'query'
    },
    {
      title: '发音',
      render: (str, row) => {
        if (!row.basic) {
          return <></>;
        }
        return (
          <>
            {row.basic.phonetic
              ? `【标】/${row.basic.phonetic}/`
              : row.basic['us-phonetic']
              ? `【美】/${row.basic['us-phonetic']}/`
              : row.basic['uk-phonetic']
              ? `【英】${row.basic['uk-phonetic']}`
              : ''}
          </>
        );
      }
    },
    {
      title: 'web含义',
      render: (str, row) => {
        if (row.web) {
          return (
            <div className="web-trans">
              {row.web.map((symbol, idx) => {
                return (
                  <div key={idx} className={idx % 2 === 0 ? 'even' : 'odd'}>
                    <h5 style={{margin: '5px 0 0 0'}}>{symbol.key}</h5>
                    <span>{symbol.value.join(',')}</span>
                  </div>
                );
              })}
            </div>
          );
        }
      }
    }
  ];
  return (
    <>
      <Table
        rowKey="query"
        showHeader={true}
        columns={columns}
        dataSource={words || []}
        size="small"
        pagination={false}
      ></Table>
    </>
  );
};

const mountedPoint = document.querySelector('#content');
ReactDOM.render(<Print />, mountedPoint);

window.addEventListener('load', () => {});
