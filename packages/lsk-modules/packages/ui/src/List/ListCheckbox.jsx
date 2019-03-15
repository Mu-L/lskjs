import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import Checkbox from 'antd/lib/checkbox';

@inject('selectStore')
@observer
class ListCheckbox extends Component {
  handleClick = () => {
    const { selectStore, item, global } = this.props;
    if (global) {
      selectStore.globalToggle();
    } else {
      selectStore.toggle(item);
    }
  }
  render() {
    const { selectStore, item, global } = this.props;
    return (
      <Checkbox
        indeterminate={global && selectStore.globalIsIndeterminate()}
        checked={global ? selectStore.globalIsChecked() : selectStore.isChecked(item)}
        onClick={this.handleClick}
        style={{ marginBottom: 0 }}
      />
    );
  }
}

export default ListCheckbox;
