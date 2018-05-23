import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Shortcut } from '../keyshortcuts';

class QuickActionsContextShortcuts extends Component {
  handlers = {
    QUICK_ACTION_POS: event => {
      event.preventDefault();

      this.props.onClick();
    },
    QUICK_ACTION_TOGGLE: event => {
      event.preventDefault();

      this.props.onToggle();
    },
  };

  render() {
    return [
      <Shortcut
        key="QUICK_ACTION_POS"
        name="QUICK_ACTION_POS"
        handler={this.handlers.QUICK_ACTION_POS}
      />,
      <Shortcut
        key="QUICK_ACTION_TOGGLE"
        name="QUICK_ACTION_TOGGLE"
        handler={this.handlers.QUICK_ACTION_TOGGLE}
      />,
    ];
  }
}

QuickActionsContextShortcuts.propTypes = {
  onClick: PropTypes.func,
  onToggle: PropTypes.func,
};

const noOp = () => {};

QuickActionsContextShortcuts.defaultProps = {
  onClick: noOp,
  onToggle: noOp,
};

export default QuickActionsContextShortcuts;
