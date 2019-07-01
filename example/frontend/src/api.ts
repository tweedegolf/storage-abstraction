import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  MediaFile,
} from '../../backend/src/entities/MediaFile';
import {
  ResResult,
  ResSuccess,
} from '../../common/types';

const baseUrl = '/api/v1';
const baseConfig = () => ({
  baseUrl,
  timeout: 10000,
});

const parseResult = <T>(url: string, axiosResponse: AxiosResponse) => {
  const response: ResResult<T> = axiosResponse.data;

  if (response.error === undefined) {
    throw new Error(`Response for '${url}' does not correspond to standard`);
  }

  if (response.error) {
    throw new Error(response.message);
  }

  return (response as ResSuccess<T>).data;
};

const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => (
  parseResult<T>(url, await axios.get(url, { ...baseConfig(), ...config }))
);

const put = async <T, U>(url: string, data: T, config?: AxiosRequestConfig): Promise<U> => (
  parseResult<U>(url, await axios.put(url, data, { ...baseConfig(), ...config }))
);

const post = async <T, U>(url: string, data: T, config?: AxiosRequestConfig): Promise<U> => (
  parseResult<U>(url, await axios.post(url, data, { ...baseConfig(), ...config }))
);

const doDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => parseResult<T>(url, await axios.delete(url, { ...baseConfig(), ...config }));

export const uploadMediaFiles = (files: FileList, location?: string): Promise<MediaFile> => {
  const data = new FormData();
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    data.append('files', file);
  }
  // console.log(location, typeof location === 'undefined');
  data.append('location', location);
  return post(`${baseUrl}/media`, data, {
    headers: { 'content-type': 'multipart/form-data' },
    timeout: 10000,
  });
};

export const getMediaThumbnailUrl = (mf: MediaFile) => `${baseUrl}/media/thumbnail/png/100/${mf.id}/${mf.path}`;
export const getMediaDownloadUrl = (mf: MediaFile) => `${baseUrl}/media/download/${mf.id}/${mf.path}`;
