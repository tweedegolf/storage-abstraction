import {
  GET_BUCKET_CONTENTS,
  SYNCHRONIZING_WITH_STORAGE,
  LIST_RECEIVED,
  UPLOADING_FILES,
  FILES_UPLOADED,
  DELETING_FILE,
  FILE_DELETED,
  GET_STORAGE_TYPES,
  TYPES_RECEIVED,
  BUCKET_NAMES_RECEIVED,
  SELECT_STORAGE_TYPE,
} from './actions';
import { AnyAction } from 'redux';
import { RootState } from './types';

export function rootReducer(state: RootState, action: AnyAction) {
  if (action.type === GET_BUCKET_CONTENTS || action.type === SYNCHRONIZING_WITH_STORAGE) {
    return {
      ...state,
      message: 'retrieving file list from server',
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

  if (action.type === GET_STORAGE_TYPES) {
    return {
      ...state,
      message: 'getting supported storage types from server',
    };
  }

  if (action.type === TYPES_RECEIVED) {
    const { error, data: { types } } = action.payload;
    if (error) {
      // show error
    } else {
      return {
        ...state,
        types,
        message: null,
      };
    }
  }

  if (action.type === SELECT_STORAGE_TYPE) {
    return {
      ...state,
      selectedStorageType: action.payload.storageType,
      message: `getting bucket names for type ${action.payload.storageType[1]}`,
    };
  }

  if (action.type === BUCKET_NAMES_RECEIVED) {
    const { error, data: { buckets } } = action.payload;
    if (error) {
      // show error
    } else {
      return {
        ...state,
        buckets,
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
