import { Dispatch, Action } from 'redux';
import axios from 'axios';

export const LOADING = 'LOADING';
export const DATA_RECEIVED = 'DATA_RECEIVED';

export const submitForm = (data: string[]) => async (dispatch: Dispatch) => {
  dispatch({
    type: LOADING,
  });
  let params = '';
  data.forEach((d: string) => {
    if (d) {
      params += `/${d.toUpperCase()}`;
    }
  });

  const payload = await axios.get(`/api/v1/label-and-address${params}`)
    .then(response => {
      return response.data;
    }).catch((error: string) => {
      return { error };
    });

  const event = {
    type: DATA_RECEIVED,
    payload,
  }

  dispatch(event);
};
