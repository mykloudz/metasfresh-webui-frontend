import PropTypes from 'prop-types';
import { push } from 'react-router-redux';
import { Map } from 'immutable';
import Moment from 'moment';
import { DateTime } from 'luxon';
// import { isLuxonObject } from './index';
import { getItemsByProperty, nullToEmptyStrings } from './index';
import { getSelection, getSelectionInstant } from '../reducers/windowHandler';

const DLpropTypes = {
  // from parent
  windowType: PropTypes.string.isRequired,

  // from <DocList>
  updateParentSelectedIds: PropTypes.func,

  // from @connect
  dispatch: PropTypes.func.isRequired,
  selections: PropTypes.object.isRequired,
  childSelected: PropTypes.array.isRequired,
  parentSelected: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  isModal: PropTypes.bool,
};

const DLcontextTypes = {
  store: PropTypes.object.isRequired,
};

const DLmapStateToProps = (state, props) => ({
  selections: state.windowHandler.selections,
  selected: getSelectionInstant(
    state,
    { ...props, windowId: props.windowType, viewId: props.defaultViewId },
    state.windowHandler.selectionsHash
  ),
  childSelected:
    props.includedView && props.includedView.windowType
      ? getSelection({
          state,
          windowType: props.includedView.windowType,
          viewId: props.includedView.viewId,
        })
      : NO_SELECTION,
  parentSelected: props.parentWindowType
    ? getSelection({
        state,
        windowType: props.parentWindowType,
        viewId: props.parentDefaultViewId,
      })
    : NO_SELECTION,
  modal: state.windowHandler.modal,
});

const NO_SELECTION = [];
const NO_VIEW = {};
const PANEL_WIDTHS = ['1', '.2', '4'];

const filtersToMap = function(filtersArray) {
  let filtersMap = Map();

  if (filtersArray && filtersArray.length) {
    filtersArray.forEach(filter => {
      filtersMap = filtersMap.set(filter.filterId, filter);
    });
  }
  return filtersMap;
};

const doesSelectionExist = function({
  data,
  selected,
  hasIncluded = false,
} = {}) {
  // When the rows are changing we should ensure
  // that selection still exist
  if (hasIncluded) {
    return true;
  }

  if (selected && selected[0] === 'all') {
    return true;
  }

  let rows = [];

  data &&
    data.result &&
    data.result.map(item => {
      rows = rows.concat(mapIncluded(item));
    });

  return (
    data &&
    data.size &&
    data.result &&
    selected &&
    selected[0] &&
    getItemsByProperty(rows, 'id', selected[0]).length
  );
};

const redirectToNewDocument = (dispatch, windowType) => {
  dispatch(push(`/window/${windowType}/new`));
};

const getSortingQuery = (asc, field) => (asc ? '+' : '-') + field;

export {
  DLpropTypes,
  DLcontextTypes,
  DLmapStateToProps,
  NO_SELECTION,
  NO_VIEW,
  PANEL_WIDTHS,
  getSortingQuery,
  redirectToNewDocument,
  filtersToMap,
  doesSelectionExist,
};

// ROWS UTILS

export function mergeColumnInfosIntoViewRows(columnInfosByFieldName, rows) {
  if (!columnInfosByFieldName) {
    return rows;
  }

  return rows.map(row =>
    mergeColumnInfosIntoViewRow(columnInfosByFieldName, row)
  );
}

function mergeColumnInfosIntoViewRow(columnInfosByFieldName, row) {
  const fieldsByName = Object.values(row.fieldsByName)
    .map(viewRowField =>
      mergeColumnInfoIntoViewRowField(
        columnInfosByFieldName[viewRowField.field],
        viewRowField
      )
    )
    .reduce((acc, viewRowField) => {
      acc[viewRowField.field] = viewRowField;
      return acc;
    }, {});

  return Object.assign({}, row, { fieldsByName });
}

function mergeColumnInfoIntoViewRowField(columnInfo, viewRowField) {
  if (!columnInfo) {
    return viewRowField;
  }

  if (columnInfo.widgetType) {
    viewRowField['widgetType'] = columnInfo.widgetType;
  }

  // NOTE: as discussed with @metas-mk, at the moment we cannot apply the maxPrecision per page,
  // because it would puzzle the user.
  // if (columnInfo.maxPrecision && columnInfo.maxPrecision > 0) {
  //   viewRowField["precision"] = columnInfo.maxPrecision;
  // }

  return viewRowField;
}

function indexRows(rows, map) {
  for (const row of rows) {
    const { id, includedDocuments } = row;

    map[id] = row;

    if (includedDocuments) {
      indexRows(includedDocuments, map);
    }
  }

  return map;
}

function mapRows(rows, map, columnInfosByFieldName) {
  return rows.map(row => {
    const { id, includedDocuments } = row;

    if (includedDocuments) {
      row.includedDocuments = mapRows(
        includedDocuments,
        map,
        columnInfosByFieldName
      );
    }

    const entry = map[id];

    if (entry) {
      return mergeColumnInfosIntoViewRow(columnInfosByFieldName, entry);
    } else {
      return row;
    }
  });
}

export function removeRows(rowsList, changedRows) {
  const removedRows = [];

  changedRows.forEach(id => {
    const idx = rowsList.findIndex(row => row.id === id);

    if (idx !== -1) {
      rowsList = rowsList.delete(idx);
      removedRows.push(id);
    }
  });

  return {
    rows: rowsList,
    removedRows,
  };
}

export function mergeRows({
  toRows,
  fromRows,
  columnInfosByFieldName = {},
  changedIds,
}) {
  if (!fromRows && !changedIds) {
    return {
      rows: toRows,
      removedRows: [],
    };
  } else if (!fromRows.length) {
    return removeRows(toRows, changedIds);
  }

  const fromRowsById = indexRows(fromRows, {});

  return {
    rows: mapRows(toRows, fromRowsById, columnInfosByFieldName),
    removedRows: [],
  };
}

export function getScope(isModal) {
  return isModal ? 'modal' : 'master';
}

export function parseToDisplay(fieldsByName) {
  return parseDateToReadable(nullToEmptyStrings(fieldsByName));
}

// i.e 2018-01-27T17:00:00.000-06:00
export function parseDateWithCurrenTimezone(value) {
  if (value) {
    let luxonOffset = 0;

    if (!Moment.isMoment(value)) {
      if (value instanceof Date) {
        luxonOffset = DateTime.fromISO(value.toISOString()).offset;
      } else {
        luxonOffset = DateTime.fromISO(value).offset;
      }

      value = Moment(value);
    } else {
      luxonOffset = DateTime.fromISO(value.toISOString()).offset;
    }

    value.utcOffset(luxonOffset);

    return value;
  }
  return '';
}

function parseDateToReadable(fieldsByName) {
  const dateParse = ['Date', 'DateTime', 'Time'];

  return Object.keys(fieldsByName).reduce((acc, fieldName) => {
    const field = fieldsByName[fieldName];
    const isDateField = dateParse.indexOf(field.widgetType) > -1;
    acc[fieldName] =
      isDateField && field.value
        ? {
            ...field,
            value: parseDateWithCurrenTimezone(field.value),
          }
        : field;
    return acc;
  }, {});
}

/**
 * flatten array with 1 level deep max(with fieldByName)
 * from includedDocuments data
 */
export function getRowsData(rowData) {
  let data = [];
  rowData &&
    rowData.map(item => {
      data = data.concat(mapIncluded(item));
    });

  return data;
}

export function mapIncluded(node, indent, isParentLastChild = false) {
  let ind = indent ? indent : [];
  let result = [];

  const nodeCopy = {
    ...node,
    indent: ind,
  };

  result = result.concat([nodeCopy]);

  if (isParentLastChild) {
    ind[ind.length - 2] = false;
  }

  if (node.includedDocuments) {
    for (let i = 0; i < node.includedDocuments.length; i++) {
      let copy = node.includedDocuments[i];
      copy.fieldsByName = parseToDisplay(copy.fieldsByName);
      if (i === node.includedDocuments.length - 1) {
        copy = {
          ...copy,
          lastChild: true,
        };
      }

      result = result.concat(
        mapIncluded(copy, ind.concat([true]), node.lastChild)
      );
    }
  }
  return result;
}

export function collapsedMap(node, isCollapsed, initialMap) {
  let collapsedMap = [];
  if (initialMap) {
    if (!isCollapsed) {
      initialMap.splice(
        initialMap.indexOf(node.includedDocuments[0]),
        node.includedDocuments.length
      );
      collapsedMap = initialMap;
    } else {
      initialMap.map(item => {
        collapsedMap.push(item);
        if (item.id === node.id) {
          collapsedMap = collapsedMap.concat(node.includedDocuments);
        }
      });
    }
  } else {
    if (node.includedDocuments) {
      collapsedMap.push(node);
    }
  }

  return collapsedMap;
}
