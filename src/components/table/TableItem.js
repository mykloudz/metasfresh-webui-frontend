import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { merge } from 'lodash';

import {
  VIEW_EDITOR_RENDER_MODES_ALWAYS,
  VIEW_EDITOR_RENDER_MODES_ON_DEMAND,
} from '../../constants/Constants';
import TableCell from './TableCell';
import { shouldRenderColumn } from '../../utils/tableHelpers';
import { WithMobileDoubleTap } from '../WithMobileDoubleTap';

class TableItem extends PureComponent {
  constructor(props) {
    super(props);

    const multilineText = props.cols.filter(item => item.multilineText === true)
      .length;

    let multilineTextLines = 0;
    props.cols.forEach(col => {
      if (
        col.multilineTextLines &&
        col.multilineTextLines > multilineTextLines
      ) {
        multilineTextLines = col.multilineTextLines;
      }
    });

    this.state = {
      edited: '',
      activeCell: '',
      updatedRow: false,
      listenOnKeys: true,
      editedCells: {},
      multilineText,
      multilineTextLines,
    };
  }

  componentDidUpdate(prevProps) {
    const { multilineText } = this.state;

    if (multilineText && this.props.isSelected !== prevProps.isSelected) {
      this.handleCellExtend();
    }

    if (this.props.dataHash !== prevProps.dataHash) {
      this.setState({
        editedCells: {},
      });
    }
  }

  componentDidMount() {
    const { focusOnFieldName, isSelected } = this.props;

    if (focusOnFieldName && isSelected && this.autofocusCell) {
      // eslint-disable-next-line react/no-find-dom-node
      ReactDOM.findDOMNode(this.autofocusCell).focus();
    }
  }

  initPropertyEditor = fieldName => {
    const { cols, fieldsByName } = this.props;

    if (cols && fieldsByName) {
      cols.map(item => {
        const property = item.fields[0].field;
        if (property === fieldName) {
          const widgetData = this.prepareWidgetData(item);

          if (widgetData) {
            this.handleEditProperty(null, property, true, widgetData[0]);
          }
        }
      });
    }
  };

  handleDoubleClick = () => {
    const { rowId, onDoubleClick, supportOpenRecord } = this.props;

    if (supportOpenRecord) {
      onDoubleClick && onDoubleClick(rowId);
    }
  };

  handleKeyDown = (e, property, widgetData) => {
    const { changeListenOnTrue } = this.props;
    const { listenOnKeys, edited } = this.state;

    switch (e.key) {
      case 'Enter':
        if (listenOnKeys) {
          this.handleEditProperty(e, property, true, widgetData);
        }
        break;
      case 'Tab':
      case 'Escape':
        if (edited === property) {
          e.stopPropagation();
          this.handleEditProperty(e);
          changeListenOnTrue();
        }
        break;
    }
  };

  handleEditProperty = (e, property, callback, item) => {
    const { activeCell } = this.state;
    const elem = document.activeElement;

    if (activeCell !== elem && !elem.className.includes('js-input-field')) {
      this.setState({
        activeCell: elem,
      });
    }

    this.editProperty(e, property, callback, item);
  };

  prepareWidgetData = item => {
    const { fieldsByName } = this.props;
    const widgetData = item.fields.map(prop => fieldsByName[prop.field]);

    return widgetData;
  };

  editProperty = (e, property, callback, item) => {
    if (item ? !item.readonly : true) {
      if (this.state.edited === property) e.stopPropagation();

      this.setState(
        {
          edited: property,
        },
        () => {
          if (callback) {
            const elem = document.activeElement.getElementsByClassName(
              'js-input-field'
            )[0];

            if (elem) {
              elem.focus();
            }

            const disabled = document.activeElement.querySelector(
              '.input-disabled'
            );
            const readonly = document.activeElement.querySelector(
              '.input-readonly'
            );

            if (disabled || readonly) {
              this.listenOnKeysTrue();
              this.handleEditProperty(e);
            } else {
              this.listenOnKeysFalse();
            }
          }
        }
      );
    }
  };

  listenOnKeysTrue = () => {
    const { changeListenOnTrue } = this.props;

    this.setState({
      listenOnKeys: true,
    });
    changeListenOnTrue();
  };

  listenOnKeysFalse = () => {
    const { changeListenOnFalse } = this.props;

    this.setState({
      listenOnKeys: false,
    });
    changeListenOnFalse();
  };

  closeTableField = e => {
    const { activeCell } = this.state;

    this.handleEditProperty(e);
    this.listenOnKeysTrue();

    activeCell && activeCell.focus();
  };

  isAllowedFieldEdit = item => {
    return item.viewEditorRenderMode === VIEW_EDITOR_RENDER_MODES_ON_DEMAND;
  };

  onCellChange = (rowId, property, value, ret) => {
    const { onItemChange } = this.props;
    const editedCells = { ...this.state.editedCells };

    // this is something we're not doing usually as all field
    // layouts come from the server. But in cases of modals
    // sometimes we need to modify the state of fields that are displayed
    // for instance to show/hide them
    if (ret) {
      ret.then(resp => {
        if (resp[0] && resp[0].fieldsByName) {
          const fields = resp[0].fieldsByName;

          for (let [k, v] of Object.entries(fields)) {
            editedCells[k] = v;
          }
        }

        this.setState(
          {
            editedCells,
          },
          () => onItemChange(rowId, property, value)
        );
      });
    } else {
      onItemChange(rowId, property, value);
    }
  };

  handleClick = e => {
    const { onClick, item } = this.props;

    onClick(e, item);
  };

  handleClickOutside = e => {
    const { changeListenOnTrue } = this.props;
    this.handleEditProperty(e);
    changeListenOnTrue();
  };

  handleCellExtend = () => {
    this.setState({
      cellsExtended: !this.state.cellsExtended,
    });
  };

  getWidgetData = (item, isEditable, supportFieldEdit) => {
    const { fieldsByName } = this.props;
    const { editedCells } = this.state;
    const cells = merge({}, fieldsByName, editedCells);

    const widgetData = item.fields.reduce((result, prop) => {
      if (cells) {
        let cellWidget = cells[prop.field] || null;

        if (
          isEditable ||
          (supportFieldEdit && typeof cellWidget === 'object')
        ) {
          cellWidget = {
            ...cellWidget,
            widgetType: item.widgetType,
            displayed: true,
            readonly: false,
          };
        }

        if (cellWidget) {
          result.push(cellWidget);
        }
      }
      return result;
    }, []);

    if (widgetData.length) {
      return widgetData;
    }

    return [{}];
  };

  renderCells = () => {
    const {
      cols,
      fieldsByName,
      windowId,
      docId,
      rowId,
      tabId,
      mainTable,
      newRow,
      tabIndex,
      entity,
      getSizeClass,
      handleRightClick,
      caption,
      colspan,
      viewId,
      keyProperty,
      isSelected,
      focusOnFieldName,
    } = this.props;
    const {
      edited,
      updatedRow,
      listenOnKeys,
      editedCells,
      cellsExtended,
      multilineText,
      multilineTextLines,
    } = this.state;
    const cells = merge({}, fieldsByName, editedCells);

    // Iterate over layout settings
    if (colspan) {
      return <td colSpan={cols.length}>{caption}</td>;
    } else {
      return (
        cols &&
        cols.map(item => {
          if (shouldRenderColumn(item)) {
            const { supportZoomInto } = item.fields[0];
            const supportFieldEdit = mainTable && this.isAllowedFieldEdit(item);
            const property = item.fields[0].field;
            let isEditable =
              (cells &&
                cells[property] &&
                cells[property].viewEditorRenderMode ===
                  VIEW_EDITOR_RENDER_MODES_ALWAYS) ||
              item.viewEditorRenderMode === VIEW_EDITOR_RENDER_MODES_ALWAYS;
            const isEdited = edited === property;
            const extendLongText = multilineText ? multilineTextLines : 0;

            isEditable = item.widgetType === 'Color' ? false : isEditable;

            const widgetData = this.getWidgetData(
              item,
              isEditable,
              supportFieldEdit
            );

            return (
              <TableCell
                {...{
                  getSizeClass,
                  entity,
                  windowId,
                  docId,
                  rowId,
                  tabId,
                  item,
                  tabIndex,
                  listenOnKeys,
                  caption,
                  mainTable,
                  viewId,
                  extendLongText,
                  property,
                  isEditable,
                  supportZoomInto,
                  supportFieldEdit,
                  handleRightClick,
                  keyProperty,
                }}
                ref={c => {
                  if (c && isSelected && focusOnFieldName === property) {
                    this.autofocusCell = c;
                  }
                }}
                tdValue={
                  widgetData[0].value
                    ? JSON.stringify(widgetData[0].value)
                    : null
                }
                getWidgetData={this.getWidgetData}
                cellExtended={cellsExtended}
                key={`${rowId}-${property}`}
                isRowSelected={isSelected}
                isEdited={isEdited}
                handleDoubleClick={this.handleEditProperty}
                onClickOutside={this.handleClickOutside}
                onCellChange={this.onCellChange}
                onCellExtend={this.handleCellExtend}
                updatedRow={updatedRow || newRow}
                updateRow={this.updateRow}
                handleKeyDown={this.handleKeyDown}
                listenOnKeysTrue={this.listenOnKeysTrue}
                listenOnKeysFalse={this.listenOnKeysFalse}
                closeTableField={this.closeTableField}
              />
            );
          }
        })
      );
    }
  };

  updateRow = () => {
    this.setState(
      {
        updatedRow: true,
      },
      () => {
        setTimeout(() => {
          this.setState({
            updatedRow: false,
          });
        }, 1000);
      }
    );
  };

  nestedSelect = (elem, cb) => {
    let res = [];

    elem &&
      elem.map(item => {
        res = res.concat([item.id]);

        if (item.includedDocuments) {
          res = res.concat(this.nestedSelect(item.includedDocuments));
        } else {
          cb && cb();
        }
      });

    return res;
  };

  handleIndentSelect = (e, id, elem) => {
    const { handleSelect } = this.props;
    e.stopPropagation();
    handleSelect(this.nestedSelect(elem).concat([id]));
  };

  getIconClassName = huType => {
    switch (huType) {
      case 'LU':
        return 'meta-icon-pallete';
      case 'TU':
        return 'meta-icon-package';
      case 'CU':
        return 'meta-icon-product';
      case 'PP_Order_Receive':
        return 'meta-icon-receipt';
      case 'PP_Order_Issue':
        return 'meta-icon-issue';
      case 'M_Picking_Slot':
        // https://github.com/metasfresh/metasfresh/issues/2298
        return 'meta-icon-beschaffung';
    }
  };

  renderTree = huType => {
    const {
      indent,
      lastChild,
      includedDocuments,
      rowId,
      collapsed,
      handleRowCollapse,
      collapsible,
    } = this.props;

    let indentation = [];

    for (let i = 0; i < indent.length; i++) {
      indentation.push(
        <div
          key={i}
          className={classnames('indent-item-mid', {
            'indent-collapsible-item-mid': collapsible,
          })}
        >
          {i === indent.length - 1 && <div className="indent-mid" />}
          <div
            className={classnames({
              'indent-sign': indent[i],
              'indent-sign-bot': lastChild && i === indent.length - 1,
            })}
          />
        </div>
      );
    }

    return (
      <div className={'indent'}>
        {indentation}
        {includedDocuments && !collapsed && (
          <div
            className={classnames('indent-bot', {
              'indent-collapsible-bot': collapsible,
            })}
          />
        )}
        {includedDocuments && collapsible ? (
          collapsed ? (
            <i
              onClick={handleRowCollapse}
              className="meta-icon-plus indent-collapse-icon"
            />
          ) : (
            <i
              onClick={handleRowCollapse}
              className="meta-icon-minus indent-collapse-icon"
            />
          )
        ) : (
          ''
        )}
        <div
          className="indent-icon"
          onClick={e => this.handleIndentSelect(e, rowId, includedDocuments)}
        >
          <i className={this.getIconClassName(huType)} />
        </div>
      </div>
    );
  };

  render() {
    const {
      key,
      isSelected,
      odd,
      indentSupported,
      indent,
      contextType,
      lastChild,
      processed,
      includedDocuments,
      notSaved,
      caption,
    } = this.props;

    return (
      <WithMobileDoubleTap>
        <tr
          key={key}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}
          className={classnames({
            'row-selected': isSelected,
            'tr-odd': odd,
            'tr-even': !odd,
            'row-disabled': processed,
            'row-boundary': processed && lastChild && !includedDocuments,
            'row-not-saved': notSaved,
            'item-caption': caption,
          })}
        >
          {indentSupported && indent && (
            <td className="indented">{this.renderTree(contextType)}</td>
          )}
          {this.renderCells()}
        </tr>
      </WithMobileDoubleTap>
    );
  }
}

TableItem.propTypes = {
  cols: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  handleSelect: PropTypes.func,
  onDoubleClick: PropTypes.func,
  indentSupported: PropTypes.bool,
  collapsible: PropTypes.bool,
  collapsed: PropTypes.bool,
  processed: PropTypes.bool,
  notSaved: PropTypes.bool,
  isSelected: PropTypes.bool,
  odd: PropTypes.number,
  caption: PropTypes.string,
  dataHash: PropTypes.string.isRequired,
  key: PropTypes.string,
};

export default connect(
  false,
  false,
  false,
  { withRef: true }
)(TableItem);
