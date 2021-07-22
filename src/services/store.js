import { configureStore } from '@reduxjs/toolkit';
import mainReducer from './reducers';

const store = configureStore({
  devTools: process.env.NODE_ENV === 'development',
  reducer: {
    main: mainReducer,
  },
});

export default store;
