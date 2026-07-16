import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2 } from 'lucide-react'; // Importamos un ícono de basurero limpio
import axios from 'axios';

const Cart = () => {
  // 1. Extraemos 'removeFromCart' de tu CartContext
  const { cart, total, clearCart, removeFromCart } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const [reference, setReference] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pymeSinpeTelefono = "8888-9999";
  const pymeTitular = "Mercadito Pyme S.A.";

const handleCheckout = async (e) => {
    e.preventDefault();
    if (!reference.trim()) {
      alert("Por favor, ingrese el número de comprobante SINPE.");
      return;
    }

    try {
      // Enviamos explícitamente 'total' y 'total_amount' con el valor del carrito
      const orderData = {
        items: cart,
        total: total || 0,
        total_amount: total || 0, // Así nos aseguramos de que no falte
        payment_method: 'SINPE Móvil',
        transaction_reference: reference,
        payment_status: 'Pendiente de Verificación'
      };

      await axios.post('http://localhost:5000/api/v1/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg('🎉 ¡Pedido registrado! Su pago está en revisión.');
      clearCart();
      setReference('');
    } catch (error) {
      alert('Error al procesar el pedido.');
    }
  };

  if (successMsg) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-green-50 rounded-xl text-center shadow-md">
        <h2 className="text-2xl font-bold text-green-800 mb-3">{successMsg}</h2>
        <p className="text-gray-600">El comercio verificará la transferencia y procederá con su envío.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
      {/* Lado Izquierdo: Lista de Productos en Carrito */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tu Carrito</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500 bg-gray-50 p-4 rounded-lg border border-dashed text-center">El carrito está vacío actualmente.</p>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b pb-3 pt-1">
                <div className="flex-1 pr-4">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Cantidad: {item.quantity} x ₡{(item.price || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-gray-900">₡{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
                  
                  {/* BOTÓN ELIMINAR ARTÍCULO */}
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center text-lg font-black pt-4 text-gray-950 border-t border-gray-200">
              <span>Total a pagar:</span>
              <span className="text-xl text-blue-900">₡{(total || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Lado Derecho: Instrucciones y Formulario de Pago SINPE */}
      {cart.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 h-fit">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Pago por SINPE Móvil 🇨🇷</h3>
          
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-950 space-y-2 mb-6">
            <p>1. Realice la transferencia desde la app de su banco al número:</p>
            <p className="text-base font-extrabold text-center bg-white py-1 rounded border border-blue-200 text-blue-600 font-mono">{pymeSinpeTelefono}</p>
            <p>2. A nombre de: <strong>{pymeTitular}</strong></p>
            <p>3. Monto exacto a transferir: <strong className="text-red-600">₡{(total || 0).toLocaleString()}</strong></p>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Número de Comprobante / Referencia</label>
              <input 
                type="text" 
                required 
                placeholder="Ej: 20260714..."
                value={reference} 
                onChange={(e) => setReference(e.target.value)}
                className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm text-sm uppercase tracking-wider">
              Confirmar Transferencia y Pedido
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Cart;