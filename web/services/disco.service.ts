import { IPaymentProduct } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class DiscoService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listProducts(workspaceSlug: string): Promise<IPaymentProduct[]> {
    return this.get(`/api/payments/workspaces/${workspaceSlug}/products/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  getPaymentLink(workspaceSlug: string, data = {}) {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/payment-link/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
