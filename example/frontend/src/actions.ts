import { Dispatch, Action } from 'redux';
import { uploadMediaFiles } from './api';
import axios from 'axios';

export const SYNCHRONIZING_WITH_STORAGE = 'SYNCHRONIZING_WITH_STORAGE';
export const FILES_LIST_RECEIVED = 'FILES_LIST_RECEIVED';
export const UPLOADING_FILES = 'UPLOADING_FILES';
export const DATA_RECEIVED = 'DATA_RECEIVED';

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
    type: FILES_LIST_RECEIVED,
  });
};

export const uploadFiles = (files: FileList, location?: string) => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOADING_FILES,
  });

  const payload = await uploadMediaFiles(files, location);
  console.log(payload);

  const event = {
    payload,
    type: DATA_RECEIVED,
  };

  dispatch(event);
};
