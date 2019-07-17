import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownItem, DropdownMenu } from 'reactstrap';

const SelectStorage = (props: {
  types: string[],
  selectedStorageId: string | null
  onSelectStorageType: (type: string) => void,
}) => {
  const [collapsed, openDropdown] = useState(false);
  const handleToggle = () => {
    openDropdown(!collapsed);
  };

  if (props.types.length <= 1) {
    return null;
  }

  const items = props.types.map((alias, i) => <DropdownItem onClick={(e) => {
    if (alias !== props.selectedStorageId) {
      props.onSelectStorageType(alias);
    }
  }} key={`${alias}_${i}`}>{alias}</DropdownItem>);

  const label = props.selectedStorageId === null ? 'select storage type' : props.selectedStorageId;

  return (
    <Dropdown className="topmenuitem" isOpen={collapsed} toggle={handleToggle}>
      <DropdownToggle caret>
        {label}
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>available types:</DropdownItem>
        {items}
      </DropdownMenu>
    </Dropdown>
  );
};

export { SelectStorage };
