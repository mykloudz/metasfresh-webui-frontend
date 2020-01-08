import React, { Component } from 'react';
import counterpart from 'counterpart';
import PropTypes from 'prop-types';
import onClickOutside from 'react-onclickoutside';
import { connect } from 'react-redux';
import classnames from 'classnames';
import * as _ from 'lodash';

import { getItemsByProperty } from '../../../utils';
import BarcodeScanner from '../BarcodeScanner/BarcodeScannerWidget';
import List from '../List/List';
import RawLookup from './RawLookup';
import WidgetTooltip from '../WidgetTooltip';

class Lookup extends Component {
  rawLookupsState = {};

  constructor(props) {
    super(props);

    const lookupWidgets = {};
    if (props.properties) {
      props.properties.forEach(item => {
        lookupWidgets[`${item.field}`] = {
          dropdownOpen: false,
          tooltipOpen: false,
          fireDropdownList: false,
          isFocused: false,
          isInputEmpyt: false,
        };
      });

      this.rawLookupsState = { ...lookupWidgets };
    }

    this.state = {
      isInputEmpty: true,
      propertiesCopy: getItemsByProperty(props.properties, 'source', 'list'),
      property: '',
      initialFocus: props.initialFocus,
      localClearing: false,
      autofocusDisabled: false,
      isFocused: false,
      isDropdownListOpen: false,
      lookupWidgets,
    };
  }

  componentDidMount() {
    this.checkIfDefaultValue();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { widgetData, selected } = this.props;

    if (
      widgetData &&
      nextProps.widgetData &&
      !_.isEqual(widgetData[0].value, nextProps.widgetData[0].value)
    ) {
      this.checkIfDefaultValue();
    }

    if (!_.isEqual(selected, nextProps.selected)) {
      this.setState({
        isInputEmpty: !nextProps.selected,
        localClearing: false,
      });
    }
  }

  getLookupWidget = name => {
    return { ...this.state.lookupWidgets[`${name}`] };
  };

  getFocused = fieldName => this.getLookupWidget(fieldName).isFocused;

  _changeWidgetProperty = (field, property, value, callback) => {
    const { lookupWidgets } = this.state;

    if (lookupWidgets[`${field}`][`${property}`] !== property) {
      const newLookupWidgets = {
        ...lookupWidgets,
        [`${field}`]: {
          ...lookupWidgets[`${field}`],
          [`${property}`]: value,
        },
      };

      this.setState(
        {
          lookupWidgets: newLookupWidgets,
        },
        callback
      );
    }
  };

  checkIfDefaultValue = () => {
    const { widgetData } = this.props;

    if (widgetData) {
      widgetData.map(item => {
        if (item.value) {
          this.setState({
            isInputEmpty: false,
          });
        }
      });
    }
  };

  setNextProperty = prop => {
    const { widgetData, properties, onBlurWidget } = this.props;

    if (widgetData) {
      widgetData.map((item, index) => {
        const nextIndex = index + 1;

        if (nextIndex < widgetData.length && widgetData[index].field === prop) {
          let nextProp = properties[nextIndex];

          // TODO: Looks like this code was never used
          // if (nextProp.source === 'list') {
          //   this.linkedList.map(listComponent => {
          //     if (listComponent && listComponent.props) {
          //       let listProp = listComponent.props.mainProperty;

          //       if (
          //         listProp &&
          //         Array.isArray(listProp) &&
          //         listProp.length > 0
          //       ) {
          //         const listPropField = listProp[0].field;

          //         if (
          //           listComponent.activate &&
          //           listPropField === nextProp.field
          //         ) {
          //           listComponent.requestListData(true, true);
          //           listComponent.activate();
          //         }
          //       }
          //     }
          //   });

          //   this.setState({
          //     property: nextProp.field,
          //   });
          // } else {
          // this.setState({
          //   property: nextProp.field,
          // });
          this.setState(
            {
              property: nextProp.field,
            },
            () => {
              onBlurWidget && onBlurWidget();
            }
          );
          // }
        } else if (widgetData[widgetData.length - 1].field === prop) {
          this.setState(
            {
              property: '',
            },
            () => {
              onBlurWidget && onBlurWidget();
            }
          );
        }
      });
    }
  };

  // mouse param is to tell us if we should enable listening to keys
  // in Table or not. If user selected option with mouse, we still
  // wait for more keyboard action (until the field is blurred with keyboard)
  dropdownListToggle = (value, field, mouse) => {
    const { onFocus, onBlur } = this.props;

    this._changeWidgetProperty(field, 'dropdownOpen', value, () => {
      this.setState({
        isDropdownListOpen: value,
      });

      if (mouse) {
        if (value && onFocus) {
          onFocus();
        } else if (!value && onBlur) {
          onBlur();
        }
      }
    });
  };

  widgetTooltipToggle = (field, value) => {
    const curVal = this.getLookupWidget(field).tooltipOpen;
    const newVal = value != null ? value : !curVal;

    this._changeWidgetProperty(field, 'tooltipOpen', newVal);
  };

  resetLocalClearing = () => {
    // TODO: Rewrite per widget if needed
    this.setState({
      localClearing: false,
    });
  };

  handleClickOutside = () => {
    const { onClickOutside } = this.props;
    const { isDropdownListOpen, isFocused } = this.state;

    if (isDropdownListOpen || isFocused) {
      this.setState(
        {
          isDropdownListOpen: false,
          isFocused: false,
          lookupWidgets: this.rawLookupsState,
          property: '',
        },
        () => {
          onClickOutside && onClickOutside();
        }
      );
    }
  };

  handleInputEmptyStatus = isEmpty => {
    this.setState({
      isInputEmpty: isEmpty,
    });
  };

  // TODO: Rewrite per widget if needed
  handleClear = () => {
    const { onChange, properties, onSelectBarcode } = this.props;
    const propsWithoutTooltips = properties.filter(
      prop => prop.type !== 'Tooltip'
    );
    const onChangeResp =
      onChange && onChange(propsWithoutTooltips, null, false);

    if (onChangeResp && onChangeResp.then) {
      onChangeResp.then(resp => {
        if (resp) {
          onSelectBarcode && onSelectBarcode(null);

          this.setState({
            isInputEmpty: true,
            property: '',
            initialFocus: true,
            localClearing: true,
            autofocusDisabled: false,
          });
        }
      });
    }
  };

  handleListFocus = field => {
    this._changeWidgetProperty(field, 'isFocused', true, () => {
      this.setState({
        isFocused: true,
      });
      this.props.onFocus();
    });
  };

  handleListBlur = field => {
    this._changeWidgetProperty(field, 'isFocused', false, () => {
      this.setState({
        isFocused: false,
      });
      this.props.onBlur();
    });
  };

  disableAutofocus = () => {
    this.setState({
      autofocusDisabled: true,
    });
  };

  enableAutofocus = () => {
    this.setState({
      autofocusDisabled: false,
    });
  };

  renderInputControls = showBarcodeScanner => {
    const { onScanBarcode } = this.props;
    const { isInputEmpty } = this.state;

    return (
      <div
        className="input-icon input-icon-lg lookup-widget-wrapper"
        onClick={null}
      >
        {showBarcodeScanner ? (
          <button
            className="btn btn-sm btn-meta-success btn-scanner"
            onClick={() => onScanBarcode(true)}
          >
            {counterpart.translate('widget.scanFromCamera.caption')}
          </button>
        ) : null}
        <i
          className={classnames({
            'meta-icon-close-alt': !isInputEmpty,
            'meta-icon-preview': isInputEmpty,
          })}
          onClick={!isInputEmpty ? this.handleClear : null}
        />
      </div>
    );
  };

  render() {
    const {
      rank,
      readonly,
      widgetData,
      placeholder,
      align,
      isModal,
      updated,
      filterWidget,
      mandatory,
      rowId,
      tabIndex,
      validStatus,
      recent,
      onChange,
      newRecordCaption,
      properties,
      windowType,
      parameterName,
      entity,
      dataId,
      tabId,
      subentity,
      subentityId,
      viewId,
      autoFocus,
      newRecordWindowId,
      scanning,
      codeSelected,
      scannerElement,
      forceFullWidth,
      forceHeight,
    } = this.props;

    const {
      isInputEmpty,
      property,
      initialFocus,
      localClearing,
      fireDropdownList,
      autofocusDisabled,
    } = this.state;

    const mandatoryInputCondition =
      mandatory &&
      (isInputEmpty ||
        (validStatus && validStatus.initialValue && !validStatus.valid));

    const errorInputCondition =
      validStatus && (!validStatus.valid && !validStatus.initialValue);
    const classRank = rank || 'primary';
    let showBarcodeScannerBtn = false;

    this.linkedList = [];

    if (scanning) {
      return (
        <div className="overlay-field js-not-unselect">{scannerElement}</div>
      );
    }

    return (
      <div
        ref={c => (this.dropdown = c)}
        className={classnames(
          'input-dropdown-container lookup-wrapper',
          `input-${classRank}`,
          {
            'pulse-on': updated,
            'pulse-off': !updated,
            'input-full': filterWidget,
            'input-mandatory': mandatoryInputCondition,
            'input-error': errorInputCondition,
            'lookup-wrapper-disabled': readonly,
          }
        )}
      >
        {properties &&
          properties.map((item, index) => {
            // if (index < 2 && this.props.properties[0].field === "C_BPartner_ID") {
            // TODO: This is really not how we should be doing this. Backend should send
            // us info which fields are usable with barcode scanner
            showBarcodeScannerBtn = item.field === 'M_LocatorTo_ID';

            const lookupWidget = this.getLookupWidget(item.field);
            const disabled = isInputEmpty && index !== 0;
            const itemByProperty = getItemsByProperty(
              widgetData,
              'field',
              item.field
            )[0];
            const widgetTooltipToggled = lookupWidget.tooltipOpen;
            const idValue = `lookup_${item.field}`;

            if (item.type === 'Tooltip') {
              if (!itemByProperty.value) {
                return null;
              }

              return (
                <div
                  key={item.field}
                  id={idValue}
                  className="lookup-widget-wrapper lookup-tooltip"
                >
                  <WidgetTooltip
                    widget={item}
                    data={itemByProperty}
                    isToggled={widgetTooltipToggled}
                    onToggle={val => this.widgetTooltipToggle(item.field, val)}
                  />
                </div>
              );
            } else if (
              item.source === 'lookup' ||
              item.widgetType === 'Lookup' ||
              (itemByProperty && itemByProperty.widgetType === 'Lookup')
            ) {
              let defaultValue = localClearing ? null : itemByProperty.value;

              if (codeSelected) {
                defaultValue = { caption: codeSelected };
              }

              let width = null;
              // for multiple lookup widget we want the dropdown
              // to be full width of the widget component
              if (forceFullWidth && this.dropdown) {
                width = this.dropdown.offsetWidth;
              }

              return (
                <RawLookup
                  key={index}
                  idValue={idValue}
                  defaultValue={defaultValue}
                  autoFocus={index === 0 && autoFocus}
                  initialFocus={index === 0 && initialFocus}
                  mainProperty={[item]}
                  readonly={widgetData[index].readonly}
                  mandatory={widgetData[index].mandatory}
                  resetLocalClearing={this.resetLocalClearing}
                  setNextProperty={this.setNextProperty}
                  lookupEmpty={isInputEmpty}
                  fireDropdownList={fireDropdownList}
                  handleInputEmptyStatus={
                    index === 0 && this.handleInputEmptyStatus
                  }
                  enableAutofocus={this.enableAutofocus}
                  isOpen={lookupWidget.dropdownOpen}
                  onDropdownListToggle={(val, mouse) => {
                    this.dropdownListToggle(val, item.field, mouse);
                  }}
                  forcedWidth={width}
                  forceHeight={forceHeight}
                  parentElement={forceFullWidth && this.dropdown}
                  {...{
                    placeholder,
                    tabIndex,
                    windowType,
                    parameterName,
                    entity,
                    dataId,
                    isModal,
                    recent,
                    rank,
                    updated,
                    filterWidget,
                    validStatus,
                    align,
                    onChange,
                    item,
                    disabled,
                    viewId,
                    subentity,
                    subentityId,
                    tabId,
                    rowId,
                    newRecordCaption,
                    newRecordWindowId,
                    localClearing,
                  }}
                />
              );
            } else if (
              item.source === 'list' ||
              item.widgetType === 'List' ||
              (itemByProperty && itemByProperty.source === 'List')
            ) {
              const isFirstProperty = index === 0;
              const isCurrentProperty =
                item.field === property && !autofocusDisabled;
              let defaultValue = localClearing ? null : itemByProperty.value;

              return (
                <div
                  key={item.field}
                  id={idValue}
                  className={classnames(
                    'lookup-widget-wrapper lookup-widget-wrapper-bcg',
                    {
                      'raw-lookup-disabled': disabled || readonly,
                      focused: this.getFocused(item.field),
                    }
                  )}
                >
                  <List
                    ref={c => {
                      if (c) {
                        this.linkedList.push(c);
                      }
                    }}
                    field={item.field}
                    clearable={false}
                    readonly={disabled || widgetData[index].readonly}
                    lookupList={true}
                    autoFocus={isCurrentProperty}
                    doNotOpenOnFocus={false}
                    properties={item}
                    mainProperty={item}
                    defaultValue={defaultValue ? defaultValue : ''}
                    initialFocus={isFirstProperty ? initialFocus : false}
                    emptyText={placeholder}
                    mandatory={widgetData[index].mandatory}
                    setNextProperty={this.setNextProperty}
                    disableAutofocus={this.disableAutofocus}
                    enableAutofocus={this.enableAutofocus}
                    onFocus={this.handleListFocus}
                    onBlur={this.handleListBlur}
                    {...{
                      dataId,
                      entity,
                      windowType,
                      filterWidget,
                      tabId,
                      rowId,
                      subentity,
                      subentityId,
                      viewId,
                      onChange,
                      isInputEmpty,
                      property,
                      tabIndex,
                    }}
                  />
                </div>
              );
            }
          })}

        {!readonly && this.renderInputControls(showBarcodeScannerBtn)}
      </div>
    );
  }
}

Lookup.propTypes = {
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onBlurWidget: PropTypes.func,
  forceFullWidth: PropTypes.bool,
  forceHeight: PropTypes.number,
  widgetData: PropTypes.array,
  defaultValue: PropTypes.any,
  selected: PropTypes.any,
  mandatory: PropTypes.bool,
};

export default connect()(BarcodeScanner(onClickOutside(Lookup)));
