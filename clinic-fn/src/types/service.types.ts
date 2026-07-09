export interface Service {
  _id: string;
  name: string;
  duration: number;
  price?: number;
  category?: string;
}

export interface Provider {
  _id: string;
  name: string;
  title?: string;
  serviceId?: string | Pick<Service, '_id' | 'name'>;
  serviceName?: string;
}

export interface InsuranceProvider {
  _id: string;
  name: string;
}
