import { Order } from '@/types';

/**
 * Função auxiliar para lidar com a lógica de impressão
 * @param bodyContent Conteúdo HTML do corpo do documento
 * @param styleContent Conteúdo CSS para o documento
 * @param title Título da janela de impressão
 */
const _printHtml = (bodyContent: string, styleContent: string, title: string): void => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Por favor, permita popups para imprimir comandas.');
    return;
  }
  
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          ${styleContent}
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

const baseStyleContent = `
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 10px;
    max-width: 300px;
  }
  .header {
    text-align: center;
    border-bottom: 1px dashed #000;
    padding-bottom: 10px;
    margin-bottom: 10px;
  }
  .order-info {
    margin-bottom: 15px;
  }
  .items {
    margin-bottom: 15px;
  }
  .item {
    margin-bottom: 5px;
  }
  .footer {
    border-top: 1px dashed #000;
    padding-top: 10px;
    font-size: 12px;
    text-align: center;
  }
  .bold {
    font-weight: bold;
  }
`;

/**
 * Serviço para impressão de comandas de pedidos
 * Suporta impressão para cozinha e para entregadores
 */
export const printOrderService = {
  /**
   * Imprime uma comanda para a cozinha
   * @param order Pedido a ser impresso
   */
  printKitchenOrder: (order: Order): void => {
    const styleContent = baseStyleContent;
    const bodyContent = `
        <div class="header">
          <h2>COMANDA - COZINHA</h2>
          <p>Pedido #${order.id}</p>
        </div>
        
        <div class="order-info">
          <p><span class="bold">Data/Hora:</span> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><span class="bold">Cliente:</span> ${order.customer.name}</p>
          ${order.customer.preferences ? `<p><span class="bold">Preferências:</span> ${order.customer.preferences}</p>` : ''}
          ${order.customer.allergies && order.customer.allergies.length > 0 ? `<p><span class="bold">Alergias:</span> ${order.customer.allergies.join(', ')}</p>` : ''}
          ${order.customer.dietaryRestrictions && order.customer.dietaryRestrictions.length > 0 ? `<p><span class="bold">Restrições:</span> ${order.customer.dietaryRestrictions.join(', ')}</p>` : ''}
        </div>
        
        <div class="items">
          <p class="bold">ITENS:</p>
          ${order.items.map(item => `
            <div class="item">
              <p><span class="bold">${item.quantity}x</span> ${item.product.name}</p>
              ${item.specialInstructions ? `<p>OBS: ${item.specialInstructions}</p>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Impresso em ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    _printHtml(bodyContent, styleContent, `Comanda #${order.id} - Cozinha`);
  },
  
  /**
   * Imprime uma comanda para entrega
   * @param order Pedido a ser impresso
   */
  printDeliveryOrder: (order: Order): void => {
    const deliverySpecificStyles = `
        .customer-info {
          border: 1px solid #000;
          padding: 10px;
          margin-bottom: 15px;
        }
        .total {
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
        }
    `;
    const styleContent = `${baseStyleContent}\n${deliverySpecificStyles}`;
    const bodyContent = `
        <div class="header">
          <h2>COMANDA - ENTREGA</h2>
          <p>Pedido #${order.id}</p>
        </div>
        
        <div class="order-info">
          <p><span class="bold">Data/Hora:</span> ${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        
        <div class="customer-info">
          <p><span class="bold">Cliente:</span> ${order.customer.name}</p>
          <p><span class="bold">Telefone:</span> ${order.customer.phone}</p>
          <p><span class="bold">Endereço:</span> ${order.customer.address}</p>
          ${order.deliveryMethod ? `<p><span class="bold">Método:</span> ${order.deliveryMethod}</p>` : ''}
          ${order.paymentMethod ? `<p><span class="bold">Pagamento:</span> ${order.paymentMethod}</p>` : ''}
        </div>
        
        <div class="items">
          <p class="bold">ITENS:</p>
          ${order.items.map(item => `
            <div class="item">
              <p>${item.quantity}x ${item.product.name} - R$ ${(item.product.price * item.quantity).toFixed(2)}</p>
            </div>
          `).join('')}
          
          <div class="total">
            <p>TOTAL: R$ ${order.total.toFixed(2)}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Impresso em ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    _printHtml(bodyContent, styleContent, `Comanda #${order.id} - Entrega`);
  }
};