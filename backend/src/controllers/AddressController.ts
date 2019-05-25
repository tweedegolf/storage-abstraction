import {
  Controller, Get, Required, PathParams
} from '@tsed/common';
import axios from 'axios';
import { getConnection } from 'typeorm';
import { Address } from '../entities/Address';

@Controller('/address')
export class AddressController {

  @Get('/:code')
  @Get('/:code/:number')
  @Get('/:code/:number/:addition')
  public async getLabelAddition(
    @Required @PathParams('code') code: string,
    @Required @PathParams('number') number: string,
    @PathParams('addition') addition: string,
  ) {
    return await getAddress(code, number, addition);
  }
}

export const getAddress = async (code: string, number: string, addition: string | undefined): Promise<Address | Error> => {
  const addressRepo = getConnection('tg').getRepository(Address);
  const address = await addressRepo.findOne({
    postalCode: code,
    houseNumber: parseInt(number),
    houseNumberAddition: typeof addition === 'undefined' ? null : addition,
  });
  if (typeof address !== 'undefined') {
    address.timesRequested = address.timesRequested + 1;
    await addressRepo.save(address);
    return address;
  }

  const url = typeof number === 'undefined' ?
    `https://api.postcodeapi.nu/v2/addresses/?postcode=${code}` :
    `https://api.postcodeapi.nu/v2/addresses/?postcode=${code}&number=${number}`

  const options = {
    headers: {
      'X-Api-Key': 'dUW2QtVd6Da7dJ8XrR7gJ1dPo20kj4ti9M2RC0AF',
    },
  };
  return axios.get(url, options)
    .then(async response => {
      const { data: { _embedded: { addresses } } } = response;
      if (addresses.length === 0) {
        return {
          stack: 'Not found'
        } as Error;
      }
      let address = addresses[0];
      if (typeof addition !== 'undefined') {
        const filtered = addresses.filter(a => a.letter === addition || a.addition === addition);
        address = filtered[0];
      }
      const result = new Address();
      result.postalCode = code;
      result.houseNumber = parseInt(number, 10);
      result.houseNumberAddition = addition;
      result.street = address.street;
      result.city = address.city.label;
      result.area = address.surface;
      result.year = address.year;
      result.timesRequested = 0;
      await addressRepo.save(result);
      return result;
    })
    .catch((e) => {
      return { stack: e.message || 'Something went wrong' } as Error;
    });
}
