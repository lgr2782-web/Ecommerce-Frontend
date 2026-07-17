import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { ShoppingCart, Search, CheckCircle } from 'lucide-react'; // Añadimos ícono de confirmación

// === Configuración Dinámica de la URL de la API ===
const API_URL = process.env.REACT_APP_API_URL || 'https://ecommerce-backend-qf6n.onrender.com/api/v1';
const BACKEND_BASE_URL = API_URL.replace('/api/v1', '');

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const { addToCart } = useContext(CartContext);
  
  // 👇 NUEVO: Estado para controlar el mensaje flotante de éxito
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/shop/products?search=${search}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos de la tienda', error);
    }
  };

  // 👇 NUEVO: Función mejorada para añadir al carrito y activar la alerta flotante
  const handleAddToCart = (product) => {
    addToCart(product);
    setToastMessage(`🛒 ¡"${product.name}" agregado al carrito con éxito!`);
    
    // El mensaje desaparecerá automáticamente después de 2.5 segundos
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      
      {/* 👇 NUEVO: Componente Visual del Mensaje Flotante (Toast) */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-gray-800 animate-bounce max-w-sm">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Encabezado y buscador */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Comercios de Costa Rica 🇨🇷</h1>
          <p className="text-gray-600 mt-1">Apoya a las PYMEs nacionales comprando directo aquí</p>
        </div>
        
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <p className="col-span-full text-gray-500 text-center bg-white p-6 rounded-lg border border-dashed">
            No se encontraron productos disponibles en este momento.
          </p>
        ) : (
          products.map((product) => {
            const hasDiscount = parseFloat(product.discount_price) > 0;
            const displayPrice = hasDiscount ? product.discount_price : product.price;

            let imageSource = 'https://placehold.co/300';
            if (product.image_url) {
              imageSource = product.image_url.startsWith('http') 
                ? product.image_url 
                : `${BACKEND_BASE_URL}${product.image_url}`;
            }

            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
                <div>
                  <img
                    src={imageSource}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = 'https://placehold.co/300';
                    }}
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    {hasDiscount && (
                      <span className="text-xs line-through text-red-500 mr-2">
                        ₡{Number(product.price).toLocaleString('es-CR')}
                      </span>
                    )}
                    <span className="text-xl font-extrabold text-blue-600">
                      ₡{Number(displayPrice).toLocaleString('es-CR')}
                    </span>
                  </div>
                  
                  {/* 👇 CAMBIADO: Ahora llama a handleAddToCart en lugar de addToCart directamente */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
                    title="Añadir al carrito"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Shop;