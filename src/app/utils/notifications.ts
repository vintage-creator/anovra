import { supabase } from "./supabase";

export async function sendEmailNotification(template: string, body: Record<string, any>) {
  const { error } = await supabase.functions.invoke("send-onboarding-email", {
    body: { template, ...body },
  });
  if (error) {
    console.warn(`Email notification failed (${template}):`, error.message);
  }
}

export async function dispatchVendorWebhook(vendorId: string | null | undefined, eventType: string, payload: Record<string, any>) {
  if (!vendorId) return;
  const { error } = await supabase.functions.invoke("dispatch-webhook", {
    body: { vendor_id: vendorId, event_type: eventType, payload },
  });
  if (error) {
    console.warn(`Webhook dispatch failed (${eventType}):`, error.message);
  }
}
