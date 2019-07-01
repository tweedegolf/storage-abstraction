import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const Message = (props: {
  message: string,
}) => {
  const [isOpen, openModal] = useState();

  const handleOpen = () => {
    openModal(!isOpen);
  };

  return (
    <Modal isOpen={props.message !== null} toggle={handleOpen}>
      <ModalHeader toggle={handleOpen}>Message</ModalHeader>
      <ModalBody>
        {props.message}
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleOpen}>close</Button>
      </ModalFooter>
    </Modal>
  );
};

export { Message };
