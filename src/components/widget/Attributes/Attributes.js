import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';

import { getAttributesInstance, initLayout } from '../../../api';
import { completeRequest, patchRequest } from '../../../actions/GenericActions';
import { parseToDisplay } from '../../../utils/documentListHelper';
import AttributesDropdown from './AttributesDropdown';

/**
 * @file Class based component.
 * @module Attributes
 * @extends Component
 */
export default class Attributes extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dropdown: false,
      layout: null,
      data: null,
      loading: false,
    };
  }

  /**
   * @method handleInit
   * @summary ToDo: Describe the method
   * @todo Write the documentation
   */
  handleInit = () => {
    const {
      docType,
      dataId,
      tabId,
      rowId,
      viewId,
      fieldName,
      attributeType,
      widgetData,
      entity,
    } = this.props;

    const templateId = widgetData.value.key
      ? parseInt(widgetData.value.key, 10) // assume 'value' is a key/caption lookup value
      : parseInt(widgetData.value, 10); // assume 'value' is string or int

    let source;
    if (entity === 'window') {
      source = {
        windowId: docType,
        documentId: dataId,
        tabId: tabId,
        rowId: rowId,
        fieldName: fieldName,
      };
    } else if (entity === 'documentView') {
      source = {
        viewId: viewId,
        rowId: rowId,
        fieldName: fieldName,
      };
    } else if (entity === 'process') {
      source = {
        processId: docType,
        documentId: dataId,
        fieldName: fieldName,
      };
    } else {
      // eslint-disable-next-line no-console
      console.error('Unknown entity: ' + entity);
    }

    this.setState(
      {
        loading: true,
      },
      () => {
        return getAttributesInstance(attributeType, templateId, source)
          .then(response => {
            const { id, fieldsByName } = response.data;

            this.setState({
              data: parseToDisplay(fieldsByName),
            });

            return initLayout(attributeType, id);
          })
          .then(response => {
            const { elements } = response.data;

            this.setState({
              layout: elements,
              loading: false,
            });
          })
          .then(() => {
            this.setState({
              dropdown: true,
            });
          })
          .catch(error => {
            // eslint-disable-next-line no-console
            console.error('Attributes handleInit error: ', error.message);
            this.setState({
              loading: false,
            });
          });
      }
    );
  };

  /**
   * @method handleToggle
   * @summary ToDo: Describe the method
   * @param {*} option
   * @todo Write the documentation
   */
  handleToggle = option => {
    const { handleBackdropLock } = this.props;
    const { loading } = this.state;

    if (!loading) {
      this.setState(
        {
          data: null,
          layout: null,
          dropdown: null,
        },
        () => {
          //Method is disabling outside click in parents
          //elements if there is some
          handleBackdropLock && handleBackdropLock(!!option);

          if (option) {
            this.handleInit();
          }
        }
      );
    }
  };

  /**
   * @method handleKeyDown
   * @summary ToDo: Describe the method
   * @param {object} event
   * @todo Write the documentation
   */
  handleKeyDown = e => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.handleCompletion();
        break;
    }
  };

  /**
   * @method handleChange
   * @summary ToDo: Describe the method
   * @param {*} field
   * @param {*} value
   * @todo Write the documentation
   */
  handleChange = (field, value) => {
    this.setState(prevState => ({
      data: Object.assign({}, prevState.data, {
        [field]: Object.assign({}, prevState.data[field], { value }),
      }),
    }));
  };

  /**
   * @method handlePatch
   * @summary ToDo: Describe the method
   * @param {*} prop
   * @param {*} value
   * @param {*} id
   * @param {func} cb
   * @todo Write the documentation
   */
  handlePatch = (prop, value, id, cb) => {
    const { attributeType, onBlur } = this.props;
    const { data, loading } = this.state;

    if (!loading && data) {
      return patchRequest({
        entity: attributeType,
        docType: null,
        docId: id,
        property: prop,
        value,
      }).then(response => {
        if (response.data && response.data.length) {
          const fields = response.data[0].fieldsByName;

          Object.keys(fields).map(fieldName => {
            this.setState(
              prevState => ({
                data: {
                  ...prevState.data,
                  [fieldName]: {
                    ...prevState.data[fieldName],
                    value,
                  },
                },
              }),
              () => {
                cb && cb();
                onBlur && onBlur();
              }
            );
          });
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });
    }
    return Promise.resolve(true);
  };

  /**
   * @method handleCompletion
   * @summary ToDo: Describe the method
   * @todo Write the documentation
   */
  handleCompletion = () => {
    const { data, loading } = this.state;

    if (!loading && data) {
      const mandatory = Object.keys(data).filter(
        fieldName => data[fieldName].mandatory
      );
      const valid = !mandatory.filter(field => !data[field].value).length;

      //there are required values that are not set. just close
      if (mandatory.length && !valid) {
        if (window.confirm('Do you really want to leave?')) {
          this.handleToggle(false);
        }
        return;
      }

      this.doCompleteRequest();
      this.handleToggle(false);
    }
  };

  /**
   * @method doCompleteRequest
   * @summary ToDo: Describe the method
   * @todo Write the documentation
   */
  doCompleteRequest = () => {
    const { attributeType, patch } = this.props;
    const { data } = this.state;
    const attrId = data && data.ID ? data.ID.value : -1;

    completeRequest(attributeType, attrId).then(response => {
      patch(response.data);
    });
  };

  /**
   * @method render
   * @summary ToDo: Describe the method
   * @todo Write the documentation
   */
  render() {
    const {
      widgetData,
      dataId,
      rowId,
      attributeType,
      tabIndex,
      readonly,
    } = this.props;
    const { dropdown, data, layout } = this.state;
    const { value } = widgetData;
    const label = value.caption;
    const attrId = data && data.ID ? data.ID.value : -1;

    return (
      <div
        onKeyDown={this.handleKeyDown}
        className={classnames('attributes', {
          'attributes-in-table': rowId,
        })}
      >
        <button
          tabIndex={tabIndex}
          onClick={() => this.handleToggle(true)}
          className={classnames(
            'btn btn-block tag tag-lg tag-block tag-secondary pointer',
            {
              'tag-disabled': dropdown,
              'tag-disabled disabled': readonly,
            }
          )}
        >
          {label ? label : 'Edit'}
        </button>
        {dropdown && (
          <AttributesDropdown
            {...this.props}
            attributeType={attributeType}
            dataId={dataId}
            tabIndex={tabIndex}
            onClickOutside={this.handleCompletion}
            data={data}
            layout={layout}
            handlePatch={this.handlePatch}
            handleChange={this.handleChange}
            attrId={attrId}
          />
        )}
      </div>
    );
  }
}

/**
 * @typedef {object} Props Component props
 * @prop {func} patch
 * @prop {func} handleBackdropLock
 * @prop {bool} [isModal]
 * @prop {*} widgetData
 * @prop {*} dataId
 * @prop {*} rowId
 * @prop {*} attributeType
 * @prop {*} tabIndex
 * @prop {*} readonly
 * @prop {*} onBlur
 * @prop {*} docType
 * @prop {*} tabId
 * @prop {*} viewId
 * @prop {*} fieldName
 * @prop {*} entity
 * @todo Check props. Which proptype? Required or optional?
 */
Attributes.propTypes = {
  patch: PropTypes.func.isRequired,
  handleBackdropLock: PropTypes.func,
  isModal: PropTypes.bool,
  widgetData: PropTypes.any,
  dataId: PropTypes.any,
  rowId: PropTypes.any,
  attributeType: PropTypes.any,
  tabIndex: PropTypes.any,
  readonly: PropTypes.any,
  onBlur: PropTypes.any,
  docType: PropTypes.any,
  tabId: PropTypes.any,
  viewId: PropTypes.any,
  fieldName: PropTypes.any,
  entity: PropTypes.any,
};
