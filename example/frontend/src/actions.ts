import { Dispatch, Action } from 'redux';
import { uploadMediaFiles, deleteMediaFile } from './api';
import axios from 'axios';
import { MediaFile } from '../../backend/src/entities/MediaFile';

export const SYNCHRONIZING_WITH_STORAGE = 'SYNCHRONIZING_WITH_STORAGE';
export const LIST_RECEIVED = 'LIST_RECEIVED';
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
