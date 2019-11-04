import counterpart from 'counterpart';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DebounceInput from 'react-debounce-input';
import onClickOutside from 'react-onclickoutside';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import {
  breadcrumbRequest,
  flattenLastElem,
  getRootBreadcrumb,
  getWindowBreadcrumb,
  pathRequest,
  queryPathsRequest,
} from '../../actions/MenuActions';
import { clearMasterData, closeModal } from '../../actions/WindowActions';
import MenuOverlayContainer from './MenuOverlayContainer';
import MenuOverlayItem from './MenuOverlayItem';

/**
 * @file Class based component.
 * @module MenuOverlay
 * @extends Component
 */
class MenuOverlay extends Component {
  state = {
    queriedResults: [],
    query: '',
    deepSubNode: null,
    path: '',
    data: {},
  };

  /**
   * @method componentDidMount
   * @summary ToDo: Describe the method.
   */
  componentDidMount = () => {
    const { nodeId } = this.props;

    if (nodeId == 0) {
      getRootBreadcrumb().then(response => {
        this.setState({
          data: response,
        });
      });
    } else {
      if (this.props.node && this.props.node.children) {
        this.setState({
          data: this.props.node,
        });
      } else {
        breadcrumbRequest(nodeId).then(response => {
          this.setState({
            data: response.data,
          });
        });
      }
    }
  };

  /**
   * @method handleClickOutside
   * @summary ToDo: Describe the method.
   * @param {object} event
   */
  handleClickOutside = e => this.props.onClickOutside(e);

  /**
   * @method handleQuery
   * @summary ToDo: Describe the method.
   * @param {object} event
   */
  handleQuery = e => {
    e.preventDefault();

    if (e.target.value) {
      this.setState({
        query: e.target.value,
      });
      queryPathsRequest(e.target.value, 9)
        .then(response => {
          this.setState({
            queriedResults: flattenLastElem(response.data),
          });
        })
        .catch(err => {
          if (err.response && err.response.status === 404) {
            this.setState({
              queriedResults: [],
            });
          }
        });
    } else {
      this.setState(
        {
          query: '',
          queriedResults: [],
        },
        () => {
          if (this.searchInputQuery) this.searchInputQuery.value = '';
        }
      );
    }
  };

  /**
   * @method handleClear
   * @summary ToDo: Describe the method.
   * @param {object} event
   */
  handleClear = e => {
    e.preventDefault();
    this.setState(
      {
        query: '',
        queriedResults: [],
      },
      () => {
        if (this.searchInputQuery) this.searchInputQuery.value = '';
      }
    );
  };

  /**
   * @method mapStateToProps
   * @summary ToDo: Describe the method.
   * @param {*} elementId
   * @param {*} isNew
   * @param {*} entity
   */
  handleRedirect = (elementId, isNew, entity) => {
    const { dispatch } = this.props;

    this.handleClickOutside();

    dispatch(closeModal());
    dispatch(clearMasterData());

    this.props.dispatch(
      push(
        '/' +
          (entity ? entity : 'window') +
          '/' +
          elementId +
          (isNew ? '/new' : '')
      )
    );
  };

  /**
   * @method handleNewRedirect
   * @summary ToDo: Describe the method.
   * @param {*} elementId
   */
  handleNewRedirect = elementId => this.handleRedirect(elementId, true);

  /**
   * @method handlePath
   * @summary ToDo: Describe the method.
   * @param {*} nodeId
   */
  handlePath = nodeId => {
    pathRequest(nodeId).then(response => {
      let pathArray = [];
      let node = response.data;

      do {
        const children = node.children && node.children[0];
        node.children = undefined;

        pathArray.push(node);
        node = children;
      } while (node);

      //remove first MENU element
      pathArray.shift();

      this.setState({
        path: pathArray,
      });
    });
  };

  /**
   * @method renderPath
   * @summary ToDo: Describe the method.
   * @param {*} path
   */
  renderPath = path => {
    return (
      <span>
        {path &&
          path.map((item, index) => (
            <span key={index}>
              {item.nodeId > 0
                ? (index > 0 ? ' / ' : '') + item.captionBreadcrumb
                : item.captionBreadcrumb}
            </span>
          ))}
      </span>
    );
  };

  /**
   * @method renderNavigation
   * @summary ToDo: Describe the method.
   * @param {*} node
   */
  renderNavigation = node => {
    const { handleMenuOverlay, openModal, dispatch, siteName } = this.props;
    return (
      <div
        className="menu-overlay-container-column-wrapper js-menu-overlay"
        tabIndex={0}
        onKeyDown={e => this.handleKeyDown(e)}
      >
        <div className="menu-overlay-top-spacer" />
        <div>
          <span
            className="menu-overlay-header menu-overlay-header-spaced menu-overlay-header-main pointer js-menu-header"
            onClick={e => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }

              dispatch(closeModal());
              dispatch(clearMasterData());

              dispatch(push('/'));
            }}
            tabIndex={0}
          >
            Dashboard
          </span>
        </div>
        {siteName !== 'Sitemap' && (
          <div>
            <span
              className="menu-overlay-header menu-overlay-header-spaced menu-overlay-header-main pointer js-menu-header js-browse-item"
              onClick={e => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }

                dispatch(closeModal());
                dispatch(clearMasterData());

                dispatch(push('/sitemap'));
              }}
              tabIndex={0}
            >
              {counterpart.translate('window.browseTree.caption')}
            </span>
          </div>
        )}
        <div>
          {node &&
            node.children &&
            node.children.map((item, index) => (
              <MenuOverlayContainer
                key={index}
                handleClickOnFolder={this.handleDeeper}
                handleRedirect={this.handleRedirect}
                handleNewRedirect={this.handleNewRedirect}
                handlePath={this.handlePath}
                parent={node}
                printChildren={true}
                transparentBookmarks={true}
                back={e => this.handleClickBack(e)}
                handleMenuOverlay={handleMenuOverlay}
                openModal={openModal}
                {...item}
              />
            ))}
        </div>
      </div>
    );
  };

  /**
   * @method renderSubnavigation
   * @summary ToDo: Describe the method.
   * @param {*} nodeData
   */
  renderSubnavigation = nodeData => {
    const { handleMenuOverlay, openModal } = this.props;
    return (
      <div>
        <MenuOverlayContainer
          handleClickOnFolder={this.handleDeeper}
          handleRedirect={this.handleRedirect}
          handleNewRedirect={this.handleNewRedirect}
          handlePath={this.handlePath}
          parent={nodeData}
          printChildren={true}
          transparentBookmarks={true}
          back={e => this.handleClickBack(e)}
          handleMenuOverlay={handleMenuOverlay}
          openModal={openModal}
          subNavigation={true}
          type={nodeData.type}
        >
          {nodeData}
        </MenuOverlayContainer>
      </div>
    );
  };

  /**
   * @method linkClick
   * @summary ToDo: Describe the method.
   * @param {*} item
   */
  linkClick = item => {
    const { dispatch } = this.props;
    if (item.elementId && item.type == 'newRecord') {
      this.handleNewRedirect(item.elementId);
    } else if (item.elementId && item.type == 'window') {
      this.handleRedirect(item.elementId);
      dispatch(getWindowBreadcrumb(item.elementId));
    }
  };

  /**
   * @method handleKeyDown
   * @summary ToDo: Describe the method.
   * @param {object} event
   */
  handleKeyDown = e => {
    const { handleMenuOverlay } = this.props;
    const input = this.searchInputQuery;

    const firstMenuItem = document.getElementsByClassName('js-menu-item')[0];
    const firstQueryItem = document
      .getElementsByClassName('menu-overlay-query')[0]
      .getElementsByClassName('js-menu-item')[0];
    const browseItem = document.getElementsByClassName('js-browse-item')[0];
    const isBrowseItemActive = document.activeElement.classList.contains(
      'js-browse-item'
    );
    const overlay = document.activeElement.classList.contains(
      'js-menu-overlay'
    );
    const headerLink = document.getElementsByClassName('js-menu-header')[0];
    const isHeaderLinkActive = document.activeElement.classList.contains(
      'js-menu-header'
    );
    const headerItem = document.getElementsByClassName('js-menu-header')[0];
    const prevParentSibling =
      document.activeElement.parentElement.previousSibling;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();

        if (document.activeElement === input) {
          firstQueryItem && firstQueryItem.focus();
        } else if (overlay) {
          headerItem.focus();
        } else if (isBrowseItemActive) {
          firstMenuItem.focus();
        } else if (isHeaderLinkActive) {
          if (browseItem) {
            browseItem.focus();
          } else {
            firstMenuItem.focus();
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();

        if (document.activeElement.classList.contains('js-menu-header')) {
          prevParentSibling.children[0] &&
            prevParentSibling.children[0].classList.contains(
              'js-menu-header'
            ) &&
            prevParentSibling.children[0].focus();
        } else if (
          document.activeElement ===
          document.getElementsByClassName('js-menu-item')[0]
        ) {
          if (browseItem) {
            browseItem.focus();
          } else {
            headerItem.focus();
          }
        }

        if (document.activeElement.classList.contains('js-menu-item')) {
          this.handleArrowUp();
        }

        break;
      case 'Tab':
        e.preventDefault();

        if (document.activeElement === input) {
          headerLink.focus();
        } else {
          input.focus();
        }
        break;
      case 'Enter':
        e.preventDefault();

        document.activeElement.click();
        break;
      case 'Backspace':
        if (document.activeElement !== input) {
          e.preventDefault();
          this.handleClickBack(e);
          document.getElementsByClassName('js-menu-overlay')[0].focus();
        }
        break;
      case 'Escape':
        e.preventDefault();

        handleMenuOverlay('', '');
    }
  };

  /**
   * @method handleArrowUp
   * @summary ToDo: Describe the method.
   */
  handleArrowUp() {
    let prevSiblings = document.activeElement.previousSibling;

    if (prevSiblings && prevSiblings.classList.contains('input-primary')) {
      this.searchInputQuery && this.searchInputQuery.focus();
    } else if (
      prevSiblings &&
      prevSiblings.classList.contains('js-menu-item')
    ) {
      document.activeElement.previousSibling.focus();
    } else {
      this.handleGroupUp();
    }
  }

  /**
   * @method findPreviousGroup
   * @summary ToDo: Describe the method.
   */
  findPreviousGroup() {
    let elem = document.activeElement.parentElement;
    let i = 0;

    while (
      !(
        (elem &&
          elem.classList.contains('js-menu-container') &&
          elem.previousSibling &&
          elem.previousSibling.children.length !== 0) ||
        (elem && elem.classList.contains('js-menu-main-container') && i < 100)
      )
    ) {
      elem = elem && elem.parentElement;
      i++;
    }

    return elem.previousSibling;
  }

  /**
   * @method selectLastItem
   * @summary ToDo: Describe the method.
   * @param {*} previousGroup
   */
  selectLastItem(previousGroup) {
    const listChildren = previousGroup.childNodes;
    const lastChildren = listChildren[listChildren.length - 1];

    if (listChildren.length == 1) {
      listChildren[0].focus && listChildren[0].focus();
    } else {
      if (lastChildren.classList.contains('js-menu-item')) {
        lastChildren.focus();
      } else {
        if (
          lastChildren.children[
            lastChildren.children.length - 1
          ].classList.contains('js-menu-item')
        ) {
          lastChildren.children[lastChildren.children.length - 1].focus();
        } else {
          lastChildren.children[lastChildren.children.length - 1]
            .getElementsByClassName('js-menu-item')
            [
              lastChildren.children[
                lastChildren.children.length - 1
              ].getElementsByClassName('js-menu-item').length - 1
            ].focus();
        }
      }
    }
  }

  /**
   * @method handleGroupUp
   * @summary ToDo: Describe the method.
   */
  handleGroupUp() {
    const previousMainGroup = this.findPreviousGroup();
    const previousGroup = document.activeElement.parentElement.previousSibling;

    if (previousGroup && previousGroup.classList.contains('js-menu-item')) {
      previousGroup.focus();
    } else {
      if (previousGroup.children.length > 0) {
        this.selectLastItem(previousGroup);
      } else if (previousMainGroup) {
        this.selectLastItem(previousMainGroup);
      } else {
        document.activeElement.previousSibling.focus();
      }
    }
  }

  /**
   * @method render
   * @summary ToDo: Describe the method.
   */
  render() {
    const { queriedResults, deepSubNode, query, data } = this.state;
    const { nodeId, node, handleMenuOverlay, openModal } = this.props;
    const nodeData = data.length
      ? data
      : node && node.children
      ? node.children
      : node;

    return (
      <div className="menu-overlay menu-overlay-primary">
        <div className="menu-overlay-body breadcrumbs-shadow">
          {nodeId == 0 ? (
            //ROOT
            <div className="menu-overlay-root-body">
              {this.renderNavigation(data)}

              <div className="menu-overlay-query hidden-sm-down">
                <div className="input-flex input-primary">
                  <i className="input-icon meta-icon-preview" />

                  <DebounceInput
                    debounceTimeout={250}
                    type="text"
                    inputRef={ref => {
                      this.searchInputQuery = ref;
                    }}
                    className="input-field"
                    placeholder={counterpart.translate(
                      'window.type.placeholder'
                    )}
                    autoComplete="new-password"
                    onChange={this.handleQuery}
                    onKeyDown={this.handleKeyDown}
                  />

                  {query && (
                    <i
                      className="input-icon meta-icon-close-alt pointer"
                      onClick={this.handleClear}
                    />
                  )}
                </div>

                {queriedResults &&
                  queriedResults.map((result, index) => (
                    <MenuOverlayItem
                      key={index}
                      query={true}
                      transparentBookmarks={true}
                      handleClickOnFolder={this.handleDeeper}
                      handleRedirect={this.handleRedirect}
                      handleNewRedirect={this.handleNewRedirect}
                      handlePath={this.handlePath}
                      handleMenuOverlay={handleMenuOverlay}
                      openModal={openModal}
                      inputElement={this.searchInputQuery}
                      {...result}
                    />
                  ))}

                {queriedResults.length === 0 && query !== '' && (
                  <span>There are no results</span>
                )}
              </div>
            </div>
          ) : (
            //NOT ROOT
            <div className="menu-overlay-node-container menu-suboverlay">
              {this.renderSubnavigation(deepSubNode ? deepSubNode : nodeData)}
            </div>
          )}
        </div>
      </div>
    );
  }
}

/**
 * @typedef {object} Props Component props
 * @prop {func} dispatch
 * @prop {*} [nodeId]
 * @prop {*} [node]
 * @prop {*} [handleMenuOverlay]
 * @prop {*} [openModal]
 * @prop {*} [siteName]
 * @prop {func} [onClickOutside]
 */
MenuOverlay.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nodeId: PropTypes.any,
  node: PropTypes.any,
  handleMenuOverlay: PropTypes.any,
  openModal: PropTypes.any,
  siteName: PropTypes.any,
  onClickOutside: PropTypes.func,
};

export default connect()(onClickOutside(MenuOverlay));
