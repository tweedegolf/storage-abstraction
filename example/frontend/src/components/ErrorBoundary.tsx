import React, { Fragment, ErrorInfo } from 'react';

interface State {
  error: any | null;
}

class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { error: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return <Fragment>
        <h1>Something went wrong.</h1>
        <div>{this.state.error.message}</div>
      </Fragment>;
    }
    return this.props.children;
  }
}

export { ErrorBoundary };
