import { DATA_RECEIVED, FILES_LIST_RECEIVED } from './actions';
import { AnyAction } from 'redux';

export function rootReducer(state = {}, action: AnyAction) {
  if (action.type === FILES_LIST_RECEIVED) {
    const { error, data } = action.payload;
    if (error !== null) {
      // show error
    } else {
      return {
        ...state,
        files: data,
      };
    }
  }
  return state;
}
