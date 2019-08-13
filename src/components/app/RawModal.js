import counterpart from 'counterpart';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';

import { PATCH_RESET } from '../../constants/ActionTypes';
import { closeListIncludedView } from '../../actions/ListActions';
import { deleteView } from '../../api';
import { addNotification } from '../../actions/AppActions';
import {
  closeModal,
  closeRawModal,
  openRawModal,
} from '../../actions/WindowActions';
import keymap from '../../shortcuts/keymap';
import ModalContextShortcuts from '../keyshortcuts/ModalContextShortcuts';
import Tooltips from '../tooltips/Tooltips.js';
import Indicator from './Indicator';

const ModalButton = props => {
  const {
    name,
    onShowTooltip,
    onHideTooltip,
    children,
    onClick,
    tabIndex,
  } = props;

  const handleClick = () => onClick(name);
  const handleShowTooltip = () => onShowTooltip(name);
  const handleHideTooltip = () => onHideTooltip(name);

  return (
    <button
      key={`rawmodal-button-${name}`}
      name={name}
      className="btn btn-meta-outline-secondary btn-distance-3 btn-md"
      onClick={handleClick}
      tabIndex={tabIndex}
      onMouseEnter={handleShowTooltip}
      onMouseLeave={handleHideTooltip}
    >
      {children}
    </button>
  );
};

class RawModal extends Component {
  state = {
    scrolled: false,
    visibleTooltips: {},
  };

  componentDidMount() {
    // Dirty solution, but use only if you need to
    // there is no way to affect body
    // because body is out of react app range
    // and css dont affect parents
    // but we have to change scope of scrollbar
    document.body.style.overflow = 'hidden';

    this.initEventListeners();
  }

  componentWillUnmount() {
    const { masterDocumentList } = this.props;

    if (masterDocumentList) {
      masterDocumentList.updateQuickActions();
    }

    this.removeEventListeners();
  }

  UNSAFE_componentWillUpdate(props) {
    if (this.resolve) {
      if (!props.success || props.requests.length === 0) {
        this.resolve(props.success);
      }
    }
  }

  showTooltip = type => {
    this.setState({
      visibleTooltips: {
        ...this.state.visibleTooltips,
        [`${type}`]: true,
      },
    });
  };

  hideTooltip = type => {
    this.setState({
      visibleTooltips: {
        ...this.state.visibleTooltips,
        [`${type}`]: false,
      },
    });
  };

  initEventListeners = () => {
    const modalContent = document.querySelector('.js-panel-modal-content');

    if (modalContent) {
      modalContent.addEventListener('scroll', this.handleScroll);
    }
  };

  removeEventListeners = () => {
    const modalContent = document.querySelector('.js-panel-modal-content');

    if (modalContent) {
      modalContent.removeEventListener('scroll', this.handleScroll);
    }
  };

  handleScroll = event => {
    const scrollTop = event.srcElement.scrollTop;

    this.setState({
      scrolled: scrollTop > 0,
    });
  };

  handleClose = async type => {
    const {
      dispatch,
      closeCallback,
      viewId,
      windowType,
      requests,
      rawModal,
    } = this.props;
    const { isNew } = this.state;

    if (requests.length > 0) {
      const success = await new Promise(resolve => {
        this.resolve = resolve;
      });

      delete this.resolve;

      if (!success) {
        await dispatch({ type: PATCH_RESET });

        const title = 'Error while saving';
        const message = 'Not all fields have been saved';
        const time = 5000;
        const type = 'error';

        await dispatch(addNotification(title, message, time, type));

        return;
      }
    }

    if (type === 'BACK') {
      await dispatch(
        openRawModal(rawModal.parentWindowId, rawModal.parentViewId)
      );
    } else {
      if (closeCallback) {
        await closeCallback(isNew);
      }

      await this.removeModal();

      await deleteView(windowType, viewId, type);
    }
  };

  removeModal = async () => {
    const { dispatch, modalVisible, windowType, viewId } = this.props;

    await Promise.all(
      [
        closeRawModal(),
        closeModal(),
        closeListIncludedView({
          windowType,
          viewId,
          forceClose: true,
        }),
      ].map(action => dispatch(action))
    );

    if (!modalVisible) {
      document.body.style.overflow = 'auto';
    }
  };

  renderButtons = () => {
    const { modalVisible, rawModal } = this.props;
    let { allowedCloseActions } = this.props;
    const rawModalVisible = rawModal.visible || false;
    const buttonsArray = [];

    if (!allowedCloseActions) {
      allowedCloseActions = [];
    }

    for (let i = 0; i < allowedCloseActions.length; i += 1) {
      const name = allowedCloseActions[i];
      const showTooltip = this.state.visibleTooltips[name];
      const selector = `modal.actions.${name.toLowerCase()}`;

      buttonsArray.push(
        <ModalButton
          name={name}
          onClick={this.handleClose}
          tabIndex={!modalVisible && rawModalVisible ? 0 : -1}
          onShowTooltip={this.showTooltip}
          onHideTooltip={this.hideTooltip}
          key={i}
        >
          {counterpart.translate(selector)}
          {showTooltip && (
            <Tooltips
              name={keymap[name]}
              action={counterpart.translate(selector)}
              type={''}
            />
          )}
        </ModalButton>
      );
    }

    return buttonsArray;
  };

  generateShortcuts = () => {
    let { allowedCloseActions } = this.props;
    const shortcutActions = {};

    if (!allowedCloseActions) {
      shortcutActions.cancel = this.handleClose;

      allowedCloseActions = [];
    }

    for (let i = 0; i < allowedCloseActions.length; i += 1) {
      const name = allowedCloseActions[i];

      shortcutActions[`${name.toLowerCase()}`] = () => this.handleClose(name);
    }

    return <ModalContextShortcuts {...shortcutActions} />;
  };

  render() {
    const { modalTitle, children, modalDescription, rawModal } = this.props;
    const { scrolled } = this.state;
    if (!children) {
      return null;
    }

    return (
      <div className="screen-freeze raw-modal">
        <div className="click-overlay" onClick={this.removeModal} />
        <div className="modal-content-wrapper">
          <div className="panel panel-modal panel-modal-primary">
            <div
              className={classnames('panel-modal-header', {
                'header-shadow': scrolled,
              })}
            >
              <span className="panel-modal-header-title panel-modal-header-title-with-header-properties">
                {modalTitle ? modalTitle : 'Modal'}
                <span className="panel-modal-description">
                  {modalDescription ? modalDescription : ''}
                </span>
              </span>
              {!!rawModal.headerProperties && (
                <div className="optional">
                  {rawModal.headerProperties.entries.map((entry, idx) => (
                    <span key={idx} className="optional-name">
                      <p className="caption">{entry.caption}:</p>{' '}
                      <p className="value">{entry.value}</p>
                    </span>
                  ))}
                </div>
              )}
              <div className="items-row-2">{this.renderButtons()}</div>
            </div>
            <Indicator />
            <div
              className="panel-modal-content js-panel-modal-content"
              ref={c => {
                c && c.focus();
              }}
            >
              {children}
            </div>
            {this.generateShortcuts()}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ windowHandler }) => ({
  modalVisible: windowHandler.modal.visible || false,
  rawModal: windowHandler.rawModal,
  requests: windowHandler.patches.requests,
  success: windowHandler.patches.success,
});

RawModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  closeCallback: PropTypes.func,
  children: PropTypes.node,
  allowedCloseActions: PropTypes.array,
  windowType: PropTypes.string,
  viewId: PropTypes.string,
  modalTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  modalDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  modalVisible: PropTypes.bool,
  rawModal: PropTypes.object.isRequired,
  requests: PropTypes.object.isRequired,
  success: PropTypes.bool.isRequired,
};

export default connect(mapStateToProps)(RawModal);
