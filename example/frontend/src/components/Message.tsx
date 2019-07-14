import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const Message = (props: {
  message: string,
  resetError: () => void,
}) => {
  return <Modal isOpen={props.message !== null} toggle={props.resetError}>
    <ModalHeader toggle={props.resetError}>Message</ModalHeader>
    <ModalBody>
      {props.message}
    </ModalBody>
    <ModalFooter>
      <Button color="primary" onClick={props.resetError}>close</Button>
    </ModalFooter>
  </Modal>;
};

export { Message };
