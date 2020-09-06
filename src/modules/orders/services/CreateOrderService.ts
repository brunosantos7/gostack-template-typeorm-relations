/* eslint-disable prettier/prettier */
import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerRecord = await this.customersRepository.findById(customer_id)

    if (!customerRecord) {
      throw new AppError("Cliente nao existe")
    }

    const productsRecords = await this.productsRepository.findAllById(
      products
    )

    if (!productsRecords.length) {
      throw new AppError("Nao foi possivel encontrar os produtos")
    }

    const existingProductsIds = productsRecords.map(product => product.id);
    const productsToCreate = products.filter(product => !existingProductsIds.includes(product.id));

    if (productsToCreate.length) {
      throw new AppError("Nao encontrou algum produto")
    }

    const productsWithNoQuantitiesAvailable = products.filter(product => productsRecords.filter(p => p.id === product.id)[0].quantity < product.quantity);

    if (productsWithNoQuantitiesAvailable.length) {
      throw new AppError("Produto nao tem quantidade suficiente")
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsRecords.filter(p => p.id === product.id)[0].price
    }))

    const order = await this.ordersRepository.create({
      customer: customerRecord,
      products: serializedProducts
    })
    console.log("CRIOU aqui")

    const { order_products } = order;

    const orderedProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity: productsRecords.filter(p => p.id === product.product_id)[0].quantity - product.quantity
    }))

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
