import { Controller, Get } from '@nestjs/common';
import { CURRENCIES } from '../../../common/constants/currency-codes';

/** Public lookup endpoint — no auth required; currency data is not sensitive. */
@Controller('currencies')
export class CurrenciesController {
  @Get()
  findAll() {
    return CURRENCIES;
  }
}
