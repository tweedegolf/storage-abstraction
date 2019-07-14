import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownItem, DropdownMenu } from 'reactstrap';

const SelectStorage = (props: {
  types: string[],
  selectedStorageType: string | null
  onSelectStorageType: (type: string) => void,
}) => {
  const [collapsed, openDropdown] = useState(false);
  const handleToggle = () => {
    openDropdown(!collapsed);
  };
  const items = props.types.map((alias, i) => <DropdownItem onClick={(e) => {
    props.onSelectStorageType(alias);
  }} key={`${alias}_${i}`}>{alias}</DropdownItem>);

  const label = props.selectedStorageType === null ? 'select storage type' : props.selectedStorageType;

  return (
    <Dropdown isOpen={collapsed} toggle={handleToggle}>
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
