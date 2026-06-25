import apiClient from '@lib/axios'

export interface SubscribeResponse {
  subscription_id: string;
  razorpay_key_id: string;
}

export interface VerifyPayload {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  plan_tier: string;
}

export const subscribeToPlan = async (planId: string, tier: string): Promise<SubscribeResponse> => {
  const { data } = await apiClient.post<SubscribeResponse>('/billing/subscribe/', { plan_id: planId, plan_tier: tier })
  return data
}

export const verifyPayment = async (payload: VerifyPayload): Promise<void> => {
  await apiClient.post('/billing/verify/', payload)
}
