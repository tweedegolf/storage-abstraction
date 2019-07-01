import React, { useState } from 'react';
import { InputGroup, Input, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const Form = (props) => {
  const [enabled, setEnabled] = useState(true);
  const [isOpen, openModal] = useState(false);
  const [modalError, setError] = useState('');

  const handleOpen = () => {
    openModal(!isOpen);
  };

  return (
    <div id="form">
      <InputGroup>
        <Input
          name="file"
          type="file"
          multiple={true}
          disabled={!enabled}
          onChange={async (e) => {
            if (e.target && e.target.files) {
              props.uploadFiles(e.target.files);
              // const mediaFile = await props.uploadMediaFiles({ file: e.target.files[0], location });
            }
          }}
        ></Input>
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
