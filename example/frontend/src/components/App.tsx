import React from 'react';
import { Form } from './Form';
import { Message } from './Message';
import { ErrorBoundary } from './ErrorBoundary';
import { ListUI as List } from './List';
import { SelectStorage } from './SelectStorage';
import { SelectBucket } from './SelectBucket';
import { uploadFiles, deleteFile, selectStorage, getBucketContents, resetError, createBucket, deleteBucket } from '../actions';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { CreateAndDeleteBucket } from './CreateAndDeleteBucket';

const App = (props) => {
  const uploadEnabled = props.message === null && props.selecteStorageId !== null && props.selectedBucket !== null;
  return (
    <ErrorBoundary>
      <Message message={props.message} resetError={props.resetError}></Message>
      <div id="dropdowns">
        <SelectStorage
          types={props.types}
          selectedStorageId={props.selectedStorageId}
          onSelectStorageType={props.selectStorageType}
        ></SelectStorage>
        <SelectBucket
          enabled={props.selectedStorageType !== null}
          buckets={props.buckets}
          selectedBucket={props.selectedBucket}
          onSelectBucket={props.getBucketContents}
        ></SelectBucket>
        <CreateAndDeleteBucket
          selectedBucket={props.selectedBucket}
          onCreateBucket={props.createBucket}
          onDeleteBucket={props.deleteBucket}
        />
      </div>
      <List deleteFile={props.deleteFile} files={props.files}></List>
      <Form uploadFiles={props.uploadFiles} enabled={uploadEnabled}></Form>
    </ErrorBoundary>
  );
};

const mapStateToProps = (state) => {
  return {
    files: state.files,
    types: state.types,
    buckets: state.buckets,
    selectedStorageId: state.selectedStorageId,
    selectedBucket: state.selectedBucket,
    message: state.message,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return bindActionCreators({
    uploadFiles,
    deleteFile,
    resetError,
    getBucketContents,
    selectStorageType: selectStorage,
    createBucket,
    deleteBucket,
    // tslint:disable-next-line: align
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
