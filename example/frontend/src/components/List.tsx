import React, { JSXElementConstructor } from 'react';
import { Table, Button, Spinner, Media } from 'reactstrap';
import { MediaFile } from '../../../backend/src/entities/MediaFile';
import { getMediaDownloadUrl, getMediaThumbnailUrl } from '../api';

const sortDateUpdated = (mfA: MediaFile, mfB: MediaFile): number => {
  const dateA = new Date(mfA.when.updated);
  const dateB = new Date(mfB.when.updated);
  if (dateA < dateB) {
    return 1;
  }
  if (dateA > dateB) {
    return -1;
  }
  return 0;
}

// const createImg = (mf: MediaFile): JSX.Element => <img
//   src={getMediaThumbnailUrl(mf)}
//   onClick={() => { window.open(getMediaDownloadUrl(mf)); }}
// // TODO: open modal here
// ></img>;

const createImg = (mf: MediaFile): JSX.Element => <Media
  object src={getMediaThumbnailUrl(mf)}
  onClick={() => { window.open(getMediaDownloadUrl(mf)); }}
/>;

export const ListUI = (props: {
  files: MediaFile[],
  deleteFile: (mf: MediaFile) => void,
}) => {
  if (typeof props.files === 'undefined' || props.files.length === 0) {
    return null;
  }
  props.files.sort(sortDateUpdated);

  const body = [<tr key="header">
    <th>name</th>
    <th>size</th>
    <th>path</th>
    <th>thumb</th>
  </tr>];
  props.files.forEach((file, i) => {
    body.push(<tr key={`${file.name}-file-${i}`}>
      <td key={`${file.name}-name-${i}`}>{file.name}</td>
      <td key={`${file.name}-size-${i}`}>{file.size}</td>
      {/* <td key={`path-${i}`}>{file.path}</td> */}
      <td key={`${file.name}-img-${i}`}>{createImg(file)}</td>
      <td key={`${file.name}-delete-${i}`}><Button outline color="danger" onClick={() => { props.deleteFile(file); }}>delete</Button></td>
    </tr>);
  });

  return (
    <div>
      <h2>Files</h2>
      <Table>
        <tbody>
          {body}
        </tbody>
      </Table>
    </div>
  );
};
