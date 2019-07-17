import {
  GET_BUCKET_CONTENTS,
  GET_STORAGE_INIT_DATA,
  LIST_RECEIVED,
  UPLOADING_FILES,
  FILES_UPLOADED,
  DELETING_FILE,
  FILE_DELETED,
  GET_STORAGE_TYPES,
  TYPES_RECEIVED,
  BUCKET_NAMES_RECEIVED,
  SELECT_STORAGE,
  ERROR,
  RESET_ERROR,
  INIT_DATA_RECEIVED,
  BUCKET_CREATED,
  CREATING_BUCKET,
  BUCKET_DELETED,
  DELETING_BUCKET,
} from './actions';
import { AnyAction } from 'redux';
import { RootState } from './types';
import { StorageInitData } from '../../common/types';

export function rootReducer(state: RootState, action: AnyAction): RootState {
  if (action.type === ERROR) {
    return {
      ...state,
      message: action.payload.error,
    };
  }

  if (action.type === GET_STORAGE_INIT_DATA) {
    return {
      ...state,
      message: 'retrieving storage init data from server',
    };
  }

  if (action.type === INIT_DATA_RECEIVED) {
    const { files, types, buckets, selectedStorageId, selectedBucket } = action.payload as StorageInitData;
    return {
      ...state,
      files,
      types,
      buckets,
      selectedBucket,
      selectedStorageId,
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

  if (action.type === SELECT_STORAGE) {
    return {
      ...state,
      message: `getting bucket names for type ${action.payload.storageId}`,
    };
  }

  if (action.type === BUCKET_NAMES_RECEIVED) {
    const { buckets, storageId } = action.payload;
    return {
      ...state,
      buckets,
      files: [],
      selectedBucket: null,
      selectedStorageId: storageId,
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

  if (action.type === LIST_RECEIVED) {
    const { files } = action.payload;
    return {
      ...state,
      files,
      message: null,
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

  if (action.type === CREATING_BUCKET) {
    const { bucketName } = action.payload;
    return {
      ...state,
      message: `creating bucket ${bucketName}`,
    };
  }

  if (action.type === BUCKET_CREATED) {
    const { buckets } = action.payload;
    return {
      ...state,
      buckets,
      message: null,
    };
  }

  if (action.type === DELETING_BUCKET) {
    const { bucketName } = action.payload;
    return {
      ...state,
      message: `deleting bucket ${bucketName}`,
    };
  }

  if (action.type === BUCKET_DELETED) {
    const { buckets } = action.payload;
    return {
      ...state,
      buckets,
      selectedBucket: null,
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
