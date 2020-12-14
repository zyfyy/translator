import React, { useState, useEffect } from 'react';
import { useSelectWord } from '@/content';
import ResultPop from './ResultPop';




const Content = () => {
  const [showEntry, setShowEntry] = useState(false);
  const [clicked, setClicked] = useState(false);

  const word = useSelectWord();

  const toggleShow = () => {
    if (word.length) {
      setShowEntry(true);
    } else {
      setClicked(false);
      setShowEntry(false);
    }
  };

  useEffect(toggleShow, [word]);

  const translate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClicked(true);
  };

  if (!showEntry) {
    return <></>;
  }

  return (
    <>
      {clicked ? (
        <ResultPop word={word} />
      ) : (
        <div className="entry" onClick={translate}>
          译
        </div>
      )}
    </>
  );
};

export default Content;
