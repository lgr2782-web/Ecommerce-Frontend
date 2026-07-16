import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { ShoppingCart, Search } from 'lucide-react';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/shop/products?search=${search}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos de la tienda', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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
        {products.map((product) => {
          const hasDiscount = parseFloat(product.discount_price) > 0;
          const displayPrice = hasDiscount ? product.discount_price : product.price;

          // 1. Validar la procedencia de la imagen para estructurar la URL correcta
          let imageSource = 'https://placehold.co/300';
          if (product.image_url) {
            // Si ya viene con el dominio 'http' (que configuramos en el controlador nuevo), la usamos directo.
            // Si solo guardaste el nombre del archivo en la base de datos, le concatenamos la ruta del servidor local.
            imageSource = product.image_url.startsWith('http') 
              ? product.image_url 
              : `http://localhost:5000/uploads/${product.image_url}`;
          }

          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
              <div>
                <img
                  src={imageSource}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // 2. Si la imagen física del backend no existe o falla en cargar,
                    // evitamos un link roto reemplazándola en vivo por el placeholder estable.
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
                
                <button
                  onClick={() => addToCart(product)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;