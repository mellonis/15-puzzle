import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { hideAbout } from "../../services/reducers";

import './About.scss';

const About = () => {
  const dispatch = useDispatch();
  const onHideClick = useCallback(() => {
    dispatch(hideAbout());
  }, [dispatch]);

  return (
    <div className="about" onClick={onHideClick}>
      <div className="container">
        Yet another 15 puzzle
      </div>
    </div>
  );
};

export default About;
