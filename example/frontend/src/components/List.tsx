import React from 'react';
import { Table } from 'reactstrap';
import { MediaFile } from '../../../backend/src/entities/MediaFile';

export const ListUI = (props: { files: MediaFile[] }) => {
  if (typeof props.files === 'undefined' || props.files.length === 0) {
    return null;
  }

  const body = [];
  props.files.forEach((file, i) => {
    body.push(<tr key={`file-${i}`}>
      <td key={file.name}>name:</td><td>{file.name}</td>
      <td key={file.size}>size:</td><td>{file.size}</td>
      <td key={file.path}>path:</td><td>{file.path}</td>
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
