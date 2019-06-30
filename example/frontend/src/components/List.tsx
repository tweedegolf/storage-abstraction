import React, { JSXElementConstructor } from 'react';
import { Table } from 'reactstrap';
import { MediaFile } from '../../../backend/src/entities/MediaFile';

const getSrcUrl = (mf: MediaFile) => `/api/v1/media/thumbnail/png/100/${mf.id}/${mf.path}`;
const getDownloadUrl = (mf: MediaFile) => `/api/v1/media/download/${mf.id}/${mf.path}`;
const createImg = (mf: MediaFile): JSX.Element => <img
  src={getSrcUrl(mf)}
  onClick={() => { window.open(getDownloadUrl(mf)); }}
// TODO: open modal here
></img>;

export const ListUI = (props: { files: MediaFile[] }) => {
  if (typeof props.files === 'undefined' || props.files.length === 0) {
    return null;
  }

  const body = [<tr key="header">
    <th>name</th>
    <th>size</th>
    <th>path</th>
    <th>thumb</th>
  </tr>];
  props.files.forEach((file, i) => {
    body.push(<tr key={`file-${i}`}>
      <td key={`name-${i}`}>{file.name}</td>
      <td key={`size-${i}`}>{file.size}</td>
      <td key={`path-${i}`}>{file.path}</td>
      <td key={`img-${i}`}>{createImg(file)}</td>
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
