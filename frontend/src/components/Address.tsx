import React from 'react';
import { Table } from 'reactstrap';
import { Address } from '../../../backend/src/entities/Address';

export const AddressUI = (props: { address: Address }) => {
  if (typeof props.address === 'undefined') {
    return null;
  }
  const body = []
  Object.entries(mapping).forEach(([key, value]) => {
    body.push(<tr key={key}><td>{value}:</td><td>{props.address[key]}</td></tr>);
  });

  return (
    <div>
      <h2>Adresgegevens</h2>
      <Table>
        <tbody>
          {body}
        </tbody>
      </Table>
    </div>
  );
};

const mapping = {
  street: 'straat',
  houseNumber: 'nummer',
  houseNumberAddition: 'toevoeging',
  postalCode: 'postcode',
  city: 'plaats',
  area: 'oppervlakte',
  year: 'bouwjaar',
  timesRequested: 'keren opgevraagd',
};
