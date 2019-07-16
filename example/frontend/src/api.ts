import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  MediaFile,
} from '../../backend/src/entities/MediaFile';
import { ServerError } from './types';

const baseUrl = '/api/v1';
const baseConfig = () => ({
  baseURL: baseUrl,
  timeout: 10000,
});

// axios.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     return Promise.reject(error.response.data.message);
//   });

const parseResult = async<T>(axiosPromise: Promise<AxiosResponse>): Promise<T | ServerError> => {
  try {
    const response = await axiosPromise;
    return response.data as T;
  } catch (e) {
    return { error: e.message };
  }
};

const get = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T | ServerError> => {
  return parseResult<T>(axios.get(url, { ...baseConfig(), ...config }));
};

const put = async <T, U>(
  url: string,
  data: T,
  config?: AxiosRequestConfig,
): Promise<U | ServerError> => {
  return parseResult<U>(axios.put(url, data, { ...baseConfig(), ...config }));
};

const post = async <T, U>(
  url: string,
  data: T,
  config?: AxiosRequestConfig,
): Promise<U | ServerError> => {
  return parseResult<U>(axios.post(url, data, { ...baseConfig(), ...config }));
};

const doDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T | ServerError> => {
  return parseResult<T>(axios.delete(url, { ...baseConfig(), ...config }));
};

export const uploadMediaFiles = (files: FileList, location?: string): Promise<MediaFile | ServerError> => {
  const data = new FormData();
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    data.append('files', file);
  }
  if (typeof location !== 'undefined') {
    data.append('location', location);
  }
  return post('/media', data, {
    headers: { 'content-type': 'multipart/form-data' },
    timeout: 10000,
  });
};

export const getMediaThumbnailUrl = (mf: MediaFile) => `${baseUrl}/media/thumbnail/png/100/${mf.id}/${mf.path}`;

export const getMediaDownloadUrl = (mf: MediaFile) => `${baseUrl}/media/download/${mf.id}/${mf.path}`;

export const deleteMediaFile = (id: number): Promise<MediaFile[] | ServerError> => doDelete(`/media/${id}`);

export const getTypes = (): Promise<string[] | ServerError> => get('storage/types');

export const getList = (bucketName?: string): Promise<[string, number] | ServerError> =>
  bucketName ? get(`media/list/${bucketName}`) : get('media/list');

export const getBuckets = (storageType: string): Promise<string[] | ServerError> => get(`/storage/buckets/${storageType}`);
