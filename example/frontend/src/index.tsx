import 'bootstrap/dist/css/bootstrap.min.css';
import './style/index.scss';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import getStore from './store';
import App from './components/App';
import { synchronizeWithStorage } from './actions';

const store = getStore();

render(
  <Provider store={store}>
    <App></App>
  </Provider>,
  document.getElementById('container'),
);
synchronizeWithStorage(store.dispatch);
