import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getWindowBreadcrumb } from '../../actions/MenuActions';
import MenuOverlayItem from './MenuOverlayItem';

class MenuOverlayContainer extends Component {
  constructor(props) {
    super(props);
  }

  handleClick = () => {
    const { dispatch, onRedirect, elementId } = this.props;
    onRedirect(elementId);
    dispatch(getWindowBreadcrumb(elementId));
  };

  render() {
    const {
      children,
      elementId,
      caption,
      type,
      onClickOnFolder,
      onRedirect,
      onNewRedirect,
      printChildren,
      deep,
      back,
      onMenuOverlay,
      openModal,
      showBookmarks,
      updateData,
      transparentBookmarks,
      onKeyDown,
    } = this.props;
    return (
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={
          'menu-overlay-node-container js-menu-container ' +
          (deep
            ? 'menu-overlay-node-spaced '
            : 'menu-overlay-expanded-link-spaced js-menu-main-container')
        }
      >
        {type === 'group' && (
          <span
            className={
              'menu-overlay-header ' +
              (!printChildren ? 'menu-overlay-header-spaced ' : '') +
              (!deep ? 'menu-overlay-header-main' : '')
            }
          >
            {caption}
          </span>
        )}

        {type !== 'group' && (
          <MenuOverlayItem
            printChildren={false}
            {...{
              showBookmarks,
              openModal,
              back,
              type,
              caption,
              elementId,
              updateData,
              transparentBookmarks,
              onMenuOverlay,
              onNewRedirect,
              onRedirect,
              onClickOnFolder,
            }}
          />
        )}

        {children &&
          children.length > 0 &&
          children.map(
            (subitem, subindex) =>
              subitem.children && printChildren ? (
                <MenuOverlayContainer
                  key={subindex}
                  printChildren={true}
                  deep={true}
                  {...subitem}
                  {...{
                    showBookmarks,
                    openModal,
                    updateData,
                    transparentBookmarks,
                    onNewRedirect,
                    onRedirect,
                    onClickOnFolder,
                  }}
                />
              ) : (
                <MenuOverlayItem
                  key={subindex}
                  {...subitem}
                  {...{
                    showBookmarks,
                    openModal,
                    back,
                    printChildren,
                    updateData,
                    transparentBookmarks,
                    onMenuOverlay,
                    onNewRedirect,
                    onRedirect,
                    onClickOnFolder,
                  }}
                />
              )
          )}
      </div>
    );
  }
}

MenuOverlayContainer.propTypes = {
  dispatch: PropTypes.func.isRequired,
  onMenuOverlay: PropTypes.func,
};

export default connect()(MenuOverlayContainer);
