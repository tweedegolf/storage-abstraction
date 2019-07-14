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
  ERROR,
  RESET_ERROR,
} from './actions';
import { AnyAction } from 'redux';
import { RootState } from './types';

export function rootReducer(state: RootState, action: AnyAction) {
  if (action.type === ERROR) {
    return {
      ...state,
      message: action.payload.error,
    };
  }

  if (action.type === SYNCHRONIZING_WITH_STORAGE) {
    return {
      ...state,
      message: 'retrieving file list from server',
    };
  }

  if (action.type === LIST_RECEIVED) {
    const { files, selectedBucket } = action.payload;
    return {
      ...state,
      selectedBucket,
      files,
      message: null,
    };
  }

  if (action.type === GET_STORAGE_TYPES) {
    return {
      ...state,
      message: 'getting supported storage types from server',
    };
  }

  if (action.type === TYPES_RECEIVED) {
    const { types } = action.payload;
    return {
      ...state,
      types,
      message: null,
    };
  }

  if (action.type === SELECT_STORAGE_TYPE) {
    return {
      ...state,
      files: [],
      message: `getting bucket names for type ${action.payload.storageType}`,
    };
  }

  if (action.type === BUCKET_NAMES_RECEIVED) {
    const { buckets, storageType } = action.payload;
    return {
      ...state,
      buckets,
      selectedStorageType: storageType,
      message: null,
    };
  }

  if (action.type === GET_BUCKET_CONTENTS) {
    return {
      ...state,
      selectedBucket: action.payload.bucketName,
      message: `getting contents of bucket ${action.payload.bucketName}`,
    };
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

  if (action.type === RESET_ERROR) {
    return {
      ...state,
      message: null,
    };
  }

  return state;
}
