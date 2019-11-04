/**
 * Filter element displayed inline for frequent filters
 **/
import React, { Component } from 'react';

import RawWidget from '../widget/RawWidget';
import { parseDateWithCurrentTimezone } from '../../utils/documentListHelper';
import { DATE_FIELDS } from '../../constants/Constants';

class InlineFilterItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: props.parentFilter,
    };
  }

  UNSAFE_componentWillMount() {
    this.init();
  }

  UNSAFE_componentWillReceiveProps(props) {
    const { active } = this.props;

    if (JSON.stringify(active) !== JSON.stringify(props.active)) {
      this.init();
    }
  }

  init = () => {
    const { active, parentFilter } = this.props;
    const { filter } = this.state;
    let activeFilter;

    if (active) {
      activeFilter = active.find(
        item => item.filterId === parentFilter.filterId
      );
    }

    if (
      filter.type &&
      activeFilter &&
      activeFilter.parameters &&
      activeFilter.filterId === filter.filterId
    ) {
      activeFilter.parameters.map(item => {
        this.mergeData(
          item.parameterName,
          item.value != null ? item.value : '',
          item.valueTo != null ? item.valueTo : ''
        );
      });
    } else if (filter.parameters) {
      filter.parameters.map(item => {
        this.mergeData(item.parameterName, '');
      });
    }
  };

  setValue = (property, value, id, valueTo) => {
    //TODO: LOOKUPS GENERATE DIFFERENT TYPE OF PROPERTY parameters
    // IT HAS TO BE UNIFIED
    //
    // OVERWORKED WORKAROUND
    if (Array.isArray(property)) {
      property.map(item => {
        this.mergeData(item.parameterName, value, valueTo);
      });
    } else {
      this.mergeData(property, value, valueTo);
    }
  };

  parseDateToReadable = (widgetType, value) => {
    if (DATE_FIELDS.indexOf(widgetType) > -1) {
      return parseDateWithCurrentTimezone(value);
    }
    return value;
  };

  mergeData = (property, value, valueTo) => {
    this.setState(prevState => ({
      filter: Object.assign({}, prevState.filter, {
        parameters: prevState.filter.parameters.map(param => {
          if (param.parameterName === property) {
            return Object.assign({}, param, {
              value: this.parseDateToReadable(param.widgetType, value),
              valueTo: this.parseDateToReadable(param.widgetType, valueTo),
            });
          } else {
            return param;
          }
        }),
      }),
    }));
  };

  handleApply = () => {
    const { applyFilters } = this.props;
    const { filter } = this.state;

    if (filter && !filter.parameters[0].value) {
      return this.handleClear();
    }

    applyFilters(filter);
  };

  handleClear = () => {
    const { clearFilters } = this.props;
    const { filter } = this.state;

    clearFilters(filter);
  };

  render() {
    const { data, id, windowType, onShow, onHide, viewId } = this.props;
    const { filter } = this.state;

    return (
      <RawWidget
        entity="documentView"
        subentity="filter"
        subentityId={filter.filterId}
        handlePatch={this.handleApply}
        handleChange={this.setValue}
        widgetType={data.widgetType}
        fields={[{ ...data, emptyText: data.caption }]}
        type={data.type}
        widgetData={[data]}
        id={id}
        range={data.range}
        caption={data.caption}
        noLabel={true}
        filterWidget={true}
        {...{
          viewId,
          windowType,
          onShow,
          onHide,
        }}
      />
    );
  }
}

export default InlineFilterItem;
