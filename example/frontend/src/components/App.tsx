import React from 'react';
import { Form } from './Form';
import { Message } from './Message';
import { ListUI as List } from './List';
import { SelectStorage } from './SelectStorage';
import { SelectBucket } from './SelectBucket';
import { uploadFiles, deleteFile, selectStorageType, getBucketContents } from '../actions';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const App = (props) => {
  return (
    <div>
      <Message message={props.message}></Message>
      <Form uploadFiles={props.uploadFiles} enabled={props.message === null}></Form>
      <List deleteFile={props.deleteFile} files={props.files}></List>
      <SelectStorage
        types={props.types}
        selectedStorageType={props.selectedStorageType}
        onSelectStorageType={props.selectStorageType}
      ></SelectStorage>
      <SelectBucket
        buckets={props.buckets}
        selectedBucket={props.selectedBucket}
        onSelectBucket={props.getBucketContents}
      ></SelectBucket>
    </div >
  );
};

const mapStateToProps = (state) => {
  return {
    files: state.files,
    types: state.types,
    buckets: state.buckets,
    selectedStorageType: state.selectedStorageType,
    selectedBucket: state.selectedBucket,
    message: state.message,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return bindActionCreators({
    uploadFiles,
    deleteFile,
    selectStorageType,
    getBucketContents,
    // tslint:disable-next-line: align
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
