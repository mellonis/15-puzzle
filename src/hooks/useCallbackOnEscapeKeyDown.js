import {useEffect, useRef} from "react";

export const useCallbackOnEscapeKeyDown = (callback) => {
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  useEffect(() => {
    if (!callbackRef.current) {
      return;
    }

    const onKeyDown = ({key}) => {
      if (key === 'Escape') {
        callbackRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
};