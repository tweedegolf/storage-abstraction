import { Dispatch, Action } from 'redux';
import * as API from './api';
import { MediaFile } from '../../backend/src/entities/MediaFile';
import { ServerError } from './types';

export const ERROR = 'ERROR';
export const RESET_ERROR = 'RESET_ERROR';
export const GET_STORAGE_INIT_DATA = 'GET_STORAGE_INIT_DATA';
export const INIT_DATA_RECEIVED = 'INIT_DATA_RECEIVED';
export const GET_BUCKET_CONTENTS = 'GET_BUCKET_CONTENTS';
export const LIST_RECEIVED = 'LIST_RECEIVED';
export const GET_STORAGE_TYPES = 'GET_STORAGE_TYPES';
export const TYPES_RECEIVED = 'TYPES_RECEIVED';
export const SELECT_STORAGE = 'SELECT_STORAGE';
export const BUCKET_NAMES_RECEIVED = 'BUCKET_NAMES_RECEIVED';
export const UPLOADING_FILES = 'UPLOADING_FILES';
export const FILES_UPLOADED = 'FILES_UPLOADED';
export const DELETING_FILE = 'DELETING_FILE';
export const FILE_DELETED = 'FILE_DELETED';
export const CREATING_BUCKET = 'CREATING_BUCKET';
export const BUCKET_CREATED = 'BUCKET_CREATED';
export const DELETING_BUCKET = 'DELETING_BUCKET';
export const BUCKET_DELETED = 'BUCKET_DELETED';

const filterError = <T>(payload: T | ServerError, dispatch: Dispatch, callback: (arg0: T) => void) => {
  if ((payload as ServerError).error) {
    dispatch({
      payload,
      type: ERROR,
    });
  } else {
    callback(payload as T);
  }
};

export const getStorageInitData = async (dispatch: Dispatch) => {
  dispatch({
    type: GET_STORAGE_INIT_DATA,
  });

  filterError(await API.getInitData(), dispatch, (payload) => {
    dispatch({
      payload,
      type: INIT_DATA_RECEIVED,
    });
  });
};

export const getBucketContents = (bucketName: string) => async (dispatch: Dispatch) => {
  dispatch({
    payload: {
      bucketName,
    },
    type: GET_BUCKET_CONTENTS,
  });

  filterError(await API.getList(bucketName), dispatch, (files) => {
    dispatch({
      type: LIST_RECEIVED,
      payload: { files },
    });
  });
};

export const getStorageTypes = async (dispatch: Dispatch) => {
  dispatch({
    type: GET_STORAGE_TYPES,
  });

  filterError(await API.getTypes(), dispatch, (types) => {
    dispatch({
      type: TYPES_RECEIVED,
      payload: { types },
    });
  });
};

export const selectStorage = (storageId: string) => async (dispatch: Dispatch) => {
  dispatch({
    payload: {
      storageId,
    },
    type: SELECT_STORAGE,
  });

  // get the available buckets for this storage
  filterError(await API.getBuckets(storageId), dispatch, (buckets) => {
    dispatch({
      type: BUCKET_NAMES_RECEIVED,
      payload: { storageId, buckets },
    });
  });
};

export const uploadFiles = (files: FileList, location?: string) => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOADING_FILES,
  });

  filterError(await API.uploadMediaFiles(files, location), dispatch, (files) => {
    dispatch({
      payload: { files },
      type: FILES_UPLOADED,
    });
  });
};

export const deleteFile = (mf: MediaFile) => async (dispatch: Dispatch) => {
  dispatch({
    type: DELETING_FILE,
  });

  filterError(await API.deleteMediaFile(mf.id), dispatch, (payload: { [id: string]: number }) => {
    dispatch({
      payload,
      type: FILE_DELETED,
    });
  });
};

export const createBucket = (bucketName: string) => async (dispatch: Dispatch) => {
  dispatch({
    payload: {
      bucketName,
    },
    type: CREATING_BUCKET,
  });

  filterError(await API.createBucket(bucketName), dispatch, (buckets) => {
    dispatch({
      payload: {
        buckets,
      },
      type: BUCKET_CREATED,
    });
  });
};

export const deleteBucket = (bucketName: string) => async (dispatch: Dispatch) => {
  dispatch({
    payload: {
      bucketName,
    },
    type: DELETING_BUCKET,
  });

  filterError(await API.deleteBucket(bucketName), dispatch, (payload) => {
    dispatch({
      payload,
      type: BUCKET_DELETED,
    });
  });
};

export const resetError = () => (dispatch: Dispatch) => {
  dispatch({
    type: RESET_ERROR,
  });
};
