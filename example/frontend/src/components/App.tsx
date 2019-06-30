import React from 'react';
import { Form } from './Form';
import { ListUI as List } from './List';
import { uploadFiles } from '../actions';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const App = (props) => {
  return (
    <div>
      <Form uploadFiles={props.uploadFiles}></Form>
      <List files={props.files}></List>
    </div >
  );
};

const mapStateToProps = (state) => {
  return {
    files: state.files,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return bindActionCreators({
    uploadFiles,
    // tslint:disable-next-line: align
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
