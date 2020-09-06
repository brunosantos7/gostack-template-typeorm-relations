/* eslint-disable prettier/prettier */
import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const userRecord = await this.customersRepository.findByEmail(email);

    if (userRecord) {
      throw new AppError('Email ja existe');
    }

    return this.customersRepository.create({ email, name });
  }
}

export default CreateCustomerService;
