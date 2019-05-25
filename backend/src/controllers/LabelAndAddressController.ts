import {
  Controller, Get, Required, PathParams
} from '@tsed/common';
import { getAddress } from './AddressController';
import { getLabel } from './LabelController';

@Controller('/label-and-address')
export class LabelAndAddressController {

  @Get('/:code/:number')
  @Get('/:code/:number/:addition')
  public async getLabelAddition(
    @Required @PathParams('code') code: string,
    @Required @PathParams('number') number: string,
    @PathParams('addition') addition: string,
  ) {
    const address = await getAddress(code, number, addition);
    const label = await getLabel(code, number, addition);
    return { address, label };
  }
}

