import React from 'react';
import Form from './Form';
import { AddressUI as Address } from './Address';
import { LabelUI as Label } from './Label';
import { submitForm } from '../actions';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const App = (props) => {
  return (
    <div>
      <Form submit={props.submitForm}></Form>
      <Address address={props.address}></Address>
      <Label label={props.label}></Label>
    </div >
  )
};

const mapStateToProps = (state) => {
  return {
    label: state.label,
    address: state.address,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return bindActionCreators({
    submitForm,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

