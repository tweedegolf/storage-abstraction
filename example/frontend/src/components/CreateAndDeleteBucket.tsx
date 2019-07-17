import React, { SyntheticEvent, useState } from 'react';
import { InputGroup, Input, Button } from 'reactstrap';

const CreateAndDeleteBucket = (props: {
  onCreateBucket: (name: string) => void,
  onDeleteBucket: (name: string) => void,
  selectedBucket: null | string,
}) => {
  const [submitButtonDisabled, disableSubmitButton] = useState(true);
  const [bucketName, setBucketName] = useState('');

  const onChange = (e: SyntheticEvent) => {
    const v = (e.target as HTMLInputElement).value;
    if (v === '') {
      disableSubmitButton(true);
    } else {
      setBucketName(v);
      disableSubmitButton(false);
    }
  };

  return <InputGroup className="topmenuitem">
    <Button
      name="createbucket"
      type="button"
      disabled={submitButtonDisabled}
      onClick={(e) => {
        props.onCreateBucket(bucketName);
        setBucketName('');
      }}
    >create new bucket</Button>
    <Input
      type="text"
      placeholder="enter bucket name"
      value={bucketName}
      onChange={onChange}
    ></Input>
    <Button
      name="deletebucket"
      type="button"
      disabled={props.selectedBucket === null}
      onClick={(e) => {
        props.onDeleteBucket(props.selectedBucket);
      }}
    >delete bucket</Button>
  </InputGroup>;
};

export { CreateAndDeleteBucket };
