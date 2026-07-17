import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://ecommerce-backend-qf6n.onrender.com/api/v1';

const Cart = () => {
  // Extraemos los elementos del carrito y las funciones de control
  const { cart, clearCart, removeFromCart } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const [reference, setReference] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estado para la información de la empresa (Valores iniciales vacíos para notar el cambio)
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Cargando titular...',
    phone: 'Cargando teléfono...'
  });

  // 👇 SOLUCIÓN AL MONTO: Calculamos la totalidad de la compra EN TIEMPO REAL aquí mismo
  const totalCompra = cart.reduce((acc, item) => {
    // Validamos si viene con precio de descuento o precio normal
    const hasDiscount = parseFloat(item.discount_price) > 0;
    const precioActivo = hasDiscount ? parseFloat(item.discount_price) : parseFloat(item.price || 0);
    return acc + (precioActivo * (item.quantity || 1));
  }, 0);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        console.log("Intentando conectar al endpoint de empresa:", `${API_URL}/admin/company`);
        const response = await axios.get(`${API_URL}/admin/company`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        console.log("Respuesta de la BD recibida con éxito:", response.data);

        if (response.data) {
          // Validamos si los datos vienen directo o dentro de un objeto anidado como response.data.company
          const data = response.data.company || response.data;
          
          setCompanyInfo({
            name: data.name || "Nombre no definido en BD",
            phone: data.phone || "Teléfono no definido en BD"
          });
        }
      } catch (error) {
        console.error("Error crítico al traer datos de la BD:", error);
        // Respaldo de seguridad si el backend de Render da error
        setCompanyInfo({
          name: "Mercadito Pyme S.A. (Respaldo)",
          phone: "8888-9999"
        });
      }
    };

    fetchCompanyInfo();
  }, [token]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!reference.trim()) {
      alert("Por favor, ingrese el número de comprobante SINPE.");
      return;
    }

    try {
      const orderData = {
        items: cart,
        total: totalCompra,
        total_amount: totalCompra,
        payment_method: 'SINPE Móvil',
        transaction_reference: reference,
        payment_status: 'Pendiente de Verificación'
      };

      await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg('🎉 ¡Pedido registrado! Su pago está en revisión.');
      clearCart();
      setReference('');
    } catch (error) {
      console.error("Error al enviar la orden:", error);
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
      {/* Lado Izquierdo: Productos */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tu Carrito</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500 bg-gray-50 p-4 rounded-lg border border-dashed text-center">El carrito está vacío actualmente.</p>
        ) : (
          <div className="space-y-4">
            {cart.map(item => {
              const hasDiscount = parseFloat(item.discount_price) > 0;
              const precioUnitario = hasDiscount ? item.discount_price : item.price;
              
              return (
                <div key={item.id} className="flex justify-between items-center border-b pb-3 pt-1">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Cantidad: {item.quantity} x ₡{Number(precioUnitario).toLocaleString('es-CR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-gray-900">
                      ₡{(Number(precioUnitario) * (item.quantity || 1)).toLocaleString('es-CR')}
                    </span>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            <div className="flex justify-between items-center text-lg font-black pt-4 text-gray-950 border-t border-gray-200">
              <span>Total a pagar:</span>
              <span className="text-xl text-blue-900">₡{totalCompra.toLocaleString('es-CR')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Lado Derecho: Instrucciones */}
      {cart.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 h-fit">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Pago por SINPE Móvil 🇨🇷</h3>
          
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-950 space-y-2 mb-6">
            <p>1. Realice la transferencia desde la app de su banco al número:</p>
            <p className="text-base font-extrabold text-center bg-white py-1 rounded border border-blue-200 text-blue-600 font-mono">
              {companyInfo.phone}
            </p>
            <p>2. A nombre de: <strong>{companyInfo.name}</strong></p>
            {/* ✅ Vinculado al cálculo matemático local exacto */}
            <p>3. Monto exacto a transferir: <strong className="text-red-600">₡{totalCompra.toLocaleString('es-CR')}</strong></p>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            {/* ✅ BLOQUE DE SEGURIDAD: Verifica si el usuario tiene token (está logueado) */}
            {!token ? (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                <p className="text-sm text-amber-800 font-bold mb-3">
                  ⚠️ Debe iniciar sesión o registrarse para completar el pedido.
                </p>
                <button 
                  type="button"
                  onClick={() => window.location.href = '/login'} // Cambia '/login' por tu ruta real
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 rounded transition-colors text-sm"
                >
                  Ir a Iniciar Sesión / Registrarse
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default Cart;