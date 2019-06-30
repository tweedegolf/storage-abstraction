import { compose, applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { rootReducer } from './reducer';
import { MediaFile } from '../../backend/src/entities/MediaFile';

const initialState = {
};

const getStore = () => {
  return createStore(
    rootReducer,
    initialState,
    compose(
      applyMiddleware(
        thunkMiddleware,
        createLogger({ collapsed: true }),
      ),
    ),
  );
};

export default getStore;