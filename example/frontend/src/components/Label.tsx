import React from 'react';
import { Table } from 'reactstrap';
import { Label } from '../../../backend/src/entities/Label';

export const LabelUI = (props: { label: Label }) => {
  if (typeof props.label === 'undefined') {
    return null;
  }

  const body = []
  Object.entries(mapping).forEach(([key, value]) => {
    let v = props.label[key];
    if (key === 'provisional') {
      v = v === true ? 'nee' : 'ja';
    } else if (key === 'validThru') {
      const d: Date = new Date(v);
      v = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } else if (key === 'index') {
      v = v === null ? 'N/A' : v;
    }
    body.push(<tr key={key}><td>{value}:</td><td>{v}</td></tr>);
  });

  return (
    <div>
      <h2>Energie label</h2>
      <Table>
        <tbody>
          {body}
        </tbody>
      </Table>
    </div>
  );
};

const mapping = {
  grade: 'label',
  index: 'energie index',
  provisional: 'definitief',
  validThru: 'geldig tot',
  timesRequested: 'keren opgevraagd',
};
