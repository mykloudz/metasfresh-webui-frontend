import PropTypes from 'prop-types';

export const RawWidgetPropTypes = {
  dispatch: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool,
  textSelected: PropTypes.bool,
  listenOnKeys: PropTypes.bool,
  listenOnKeysFalse: PropTypes.func,
  listenOnKeysTrue: PropTypes.func,
  widgetData: PropTypes.array,
  handleFocus: PropTypes.func,
  handlePatch: PropTypes.func,
  handleBlur: PropTypes.func,
  handleProcess: PropTypes.func,
  handleChange: PropTypes.func,
  handleBackdropLock: PropTypes.func,
  handleZoomInto: PropTypes.func,
  tabId: PropTypes.string,
  viewId: PropTypes.string,
  rowId: PropTypes.string,
  dataId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  windowType: PropTypes.string,
  caption: PropTypes.string,
  gridAlign: PropTypes.string,
  type: PropTypes.string,
  updated: PropTypes.bool,
  isModal: PropTypes.bool,
  modalVisible: PropTypes.bool.isRequired,
  filterWidget: PropTypes.bool,
  filterId: PropTypes.string,
  id: PropTypes.number,
  range: PropTypes.bool,
  onShow: PropTypes.func,
  onHide: PropTypes.func,
  subentity: PropTypes.string,
  subentityId: PropTypes.string,
  tabIndex: PropTypes.number,
  dropdownOpenCallback: PropTypes.func,
  fullScreen: PropTypes.string,
  widgetType: PropTypes.string,
  fields: PropTypes.array,
  icon: PropTypes.string,
  entity: PropTypes.string,
  data: PropTypes.any,
  closeTableField: PropTypes.func,
  attribute: PropTypes.bool,
  allowShowPassword: PropTypes.bool, // NOTE: looks like this wasn't used
  buttonProcessId: PropTypes.string, // NOTE: looks like this wasn't used
  onBlurWidget: PropTypes.func,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  noLabel: PropTypes.bool,
  isOpenDatePicker: PropTypes.bool,
};

export const RawWidgetDefaultProps = {
  tabIndex: 0,
  handleZoomInto: () => {},
};
