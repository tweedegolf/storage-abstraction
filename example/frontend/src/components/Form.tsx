import React, { useState } from 'react';
import { InputGroup, Input, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const Form = (props) => {
  // const [enabled, enabled] = useState(false);
  const [isOpen, openModal] = useState(false);
  const [modalError, setError] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [houseNumberAddition, setHouseNumberAddition] = useState('');

  const handleOpen = () => {
    openModal(!isOpen);
  };

  const submit = () => {
    if (postalCode === '' || houseNumber === '') {
      return;
    }
    props.submit([postalCode.replace(' ', ''), houseNumber, houseNumberAddition]);
  };

  return (
    <div id="form">
      <InputGroup>
        <Input
          name="file"
          type="file"
          disabled={!props.enabled}
        // onChange={async (e) => {
        //   if (e.target && e.target.files) {
        //     const mediaFile = await postMediaFile({ file: e.target.files[0], location });
        //     onChange(mediaFile.id);
        //   }
        >
        </Input>
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
    </div >
  );
};

export { Form };

