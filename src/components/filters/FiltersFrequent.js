import cx from 'classnames';
import counterpart from 'counterpart';
import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import onClickOutside from 'react-onclickoutside';
import currentDevice from 'current-device';

import FiltersDateStepper from './FiltersDateStepper';
import FiltersItem from './FiltersItem';
import InlineFilterItem from './InlineFilterItem';
import { DATE_FIELD_TYPES, TIME_FIELD_TYPES } from '../../constants/Constants';

const classes = `btn btn-filter
btn-meta-outline-secondary btn-sm toggle-filters`;

/**
 * @file Class based component.
 * @module FiltersFrequent
 * @extends PureComponent
 */
class FiltersFrequent extends PureComponent {
  state = { openFilterId: null };
  deviceType = null;

  constructor(props) {
    super(props);

    this.deviceType = currentDevice.type;
  }

  /**
   * @method toggleFilter
   * @summary ToDo: Describe the method
   * @param {*} index
   * @todo Write the documentation
   */
  toggleFilter = index => {
    this.setState({
      openFilterId: index,
    });
  };

  /**
   * @method findActiveFilter
   * @summary ToDo: Describe the method
   * @param {*} id
   * @todo Write the documentation
   */
  findActiveFilter = id => {
    const { active } = this.props;

    return active ? active.find(item => item.filterId === id) : null;
  };

  /**
   * @method handleClickOutside
   * @summary ToDo: Describe the method
   * @todo Write the documentation
   */
  handleClickOutside = () => {
    this.outsideClick();
  };

  /**
   * @method outsideClick
   * @summary ToDo: Describe the method
   * @todo Write the documentation
   */
  outsideClick = () => {
    const { widgetShown, dropdownToggled, allowOutsideClick } = this.props;
    if (allowOutsideClick) {
      !widgetShown && this.toggleFilter(null);
      dropdownToggled();
    }
  };

  /**
   * @method render
   * @summary ToDo: Describe the method
   * @todo Write the documentation
   */
  render() {
    const {
      data,
      windowType,
      notValidFields,
      viewId,
      handleShow,
      applyFilters,
      clearFilters,
      active,
      modalVisible,
      activeFiltersCaptions,
    } = this.props;
    const { openFilterId } = this.state;

    return (
      <div className="filter-wrapper filters-frequent">
        {data.map((item, index) => {
          const parameter = item.parameters[0];
          const filterType = parameter.widgetType;
          const dateStepper =
            // keep implied information (e.g. for refactoring)
            item.frequent &&
            item.parameters.length === 1 &&
            parameter.showIncrementDecrementButtons &&
            item.isActive &&
            DATE_FIELD_TYPES.includes(filterType) &&
            !TIME_FIELD_TYPES.includes(filterType);

          const isActive =
            item.isActive && activeFiltersCaptions[item.filterId]
              ? activeFiltersCaptions[item.filterId]
              : null;

          if (item.inlineRenderMode === 'button') {
            return (
              <div className="filter-wrapper filter-inline" key={index}>
                {dateStepper && (
                  <FiltersDateStepper
                    active={this.findActiveFilter(item.filterId)}
                    applyFilters={applyFilters}
                    filter={item}
                  />
                )}

                <button
                  onClick={() => this.toggleFilter(item.filterId)}
                  className={cx(classes, {
                    ['btn-select']: openFilterId === index,
                    ['btn-active']: isActive,
                    ['btn-distance']: !dateStepper,
                  })}
                  tabIndex={modalVisible ? -1 : 0}
                >
                  <i className="meta-icon-preview" />
                  {item.isActive &&
                  item.parameters &&
                  item.parameters.length === 1 &&
                  item.captionValue ? (
                    <Fragment>
                      {`${item.caption}: `}
                      {item.captionValue}
                    </Fragment>
                  ) : (
                    `${
                      this.deviceType === 'desktop'
                        ? counterpart.translate('window.filters.caption2')
                        : ''
                    }: ${item.caption}`
                  )}
                </button>

                {dateStepper && (
                  <FiltersDateStepper
                    active={this.findActiveFilter(item.filterId)}
                    applyFilters={applyFilters}
                    filter={item}
                    next
                  />
                )}

                {openFilterId === item.filterId && (
                  <FiltersItem
                    captionValue={item.captionValue}
                    key={index}
                    windowType={windowType}
                    data={item}
                    closeFilterMenu={() => this.toggleFilter()}
                    clearFilters={clearFilters}
                    applyFilters={applyFilters}
                    notValidFields={notValidFields}
                    isActive={item.isActive}
                    active={active}
                    onShow={() => handleShow(true)}
                    onHide={() => handleShow(false)}
                    viewId={viewId}
                    outsideClick={this.outsideClick}
                    openedFilter={true}
                    filtersWrapper={this.props.filtersWrapper}
                  />
                )}
              </div>
            );
          }

          return (
            <div key={index} className="inline-filters">
              {item.parameters &&
                item.parameters.map((filter, idx) => (
                  <InlineFilterItem
                    captionValue={filter.captionValue}
                    key={idx}
                    id={idx}
                    parentFilter={item}
                    windowType={windowType}
                    data={filter}
                    clearFilters={clearFilters}
                    applyFilters={applyFilters}
                    notValidFields={notValidFields}
                    isActive={filter.isActive}
                    active={active}
                    onShow={() => handleShow(true)}
                    onHide={() => handleShow(false)}
                    viewId={viewId}
                    outsideClick={this.outsideClick}
                  />
                ))}
            </div>
          );
        })}
      </div>
    );
  }
}

/**
 * @typedef {object} Props Component props
 * @prop {bool} allowOutsideClick
 * @prop {bool} modalVisible
 * @prop {array} [active]
 * @prop {*} [filtersWrapper]
 * @prop {object} [activeFiltersCaptions]
 * @prop {*} data
 * @prop {*} windowType
 * @prop {*} notValidFields
 * @prop {*} viewId
 * @prop {*} handleShow
 * @prop {*} applyFilters
 * @prop {*} clearFilters
 * @prop {*} widgetShown
 * @prop {*} dropdownToggled
 * @todo Check props. Which proptype? Required or optional?
 */
FiltersFrequent.propTypes = {
  allowOutsideClick: PropTypes.bool.isRequired,
  modalVisible: PropTypes.bool.isRequired,
  active: PropTypes.array,
  filtersWrapper: PropTypes.any,
  activeFiltersCaptions: PropTypes.object,
  data: PropTypes.any,
  windowType: PropTypes.any,
  notValidFields: PropTypes.any,
  viewId: PropTypes.any,
  handleShow: PropTypes.any,
  applyFilters: PropTypes.any,
  clearFilters: PropTypes.any,
  widgetShown: PropTypes.any,
  dropdownToggled: PropTypes.any,
};

/**
 * @method mapStateToProps
 * @summary ToDo: Describe the method
 * @param {object} state
 * @todo Write the documentation
 */
const mapStateToProps = state => {
  const { allowOutsideClick, modal } = state.windowHandler;

  return {
    allowOutsideClick,
    modalVisible: modal.visible,
  };
};

export default connect(mapStateToProps)(onClickOutside(FiltersFrequent));
