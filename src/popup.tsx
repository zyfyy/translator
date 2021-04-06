import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import {Table, Progress, Upload, Button, notification} from 'antd';
import {ColumnsType} from 'antd/es/table';
import {PrinterFilled} from '@ant-design/icons';
import 'antd/dist/antd.css';

import {ChromeStorage} from './lib/storage';
import {storageDBType, storageDataType} from './background';

const mountedPoint = document.querySelector('#content');

const MAXQUOTA = 1024 * 1024 * 3;
const queryDB = new ChromeStorage<storageDBType>('query');

function customizer(objValue: storageDataType, srcValue: storageDataType) {
  if (_.isUndefined(objValue)) {
    return srcValue;
  } else {
    srcValue.count += objValue.count;
    srcValue.ut = Math.max(srcValue.ut, objValue.ut);
    return srcValue;
  }
}

const Popup = () => {
  const [percentage, setPercentage] = useState(0);
  const [count, setCount] = useState(0);
  const [words, setWords] = useState<storageDataType[] | null>(null);
  const [updating, setUpdating] = useState(0);

  useEffect(() => {
    chrome.storage.local.getBytesInUse(bytes => {
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
      arr.sort((a: storageDataType, b: storageDataType) => {
        return b.ut - a.ut;
      });
      setWords(arr);
    };
    queryStore();
  }, [updating]);

  const handleDelete = async (word: string) => {
    const res = (await queryDB.get()) || {};
    delete res[word];
    await queryDB.set(res);
    setUpdating(updating + 1);
  };

  const print = () => {
    chrome.runtime.sendMessage({type: 'print'});
  };

  const importWords = async (file: File) => {
    const content = await file.text();
    try {
      const data = JSON.parse(content);
      console.log(data);
      if (data.validate && data.validate === 'translator') {
        delete data.validate;
        const pre = await queryDB.get();
        const merged = _.assignWith<storageDBType>(pre, data, customizer);
        console.log('merged', merged, data, pre);
        await queryDB.set(merged);
        setUpdating(updating + 1);
        notification.success({message: '导入成功'});
      } else {
        notification.error({message: '备份校验失败'});
      }
    } catch (e) {
      notification.error({message: '备份数据损坏'});
    }
    return file;
  };

  const exportWords = async () => {
    const bak = await queryDB.get();
    const bakWithValidate = Object.assign(bak, {validate: 'translator'});
    const file = new File(
      [JSON.stringify(bakWithValidate)],
      'translator-bak.json',
      {
        type: 'application/json'
      }
    );
    const url = URL.createObjectURL(file);
    chrome.downloads.download(
      {
        filename: 'translator-bak.json',
        url
      },
      () => {
        notification.success({message: '导出成功'});
        URL.revokeObjectURL(url);
      }
    );
  };

  const columns: ColumnsType<storageDataType> = [
    {
      title: 'word',
      dataIndex: 'query'
    },
    {
      title: 'translation',
      dataIndex: 'translation',
      render: (str: string[]) => {
        return <>{str.join(',')}</>;
      }
    },
    {
      title: 'count',
      dataIndex: 'count',
      align: 'center',
      width: 120,
      showSorterTooltip: false,
      sorter: (a: storageDataType, b: storageDataType) => a.count - b.count
    },
    {
      title: 'OP',
      align: 'center',
      key: 'action',
      render: (record: storageDataType) => (
        <a
          onClick={() => {
            handleDelete(record.query);
          }}
        >
          x
        </a>
      )
    }
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
              '100%': '#87d068'
            }}
            gapDegree={0}
            width={40}
          />
        </div>
        <div className="op">
          <Upload
            accept=".json"
            customRequest={() => null}
            beforeUpload={importWords}
            progress={{showInfo: false}}
            showUploadList={false}
          >
            <Button size="small" type="link">
              导入
            </Button>
          </Upload>
          <Button
            size="small"
            type="link"
            onClick={exportWords}
            style={{marginLeft: '1em'}}
          >
            导出
          </Button>
        </div>
        <div className="print">
          <PrinterFilled style={{cursor: 'pointer'}} onClick={print} />
        </div>
      </header>

      <div className="word-list">
        <Table
          rowKey="query"
          showHeader={true}
          columns={columns}
          dataSource={words || []}
          size="small"
          pagination={{hideOnSinglePage: true}}
        ></Table>
      </div>
    </>
  );
};

ReactDOM.render(<Popup />, mountedPoint);
