import {
  Controller, Get, Required, PathParams
} from '@tsed/common';
import axios from 'axios';
import { getConnection } from 'typeorm';
import { Label } from '../entities/Label';

@Controller('/label')
export class LabelController {

  @Get('/:code/:number')
  @Get('/:code/:number/:addition')
  public async getLabelAddition(
    @Required @PathParams('code') code: string,
    @Required @PathParams('number') number: string,
    @PathParams('addition') addition: string,
  ) {
    return await getLabel(code, number, addition);
  }
}

const grades = {
  '1': 'A',
  '2': 'A',
  '3': 'A',
  '4': 'A',
  '5': 'B',
  '6': 'C',
  '7': 'D',
  '8': 'E',
  '9': 'F',
  '10': 'G',
};

export const getLabel = async (code: string, number: string, addition: string | undefined): Promise<Label | Error> => {
  const labelRepo = getConnection('tg').getRepository(Label);
  const houseNumberAddition = typeof addition === 'undefined' ? null : addition
  const label = await labelRepo.findOne({
    postalCode: code,
    houseNumber: parseInt(number, 10),
    houseNumberAddition,
  });

  if (typeof label !== 'undefined') {
    label.timesRequested = label.timesRequested + 1;
    await labelRepo.save(label);
    return label;
  }

  return axios({
    method: 'post',
    url: 'https://www.energielabel.nl/api/v1/checkenergylabel',
    data: {
      Postcode: code,
      HouseNr: number,
      HouseNrAddition: addition,
    },
    // transformResponse: [function (data: any) {
    //   // const clone = { ...data };
    //   data.energieklasseField = data.energieklasseField === null ? null : 'B';//grades[data.energieklasseField];
    //   return data;
    // }],
  })
    .then(async response => {
      if (response.data.energieklasseField !== null) {
        const label = new Label();
        ({
          energieklasseField: label.grade,
          epIndexField: label.index,
          isVoorlopigLabelField: label.provisional,
        } = response.data);
        if (label.provisional === false) {
          const [day, month, year] = response.data.geldigTotField.split('-').map((d: string) => parseInt(d, 10));
          label.validThru = new Date(year, month - 1, day);
        } else {
          label.validThru = null;
        }
        label.postalCode = code;
        label.houseNumber = parseInt(number, 10);
        label.houseNumberAddition = houseNumberAddition;
        label.timesRequested = 0;
        label.grade = `${grades[label.grade]} (${label.grade})`;
        await labelRepo.save(label);
        // console.log(label);
        return label;
      }
      return { stack: 'Not found' } as Error;
    })
    .catch((e) => {
      return { stack: e.message } as Error;
    });
}