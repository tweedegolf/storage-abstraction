import { Dispatch, Action } from 'redux';
import { uploadMediaFiles, deleteMediaFile } from './api';
import axios from 'axios';
import { MediaFile } from '../../backend/src/entities/MediaFile';

export const SYNCHRONIZING_WITH_STORAGE = 'SYNCHRONIZING_WITH_STORAGE';
export const GET_BUCKET_CONTENTS = 'GET_BUCKET_CONTENTS';
export const LIST_RECEIVED = 'LIST_RECEIVED';
export const GET_STORAGE_TYPES = 'GET_STORAGE_TYPES';
export const TYPES_RECEIVED = 'TYPES_RECEIVED';
export const SELECT_STORAGE_TYPE = 'SELECT_STORAGE_TYPE';
export const BUCKET_NAMES_RECEIVED = 'BUCKET_NAMES_RECEIVED';
export const UPLOADING_FILES = 'UPLOADING_FILES';
export const FILES_UPLOADED = 'FILES_UPLOADED';
export const DELETING_FILE = 'DELETING_FILE';
export const FILE_DELETED = 'FILE_DELETED';

export const synchronizeWithStorage = async (dispatch: Dispatch) => {
  dispatch({
    type: SYNCHRONIZING_WITH_STORAGE,
  });

  const payload = await axios.get('/api/v1/media/list')
    .then((response) => {
      return response.data;
    }).catch((error: string) => {
      return { error };
    });

  dispatch({
    payload,
    type: LIST_RECEIVED,
  });
};

export const getBucketContents = (bucketName: string) => async (dispatch: Dispatch) => {
  dispatch({
    payload: {
      bucketName,
    },
    type: GET_BUCKET_CONTENTS,
  });

  const payload = await axios.get(`/api/v1/media/list/${bucketName}`)
    .then((response) => {
      return response.data;
    }).catch((error: string) => {
      return { error };
    });

  dispatch({
    payload,
    type: LIST_RECEIVED,
  });
};

export const getStorageTypes = async (dispatch: Dispatch) => {
  dispatch({
    type: GET_STORAGE_TYPES,
  });

  const payload = await axios.get('/api/v1/storage/types')
    .then((response) => {
      return response.data;
    }).catch((error: string) => {
      return { error };
    });

  dispatch({
    payload,
    type: TYPES_RECEIVED,
  });
};

export const selectStorageType = (storageType: string) => async (dispatch: Dispatch) => {
  dispatch({
    payload: {
      storageType,
    },
    type: SELECT_STORAGE_TYPE,
  });

  // get the available buckets for this storage
  const payload = await axios.get(`/api/v1/storage/buckets/${storageType[0]}`)
    .then((response) => {
      return response.data;
    }).catch((error: string) => {
      return { error };
    });

  dispatch({
    payload,
    type: BUCKET_NAMES_RECEIVED,
  });
};

export const uploadFiles = (files: FileList, location?: string) => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOADING_FILES,
  });

  const payload = await uploadMediaFiles(files, location);
  const event = {
    payload,
    type: FILES_UPLOADED,
  };

  dispatch(event);
};

export const deleteFile = (mf: MediaFile) => async (dispatch: Dispatch) => {
  dispatch({
    type: DELETING_FILE,
  });

  const payload = await deleteMediaFile(mf.id);
  const event = {
    payload,
    type: FILE_DELETED,
  };

  dispatch(event);
};
