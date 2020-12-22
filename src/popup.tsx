import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { Table, Progress } from 'antd';
import { ColumnsType } from 'antd/es/table';
import 'antd/dist/antd.css';

import { ChromeStorage } from './lib/storage';
import { storageDBType, storageDataType } from './background';

const mountedPoint = document.querySelector('#content');

const MAXQUOTA = 1024 * 1024 * 3;
const queryDB = new ChromeStorage<storageDBType>('query');

const Popup = () => {
  const [percentage, setPercentage] = useState(0);
  const [count, setCount] = useState(0);
  const [words, setWords] = useState<storageDataType[] | null>(null);
  const [updating, setUpdating] = useState(0);

  useEffect(() => {
    chrome.storage.local.getBytesInUse((bytes) => {
      setPercentage(Math.floor((bytes / MAXQUOTA) * 100 * 10) / 10);
    });
  }, [updating]);

  useEffect(() => {
    const queryStore = async () => {
      const res = (await queryDB.get()) || {};
      setCount(Object.keys(res).length);
      const arr = [];
      for (const key in res) {
        const item: storageDataType = res[key];
        arr.push(item);
      }
      setWords(arr);
    };
    queryStore();
  }, [updating]);

  const handleDelete = async (word: string) => {
    const res = (await queryDB.get()) || {};
    delete res[word];
    queryDB.set(res);
    setUpdating(updating + 1);
  };

  const columns: ColumnsType<storageDataType> = [
    {
      title: '单词',
      dataIndex: 'query',
    },
    {
      title: '次数',
      dataIndex: 'count',
      align: 'center',
      width: 120,
      showSorterTooltip: false,
      sorter: (a: storageDataType, b: storageDataType) => a.count - b.count,
    },
    {
      title: 'Delete',
      align: 'center',
      key: 'action',
      render: (record: storageDataType) => (
        <a
          onClick={() => {
            handleDelete(record.query);
          }}>
          x
        </a>
      ),
    },
  ];

  return (
    <>
      <header>
        <div className="total">Total: {count}</div>
        <div className="usage">
          <Progress
            type="circle"
            percent={percentage}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            gapDegree={0}
            width={40}
          />
        </div>
      </header>

      <div className="word-list">
        <Table
          rowKey="query"
          showHeader={true}
          columns={columns}
          dataSource={words || []}
          size="small"
          pagination={{ hideOnSinglePage: true }}></Table>
      </div>
    </>
  );
};

ReactDOM.render(<Popup />, mountedPoint);
