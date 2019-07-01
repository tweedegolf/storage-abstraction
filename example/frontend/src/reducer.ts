import {
  SYNCHRONIZING_WITH_STORAGE,
  LIST_RECEIVED,
  UPLOADING_FILES,
  FILES_UPLOADED,
  DELETING_FILE,
  FILE_DELETED,
} from './actions';
import { AnyAction } from 'redux';
import { RootState } from './types';

export function rootReducer(state: RootState, action: AnyAction) {
  if (action.type === SYNCHRONIZING_WITH_STORAGE) {
    return {
      ...state,
      message: 'retreiving file list from server',
    };
  }

  if (action.type === LIST_RECEIVED) {
    const { error, data } = action.payload;
    if (error !== null) {
      // show error
    } else {
      return {
        ...state,
        files: data,
        message: null,
      };
    }
  }

  if (action.type === UPLOADING_FILES) {
    return {
      ...state,
      message: 'uploading files',
    };
  }

  if (action.type === FILES_UPLOADED) {
    const { payload: { files } } = action;
    const newList = [...state.files, ...files];
    return {
      ...state,
      files: newList,
      message: null,
    };
  }

  if (action.type === DELETING_FILE) {
    return {
      ...state,
      message: 'deleting file',
    };
  }

  if (action.type === FILE_DELETED) {
    const { payload: { id } } = action;
    const files = state.files.filter(f => f.id !== id);
    return {
      ...state,
      files,
      message: null,
    };
  }

  return state;
}
