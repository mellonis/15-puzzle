import React, {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {hideAbout} from '../../services/reducers';
import {useCallbackOnEscapeKeyDown} from '../../hooks/useCallbackOnEscapeKeyDown';
import './About.scss';

const About = () => {
  const dispatch = useDispatch();
  const onHideClick = useCallback(() => {
    dispatch(hideAbout());
  }, [dispatch]);

  useCallbackOnEscapeKeyDown(onHideClick);

  return (
    <div className="about" onClick={onHideClick}>
      <div className="container">
        Yet another 15 puzzle
      </div>
    </div>
  );
};

export default About;
