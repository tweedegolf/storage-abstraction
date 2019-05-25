import React, { useState } from "react";
import { InputGroup, Input, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const Form = (props) => {
  const [isOpen, openModal] = useState(false);
  const [modalError, setError] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [houseNumberAddition, setHouseNumberAddition] = useState('');

  const handleOpen = () => {
    openModal(!isOpen);
  }
  const submit = () => {
    if (postalCode === '' || houseNumber === '') {
      return;
    }
    props.submit([postalCode.replace(' ', ''), houseNumber, houseNumberAddition]);
  }

  return (
    <div id="form">
      <InputGroup>
        <Input onChange={(e) => setPostalCode(e.target.value)} id="postal-code" placeholder="postcode" />
        <Input onChange={(e) => setHouseNumber(e.target.value)} id="number" placeholder="huisnummer" />
        <Input onChange={(e) => setHouseNumberAddition(e.target.value)} id="addition" placeholder="toevoeging" />
      </InputGroup>
      <InputGroup>
        <Button onClick={submit}>Submit</Button>
      </InputGroup>
      <Modal isOpen={isOpen} toggle={handleOpen}>
        <ModalHeader toggle={handleOpen}>Er ging iets verkeerd</ModalHeader>
        <ModalBody>
          {modalError}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleOpen}>sluiten</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Form

