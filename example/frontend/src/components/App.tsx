import React from 'react';
import { Form } from './Form';
import { ListUI as List } from './List';
import { submitForm } from '../actions';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const App = (props) => {
  return (
    <div>
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
    submitForm,
    // tslint:disable-next-line: align
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
