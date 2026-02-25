import axios from "axios";

const KIWIFY_API_URL = "https://api.kiwify.com.br";

interface KiwifyUser {
  id: string;
  email: string;
  name: string;
  status: "active" | "inactive";
  products: string[];
}

export async function createKiwifyService() {
  const clientSecret = process.env.KIWIFY_CLIENT_SECRET;
  const clientId = process.env.KIWIFY_CLIENT_ID;
  const accountId = process.env.KIWIFY_ACCOUNT_ID;
  
  const hasKiwifyConfig = clientSecret && clientId && accountId;

  if (!hasKiwifyConfig) {
    console.warn("⚠️ Kiwify credentials not fully configured. Using development mode.");
  }

  return {
    async validateCustomer(email: string, productId: string): Promise<boolean> {
      try {
        const normalizedEmail = email.toLowerCase();

        const response = await axios.get(`${KIWIFY_API_URL}/customers`, {
          headers: {
            Authorization: `Bearer ${clientSecret}`,
          },
          params: { email: normalizedEmail },
        });

        if (!response.data?.data?.length) {
          return false;
        }

        const customer = response.data.data[0];
        
        if (customer.status !== "active") {
          return false;
        }

        const hasPurchase = await this.checkPurchase(customer.id, productId);
        return hasPurchase;
      } catch (error) {
        console.error("❌ Error validating customer with Kiwify:", error);
        throw new Error("Erro ao validar cliente");
      }
    },

    async checkPurchase(customerId: string, productId: string): Promise<boolean> {
      try {
        const response = await axios.get(
          `${KIWIFY_API_URL}/customers/${customerId}/purchases`,
          {
            headers: {
              Authorization: `Bearer ${clientSecret}`,
            },
          }
        );

        if (!response.data?.data) {
          return false;
        }

        return response.data.data.some(
          (purchase: any) => purchase.product_id === productId && purchase.status === "approved"
        );
      } catch (error) {
        console.error("❌ Error checking purchase:", error);
        return false;
      }
    },

    async hasAnyPurchase(email: string): Promise<boolean> {
      try {
        if (!hasKiwifyConfig) {
          return email.toLowerCase() === "speakai.agency@gmail.com";
        }

        const normalizedEmail = email.toLowerCase();

        const response = await axios.get(`${KIWIFY_API_URL}/customers`, {
          headers: {
            Authorization: `Bearer ${clientSecret}`,
          },
          params: { email: normalizedEmail },
        });

        if (!response.data?.data?.length) {
          return false;
        }

        const customer = response.data.data[0];
        const purchasesResponse = await axios.get(
          `${KIWIFY_API_URL}/customers/${customer.id}/purchases`,
          {
            headers: {
              Authorization: `Bearer ${clientSecret}`,
            },
          }
        );

        if (!purchasesResponse.data?.data) {
          return false;
        }

        return purchasesResponse.data.data.some(
          (purchase: any) => purchase.status === "approved"
        );
      } catch (error) {
        console.error("❌ Error checking any purchase:", error);
        return false;
      }
    },

    async authenticateUser(email: string, password: string): Promise<KiwifyUser | null> {
      try {
        const normalizedEmail = email.toLowerCase();

        if (!hasKiwifyConfig) {
          if (normalizedEmail === "speakai.agency@gmail.com" && password === "Diamante2019@") {
            return {
              id: "dev-user-001",
              email: normalizedEmail,
              name: "Speak AI Admin",
              status: "active",
              products: [],
            };
          }
          return null;
        }

        const response = await axios.get(`${KIWIFY_API_URL}/customers`, {
          headers: {
            Authorization: `Bearer ${clientSecret}`,
          },
          params: { email: normalizedEmail },
        });

        if (!response.data?.data?.length) {
          return null;
        }

        const customer = response.data.data[0];

        if (customer.status === "active") {
          return {
            id: customer.id,
            email: customer.email.toLowerCase(), // normaliza também no retorno
            name: customer.name,
            status: customer.status,
            products: customer.products || [],
          };
        }
        return null;
      } catch (error: any) {
        console.error("❌ Kiwify API error:", error.response?.status, error.response?.data);
        return null;
      }
    },
  };
}
