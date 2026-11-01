const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export const formatPrice = (amount) => naira.format(amount);

export const NIGERIAN_STATES = [
  'Abuja (FCT)', 'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

// Placeholder delivery fees by state until the backend's delivery-fee table is
// connected. These are not client-supplied values.
export function deliveryFee(state) {
  if (!state) return 0;
  if (state === 'Lagos') return 3000;
  if (state === 'Abuja (FCT)' || state === 'Ogun') return 4500;
  return 6000;
}
