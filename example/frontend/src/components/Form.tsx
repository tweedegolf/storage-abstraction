import React from 'react';
import { InputGroup, Input } from 'reactstrap';

const Form = (props: {
  enabled: boolean,
  uploadFiles: (files: FileList) => void,
}) => (
    <div id="form">
      <InputGroup>
        <Input
          name="file"
          type="file"
          multiple={true}
          disabled={!props.enabled}
          onChange={async (e) => {
            if (e.target && e.target.files) {
              props.uploadFiles(e.target.files);
              e.target.value = null;
            }
          }}
        ></Input>
      </InputGroup>
    </div >
  );

export { Form };
