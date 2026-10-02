export function generateWhatsAppLink(phone: string, productName: string, price: number) {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Se actualizó EngMarketplace por MECASTORE
  const message = `Hola, estoy interesado en tu producto "${productName}" publicado a S/ ${price} en MECASTORE. ¿Todavía está disponible?`;
  
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}