import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';

import { updateUri } from '../actions/AppActions';
import { getWindowBreadcrumb } from '../actions/MenuActions';
import {
  selectTableItems,
  setLatestNewDocument,
} from '../actions/WindowActions';
import Container from '../components/Container';
import DocumentList from '../components/app/DocumentList';
import Overlay from '../components/app/Overlay';

/**
 * @file Class based component.
 * @module DocList
 * @extends Component
 */
class DocList extends Component {
  state = {
    modalTitle: '',
    modalDescription: '',
    notfound: false,
  };

  /**
   * @method componentDidMount
   * @summary ToDo: Describe the method.
   */
  componentDidMount = () => {
    const { dispatch, windowType, latestNewDocument, query } = this.props;

    dispatch(getWindowBreadcrumb(windowType));

    if (latestNewDocument) {
      dispatch(
        selectTableItems({
          windowType,
          viewId: query.viewId,
          ids: [latestNewDocument],
        })
      );
      dispatch(setLatestNewDocument(null));
    }
  };

  /**
   * @method componentDidUpdate
   * @summary ToDo: Describe the method.
   */
  componentDidUpdate = prevProps => {
    const { dispatch, windowType } = this.props;

    if (prevProps.windowType !== windowType) {
      dispatch(getWindowBreadcrumb(windowType));
    }
  };

  /**
   * @method updateUriCallback
   * @summary ToDo: Describe the method.
   */
  updateUriCallback = (prop, value) => {
    const { dispatch, query, pathname } = this.props;

    dispatch(updateUri(pathname, query, prop, value));
  };

  /**
   * @method setModalTitle
   * @summary ToDo: Describe the method.
   */
  setModalTitle = title => {
    this.setState({ modalTitle: title });
  };

  /**
   * @method setModalDescription
   * @summary ToDo: Describe the method.
   */
  setModalDescription = desc => {
    this.setState({ modalDescription: desc });
  };

  /**
   * @method setNotFound
   * @summary ToDo: Describe the method.
   */
  setNotFound = isNotFound => {
    this.setState({ notfound: isNotFound });
  };

  /**
   * @method handleUpdateParentSelectedIds
   * @summary ToDo: Describe the method.
   */
  handleUpdateParentSelectedIds = childSelection => {
    this.masterDocumentList.updateQuickActions(childSelection);
  };

  /**
   * @method render
   * @summary ToDo: Describe the method.
   */
  render() {
    const {
      windowType,
      breadcrumb,
      query,
      modal,
      rawModal,
      pluginModal,
      overlay,
      indicator,
      processStatus,
      includedView,
    } = this.props;
    const { modalTitle, notfound, modalDescription } = this.state;
    let refRowIds = [];

    if (query && query.refRowIds) {
      try {
        refRowIds = JSON.parse(query.refRowIds);
      } catch (e) {
        refRowIds = [];
      }
    }

    return (
      <Container
        entity="documentView"
        modal={modal}
        rawModal={rawModal}
        pluginModal={pluginModal}
        breadcrumb={breadcrumb}
        windowType={windowType}
        query={query}
        notfound={notfound}
        indicator={indicator}
        modalTitle={modalTitle}
        processStatus={processStatus}
        includedView={includedView}
        setModalTitle={this.setModalTitle}
        setModalDescription={this.setModalDescription}
        modalDescription={modalDescription}
        showIndicator={!modal.visible && !rawModal.visible}
        masterDocumentList={this.masterDocumentList}
      >
        <Overlay data={overlay.data} showOverlay={overlay.visible} />

        <div
          className={classnames('document-lists-wrapper', {
            'modal-overlay': rawModal.visible,
          })}
        >
          <DocumentList
            ref={element => {
              this.masterDocumentList = element ? element : null;
            }}
            type="grid"
            updateUri={this.updateUriCallback}
            windowType={windowType}
            defaultViewId={query.viewId}
            defaultSort={query.sort}
            defaultPage={parseInt(query.page)}
            refType={query.refType}
            refId={query.refId}
            refTabId={query.refTabId}
            refRowIds={refRowIds}
            includedView={includedView}
            inBackground={rawModal.visible}
            inModal={modal.visible}
            fetchQuickActionsOnInit
            processStatus={processStatus}
            disablePaginationShortcuts={modal.visible || rawModal.visible}
            setNotFound={this.setNotFound}
            notfound={notfound}
          />

          {includedView &&
            includedView.windowType &&
            includedView.viewId &&
            !rawModal.visible &&
            !modal.visible && (
              <DocumentList
                type="includedView"
                windowType={includedView.windowType}
                defaultViewId={includedView.viewId}
                parentWindowType={windowType}
                parentDefaultViewId={query.viewId}
                updateParentSelectedIds={this.handleUpdateParentSelectedIds}
                viewProfileId={includedView.viewProfileId}
                fetchQuickActionsOnInit
                processStatus={processStatus}
                isIncluded
                inBackground={false}
                inModal={false}
              />
            )}
        </div>
      </Container>
    );
  }
}

/**
 * @typedef {object} Props Component props
 * @prop {array} breadcrumb
 * @prop {func} dispatch
 * @prop {object} includedView
 * @prop {string} indicator
 * @prop {*} latestNewDocument
 * @prop {object} modal
 * @prop {object} overlay
 * @prop {string} pathname
 * @prop {object} pluginModal
 * @prop {string} processStatus
 * @prop {object} query
 * @prop {object} rawModal
 * @prop {object} windowType
 */
DocList.propTypes = {
  breadcrumb: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  includedView: PropTypes.object.isRequired,
  indicator: PropTypes.string.isRequired,
  latestNewDocument: PropTypes.any,
  modal: PropTypes.object.isRequired,
  overlay: PropTypes.object,
  pathname: PropTypes.string.isRequired,
  pluginModal: PropTypes.object,
  processStatus: PropTypes.string.isRequired,
  query: PropTypes.object.isRequired,
  rawModal: PropTypes.object.isRequired,
  windowType: PropTypes.any,
};

/**
 * @method mapStateToProps
 * @summary ToDo: Describe the method.
 * @param {object} state
 */
const mapStateToProps = state => ({
  modal: state.windowHandler.modal,
  rawModal: state.windowHandler.rawModal,
  pluginModal: state.windowHandler.pluginModal,
  overlay: state.windowHandler.overlay,
  latestNewDocument: state.windowHandler.latestNewDocument,
  indicator: state.windowHandler.indicator,
  includedView: state.listHandler.includedView,
  processStatus: state.appHandler.processStatus,
  breadcrumb: state.menuHandler.breadcrumb,
  pathname: state.routing.locationBeforeTransitions.pathname,
});

export default connect(mapStateToProps)(DocList);
