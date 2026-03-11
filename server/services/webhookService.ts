import crypto from "crypto";
import { storage } from "../storage";

export interface KiwifyWebhookData {
  purchase_id: string;
  customer_email: string;
  customer_name: string;
  product_name: string;
  product_id: string;
  checkout_link?: string;
  value: number;
  status: string;
}

// Custos fixos para outras operações
const CREDIT_COSTS = {
  chat: 1,
  image: 7,
  prompt: 0,
};

// Custos variáveis para vídeo conforme resolução
const VIDEO_COSTS: Record<string, number> = {
  "720p": 20,
  "1080p": 40,
  "4k": 100,
};

// Mapeamento de produtos → créditos
const CREDIT_MAP: Record<string, number> = {
  "97ObxqK": 100,
  "3gpZJ6N": 200,
  "M2XmJF7": 300,
  "ntcPS8x": 500,
  "Tqy289G": 1000,
  "f8d7PdX": 2000,
  "8IDayIy": 500,
  "QnHmsQm": 1500,
  "hOJ3bEi": 5000,

  "57c511c0-05d2-11f1-a5d8-9909e220e83a": 2000,
  "f1e06ef0-05d0-11f1-b57c-c9aa21f3f207": 5000,
};

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || "Speak123";

export async function verifyKiwifySignature(payload: string, signature: string): Promise<boolean> {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET || "";
  if (!secret) return true;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const hash = hmac.digest("hex");
  return hash === signature;
}

export async function handleKiwifyPurchase(data: KiwifyWebhookData) {
  try {
    if (data.status !== "approved") {
      return { success: false, message: "Compra não aprovada" };
    }

    let productKey: string | undefined;
    if (data.checkout_link && CREDIT_MAP[data.checkout_link]) {
      productKey = data.checkout_link;
    } else if (data.product_id && CREDIT_MAP[data.product_id]) {
      productKey = data.product_id;
    }

    const creditsToAdd = productKey ? CREDIT_MAP[productKey] : 0;
    if (creditsToAdd === 0) {
      console.warn(`⚠️ Produto não reconhecido: product_id=${data.product_id}, checkout_link=${data.checkout_link}`);
      return { success: false, message: "Produto não reconhecido" };
    }

    const alreadyProcessed = await storage.hasProcessedPurchase(data.purchase_id);
    if (alreadyProcessed) {
      console.log(`ℹ️ Compra ${data.purchase_id} já processada, ignorando duplicata.`);
      return { success: true, message: "Compra já processada", creditsAdded: 0 };
    }

    const normalizedEmail = data.customer_email.toLowerCase();
    let user = await storage.getUserByEmail(normalizedEmail);

    if (!user) {
      console.log(`🆕 Criando usuário automático para ${normalizedEmail}`);
      user = await storage.createUser({
        email: normalizedEmail,
        name: data.customer_name,
        password: DEFAULT_PASSWORD,
      });
    }

    await storage.addCredits(user.id, creditsToAdd, data.purchase_id);

    await storage.logWebhookEvent(
      data.purchase_id,
      user.id,
      creditsToAdd,
      productKey ?? data.product_id,
      data.product_name,
      data
    );

    console.log(`✅ Compra processada: ${creditsToAdd} créditos adicionados para ${user.email} (ID: ${user.id})`);

    return { success: true, message: `${creditsToAdd} créditos adicionados`, userId: user.id, creditsAdded: creditsToAdd };
  } catch (error) {
    console.error("🔥 Erro ao processar compra:", error);
    return { success: false, message: "Erro ao processar compra" };
  }
}

export async function deductCredits(
  userId: string,
  operationType: "chat" | "image" | "prompt" | "video",
  options?: { resolution?: string }
) {
  try {
    let cost: number;

    if (operationType === "video") {
      let resolution = (options?.resolution || "1080p").toLowerCase().trim();

      // Normalizar variações comuns
      if (resolution.startsWith("1080")) resolution = "1080p";
      else if (resolution.startsWith("720")) resolution = "720p";
      else if (resolution.includes("4")) resolution = "4k";

      if (!VIDEO_COSTS[resolution]) {
        resolution = "1080p"; // fallback final
      }

      cost = VIDEO_COSTS[resolution];
      console.log(`🎬 Resolução usada: ${resolution}, custo: ${cost}`);
    } else {
      cost = CREDIT_COSTS[operationType];
    }

    const currentCredits = await storage.getUserCredits(userId);

    if (!currentCredits || currentCredits.credits < cost) {
      return {
        success: false,
        error: "insufficient_credits",
        message: `Você precisa de ${cost} créditos para gerar ${operationType} em ${options?.resolution ?? "1080p"}. Compre mais créditos.`,
      };
    }

    const result = await storage.deductCredits(userId, cost);
    console.log(`✅ Deduzidos ${cost} créditos para ${operationType} (${options?.resolution ?? "1080p"}). Restante: ${result?.credits}`);

    return { success: true, creditsRemaining: result?.credits ?? currentCredits.credits - cost, cost };
  } catch (error) {
    console.error("🔥 Erro ao descontar créditos:", error);
    return { success: false, message: "Erro ao descontar créditos" };
  }
}
