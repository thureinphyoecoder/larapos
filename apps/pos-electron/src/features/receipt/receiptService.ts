import type { Order } from "../../core/types/contracts";

export type ReceiptLineInput = {
  sku: string;
  productName: string;
  qty: number;
  price: number;
};

type ReceiptPayload = {
  order: Order;
  cashierName: string;
  lines: ReceiptLineInput[];
};

const RECEIPT_SEPARATOR = "----------------------------------------";

export const receiptService = {
  buildText(payload: ReceiptPayload): string {
    const dateText = new Date(payload.order.created_at).toLocaleString();
    const orderCode = payload.order.id > 0 ? `#${payload.order.id}` : `Q${Math.abs(payload.order.id)}`;
    const itemLines = payload.lines.length
      ? payload.lines.map((line) => {
          const subtotal = line.qty * line.price;
          return `${line.productName} (${line.sku}) x${line.qty} = ${subtotal.toLocaleString()} MMK`;
        })
      : ["No line items"];

    return [
      "LaraPOS Receipt",
      RECEIPT_SEPARATOR,
      `Order: ${orderCode}`,
      `Status: ${payload.order.status}`,
      `Date: ${dateText}`,
      `Cashier: ${payload.cashierName}`,
      RECEIPT_SEPARATOR,
      ...itemLines,
      RECEIPT_SEPARATOR,
      `Total: ${payload.order.total_amount.toLocaleString()} MMK`,
    ].join("\n");
  },

  async printText(
    text: string,
    options?: { silent?: boolean; simulate?: boolean },
  ): Promise<{ ok: boolean; message?: string }> {
    return window.desktopBridge.receiptPrint({
      text,
      silent: options?.silent ?? false,
      simulate: options?.simulate ?? false,
    });
  },
};
