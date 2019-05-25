import { compose, applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import reducer from './reducer';
import { Address } from '../../backend/src/entities/Address';
import { Label } from '../../backend/src/entities/Label';

const address = new Address();
address.area = 39;
address.city = 'Amsterdam';
address.houseNumber = 57;
address.postalCode = '1021NM';
address.street = 'Buitendraaierij';
address.year = 1984;
address.timesRequested = 0;

const label = new Label();
label.grade = 'c (6)';
label.index = 1.42;
label.provisional = false;
label.validThru = new Date(2019, 11, 3);
label.timesRequested = 0;

const initialState = {
  address,
  label,
};

const getStore = () => {
  return createStore(
    reducer,
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