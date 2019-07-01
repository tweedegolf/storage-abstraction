import React from 'react';
import { Form } from './Form';
import { Message } from './Message';
import { ListUI as List } from './List';
import { uploadFiles, deleteFile } from '../actions';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const App = (props) => {
  return (
    <div>
      <Message message={props.message}></Message>
      <Form uploadFiles={props.uploadFiles} enabled={props.message === null}></Form>
      <List deleteFile={props.deleteFile} files={props.files}></List>
    </div >
  );
};

const mapStateToProps = (state) => {
  return {
    files: state.files,
    message: state.message,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return bindActionCreators({
    uploadFiles,
    deleteFile,
    // tslint:disable-next-line: align
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
