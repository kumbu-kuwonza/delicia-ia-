
import { Order } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

export const printOrder = (order: Order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const printContent = `
    <html>
      <head>
        <title>Pedido #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { text-align: center; margin-bottom: 20px; }
          .items { margin-bottom: 20px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .total { font-weight: bold; border-top: 1px solid #000; padding-top: 10px; }
          .customer { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Pedido #${order.id}</h1>
          <p>${format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        <div class="items">
          <h2>Itens</h2>
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.product.name}</span>
              <span>${formatCurrency(item.product.price * item.quantity)}</span>
            </div>
          `).join('')}
          
          <div class="total">
            <span>Total:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </div>
        
        <div class="customer">
          <h2>Cliente</h2>
          <p>Nome: ${order.customer.name}</p>
          <p>Telefone: ${order.customer.phone}</p>
          <p>Endereço: ${order.customer.address}</p>
        </div>
      </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
};
