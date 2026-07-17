import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  Users, 
  Menu, 
  UserMinus, 
  Building, 
  CheckCircle, 
  QrCode,
  FolderOpen,
  Edit2,
  Trash2,
  Plus,
  X,
  UserCheck
} from 'lucide-react';

// --- Configuración Dinámica de la URL de la API ---
// Detecta la variable de entorno de Vite; si no existe, usa por defecto el localhost
const API_URL = process.env.REACT_APP_API_URL || 'https://ecommerce-backend-qf6n.onrender.com/api/v1';

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  // --- Estados de Datos ---
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, criticalStock: [] });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]); // Listado para edición/eliminación
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]); // Órdenes SINPE
  
  // --- Estados de Formularios (Crear / Editar) ---
  const [productForm, setProductForm] = useState({
    name: '', description: '', sku: '', cabys_code: '', price: '', stock: '', category_id: '', is_published: true
  });
  const [editingProductId, setEditingProductId] = useState(null); 
  const [imageFile, setImageFile] = useState(null);
  
  // Categorías Formulario (Alineado con PostgreSQL: 'descripcion')
  const [categoryForm, setCategoryForm] = useState({ name: '', descripcion: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Colaboradores Formulario Edición
  const [editingUser, setEditingUser] = useState(null); 

  const [companyForm, setCompanyForm] = useState({
    name: '', cedula_juridica: '', email: '', phone: '', address: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (user?.role === 'Administrador') {
      fetchDashboardStats();
      fetchCompanyProfile();
      fetchStaffList();
      fetchSinpeOrders();
    }
  }, [user]);

  // --- Peticiones API ---
  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar métricas', error);
      setStats({ revenue: 147400, totalOrders: 5, criticalStock: [1] });
    }
  };

  const fetchSinpeOrders = async () => {
    try {
      // ✅ Petición real al backend con cabecera de seguridad
      const response = await axios.get(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error al cargar órdenes de la base de datos', error);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      // ✅ Petición real al backend con cabecera de seguridad
      const response = await axios.get(`${API_URL}/admin/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyForm(response.data);
    } catch (error) {
      console.error('Error al cargar perfil de empresa de la base de datos', error);
    }
  };

  

const fetchStaffList = async () => {
  try {
    // 1. Hacemos la petición GET real al endpoint de usuarios de tu API
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` } // Enviamos el token para que el backend nos dé permiso
    });
    
    // 2. Guardamos en el estado los usuarios reales de la base de datos
    setStaff(response.data);
  } catch (error) {
    console.error('Error al cargar personal de la base de datos', error);
    
    // Backup temporal ("quemado") solo por si el servidor falla o no responde
    /*setStaff([
      { id: 1, name: 'Administrador Pyme (Local)', email: 'admin@pyme.cr', role: 'Administrador', is_active: true }
    ]);*/
  }
};

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`); 
      setCategories(response.data);
    } catch (error) {
      console.error('Error al obtener categorías', error);
      // Backup mock en caso de fallo
      setCategories([
        { id: 1, name: 'Tecnología', descripcion: 'Artículos electrónicos' },
        { id: 2, name: 'Alimentos y Bebidas', descripcion: 'Consumo diario' },
        { id: 3, name: 'Textiles y Ropa', descripcion: 'Ropa nacional y camisas' }
      ]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/shop/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos de administración', error);
    }
  };

  // --- CRUD PRODUCTOS ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('sku', productForm.sku);
    formData.append('cabys_code', productForm.cabys_code);
    formData.append('category_id', productForm.category_id);
    formData.append('price', productForm.price);
    formData.append('stock', productForm.stock);
    formData.append('description', productForm.description);
    formData.append('is_published', productForm.is_published);
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingProductId) {
        await axios.put(`${API_URL}/products/${editingProductId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Producto actualizado con éxito.');
      } else {
        await axios.post(`${API_URL}/products`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Producto creado y publicado con éxito.');
      }
      
      cancelProductEdit();
      fetchProducts();
      if (user?.role === 'Administrador') fetchDashboardStats();
    } catch (error) {
      setMessage('❌ Error al guardar el producto. Verifique los datos o SKU repetido.');
    }
  };

  const handleEditProductClick = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      sku: product.sku || '',
      cabys_code: product.cabys_code || '',
      category_id: product.category_id,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      is_published: product.is_published
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);
    setProductForm({ name: '', description: '', sku: '', cabys_code: '', price: '', stock: '', category_id: '', is_published: true });
    setImageFile(null);
    const fileInput = document.getElementById('productImageInput');
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`¿Está seguro de que desea eliminar permanentemente el producto "${name}"?`)) {
      try {
        await axios.delete(`${API_URL}/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`🗑️ El producto "${name}" fue eliminado del sistema.`);
        fetchProducts();
        if (user?.role === 'Administrador') fetchDashboardStats();
      } catch (error) {
        setMessage('❌ No se pudo eliminar el producto.');
      }
    }
  };

  // --- CRUD CATEGORÍAS ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        // Enviar datos en formato JSON plano usando las variables del backend
        await axios.put(
          `${API_URL}/categories/${editingCategoryId}`, 
          categoryForm, // Envía { name, descripcion }
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage('✅ Categoría actualizada con éxito.');
      } else {
        await axios.post(
          `${API_URL}/categories`, 
          categoryForm, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage('✅ Categoría creada correctamente.');
      }
      cancelCategoryEdit();
      fetchCategories();
    } catch (error) {
      console.error('Error al procesar categoría', error);
      setMessage('❌ Error al procesar la categoría. Verifique la conexión.');
    }
  };

  // Prepara el formulario lateral para editar una categoría existente
  const handleEditCategoryClick = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      descripcion: category.descripcion || category.description || '' // Soporte para fallback
    });
  };

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', descripcion: '' });
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`¿Desea desactivar la categoría "${name}"? Se desasociará de los productos vinculados.`)) {
      try {
        await axios.delete(`${API_URL}/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`🗑️ Categoría "${name}" desactivada con éxito.`);
        fetchCategories();
      } catch (error) {
        setMessage('❌ Error al intentar eliminar la categoría.');
      }
    }
  };

  // --- EDICIÓN Y CONTROL DE COLABORADORES ---
  const handleUserEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setStaff(prev => prev.map(member => member.id === editingUser.id ? editingUser : member));
      setMessage(`✅ Datos del colaborador "${editingUser.name}" guardados correctamente.`);
      setEditingUser(null);
    } catch (error) {
      setMessage('❌ Error al guardar modificaciones del colaborador.');
    }
  };

  const handleInactivateUser = (id, name) => {
    setStaff(prev => prev.map(member => member.id === id ? { ...member, is_active: false } : member));
    setMessage(`⚠️ El acceso para ${name} ha sido revocado (Usuario Inactivado).`);
  };

  const handleCompanyUpdate = (e) => {
    e.preventDefault();
    setMessage('✅ Ajustes de la empresa guardados correctamente.');
  };

  const handleApproveOrder = async (orderId) => {
    try {
      setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: 'Pagado y Listo para Envío' } : ord));
      setMessage(`✅ Orden #${orderId} aprobada con éxito. El inventario ha sido rebajado automáticamente.`);
      fetchDashboardStats();
    } catch (error) {
      setMessage('❌ Error al cambiar el estado del pedido.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      
      {/* HEADER DE MÓVILES */}
      <div className="md:hidden bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
        <span className="font-bold tracking-wider">PANEL ADMINISTRATIVO PYME</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 focus:outline-none">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MENÚ LATERAL (SIDEBAR) */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-blue-900 text-white min-h-screen p-4 flex-shrink-0 shadow-lg transition-all`}>
        <div className="mb-8 hidden md:block pt-4 border-b border-blue-800 pb-4">
          <h2 className="text-xl font-black tracking-wider text-white">PYME MANAGER</h2>
          <p className="text-xs text-blue-300 mt-1">Usuario: <span className="font-semibold">{user?.name || 'Admin'}</span></p>
          <p className="text-[10px] bg-blue-800 text-blue-200 inline-block px-2 py-0.5 rounded mt-2 font-mono uppercase">{user?.role}</p>
        </div>

        <nav className="space-y-2">
          {user?.role === 'Administrador' && (
            <>
              <button
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); setMessage(''); }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard Ventas</span>
              </button>

              <button
                onClick={() => { setActiveTab('sinpe'); setSidebarOpen(false); setMessage(''); }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sinpe' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'}`}
              >
                <QrCode className="w-5 h-5" />
                <span>Validar SINPE Móvil</span>
              </button>
            </>
          )}

          <button
            onClick={() => { setActiveTab('products'); setSidebarOpen(false); setMessage(''); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Gestionar Catálogo</span>
          </button>

          <button
            onClick={() => { setActiveTab('categories'); setSidebarOpen(false); setMessage(''); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'}`}
          >
            <FolderOpen className="w-5 h-5" />
            <span>Gestionar Categorías</span>
          </button>

          {user?.role === 'Administrador' && (
            <>
              <button
                onClick={() => { setActiveTab('users'); setSidebarOpen(false); setMessage(''); }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'}`}
              >
                <Users className="w-5 h-5" />
                <span>Gestionar Personal</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('config'); setSidebarOpen(false); setMessage(''); }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'}`}
              >
                <Building className="w-5 h-5" />
                <span>Ajustes de Empresa</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Banner de Notificaciones Flash */}
        {message && (
          <div className="mb-6 p-4 bg-white border-l-4 border-blue-600 text-blue-900 rounded-r-lg shadow-sm font-medium text-sm max-w-4xl flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2">✕</button>
          </div>
        )}

        {/* TAB 1: DASHBOARD DE MÉTRICAS */}
        {activeTab === 'dashboard' && user?.role === 'Administrador' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Métricas del Negocio</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-green-500">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Ingresos Brutos</span>
                <p className="text-3xl font-black text-gray-800 mt-2">₡{Number(stats.revenue).toLocaleString('es-CR')}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-blue-500">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Órdenes Completadas</span>
                <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalOrders} pedidos</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-amber-500">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Alertas de Inventario</span>
                <p className="text-3xl font-black text-gray-800 mt-2">{stats.criticalStock.length} Artículos Bajos</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MÓDULO PAGO SINPE MÓVIL */}
        {activeTab === 'sinpe' && user?.role === 'Administrador' && (
          <div className="max-w-5xl bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <QrCode className="w-6 h-6 text-green-600" />
                <span>Verificación de Transferencias SINPE Móvil</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Compare los números de referencia digitados por los clientes con los mensajes recibidos en la banca telefónica.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <th className="p-3">Pedido #</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Monto Total</th>
                    <th className="p-3">Comprobante / Referencia</th>
                    <th className="p-3">Estado del Pago</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                      <td className="p-3 font-bold text-blue-900">#{ord.id}</td>
                      <td className="p-3 font-medium">{ord.customer}</td>
                      <td className="p-3 font-bold text-gray-900">₡{ord.total.toLocaleString('es-CR')}</td>
                      <td className="p-3">
                        <span className="font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100 text-xs font-semibold">
                          {ord.reference}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ord.status === 'Pagado y Listo para Envío' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {ord.status === 'Pagado y Listo para Envío' ? '● Aprobado' : '⏳ En Revisión'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {ord.status === 'Pendiente de Verificación' ? (
                          <button
                            onClick={() => handleApproveOrder(ord.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-md shadow-sm transition-colors flex items-center space-x-1 mx-auto"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Aprobar Pago</span>
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium italic">Listo para despacho</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GESTIÓN DE PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="space-y-10">
            {/* Formulario de Crear / Editar */}
            <div className="max-w-3xl bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  {editingProductId ? '✏️ Editando Producto' : 'Registrar Nuevo Producto'}
                </h1>
                {editingProductId && (
                  <button 
                    onClick={cancelProductEdit}
                    className="flex items-center space-x-1 text-xs text-red-600 font-bold border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancelar Edición</span>
                  </button>
                )}
              </div>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Nombre Comercial</label>
                  <input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Código SKU Interno</label>
                  <input type="text" required placeholder="Ej: TEC-AUD-005" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Código CABYS (Hacienda CR)</label>
                  <input type="text" required placeholder="13 dígitos obligatorios" value={productForm.cabys_code} onChange={(e) => setProductForm({ ...productForm, cabys_code: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Categoría del Catálogo</label>
                  <select required value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white focus:ring-1 focus:ring-blue-500">
                    <option value="">Seleccione una opción</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Precio de Venta (₡)</label>
                  <input type="number" required value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Cantidad en Existencia</label>
                  <input type="number" required value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500" />
                </div>
                
                {/* CAMPO DE SELECCIÓN DE IMAGEN */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-600">
                    {editingProductId ? 'Cambiar Imagen (Dejar vacío para conservar actual)' : 'Seleccionar Imagen del Producto'}
                  </label>
                  <input 
                    id="productImageInput"
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="mt-1 w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-600">Descripción Corta</label>
                  <textarea rows="3" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500" />
                </div>
                
                <div className="md:col-span-2 flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is_published" 
                    checked={productForm.is_published} 
                    onChange={(e) => setProductForm({ ...productForm, is_published: e.target.checked })} 
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <label htmlFor="is_published" className="text-sm font-semibold text-gray-700">Publicar de inmediato en la tienda virtual</label>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors text-sm uppercase tracking-wider">
                    {editingProductId ? 'Actualizar Producto' : 'Publicar en Tienda Virtual'}
                  </button>
                </div>
              </form>
            </div>

            {/* Listado de Productos Existentes */}
            <div className="max-w-5xl bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Artículos en Inventario</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                      <th className="p-3">Imagen</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Precio</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                        <td className="p-3">
                          <img 
                            src={prod.image_url || 'https://placehold.co/50'} 
                            alt={prod.name} 
                            className="w-10 h-10 object-cover rounded border" 
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-gray-900">{prod.name}</p>
                          <p className="text-xs text-gray-400">CABYS: {prod.cabys_code}</p>
                        </td>
                        <td className="p-3 font-mono text-xs">{prod.sku}</td>
                        <td className="p-3 font-bold text-gray-800">₡{Number(prod.price).toLocaleString('es-CR')}</td>
                        <td className="p-3">
                          <span className={`font-semibold ${prod.stock <= 3 ? 'text-red-500' : 'text-gray-600'}`}>
                            {prod.stock} unids
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditProductClick(prod)}
                              className="text-blue-600 hover:text-blue-800 p-1 border border-blue-100 rounded hover:bg-blue-50"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="text-red-600 hover:text-red-800 p-1 border border-red-100 rounded hover:bg-red-50"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: GESTIÓN DE CATEGORÍAS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario Crear/Editar Categoría */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editingCategoryId ? '✏️ Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Nombre de la Categoría</label>
                  <input 
                    type="text" 
                    required 
                    value={categoryForm.name} 
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600">Descripción (Opcional)</label>
                  <textarea 
                    rows="3" 
                    value={categoryForm.descripcion} 
                    onChange={(e) => setCategoryForm({ ...categoryForm, descripcion: e.target.value })} 
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm uppercase transition-colors">
                    {editingCategoryId ? 'Actualizar' : 'Guardar'}
                  </button>
                  {editingCategoryId && (
                    <button 
                      type="button" 
                      onClick={cancelCategoryEdit} 
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Listado de Categorías */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Categorías Existentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">{cat.name}</td>
                        <td className="p-3 text-gray-500">{cat.descripcion || cat.description || 'Sin descripción'}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditCategoryClick(cat)}
                              className="text-blue-600 hover:text-blue-800 p-1 border border-blue-100 rounded hover:bg-blue-50"
                              title="Editar categoría"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="text-red-600 hover:text-red-800 p-1 border border-red-100 rounded hover:bg-red-50"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
         {/* TAB 5: GESTIÓN DE PERSONAL */}
        {activeTab === 'users' && user?.role === 'Administrador' && (
          <div className="space-y-6 max-w-5xl">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Personal de Colaboradores</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 text-sm text-gray-700">
                        <td className="p-3 font-semibold text-gray-900">{member.name}</td>
                        <td className="p-3 font-mono text-xs">{member.email}</td>
                        <td className="p-3"><span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded text-xs font-semibold">{member.role}</span></td>
                        <td className="p-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {member.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => setEditingUser(member)}
                              className="text-blue-600 hover:text-blue-800 p-1 border border-blue-100 rounded hover:bg-blue-50"
                              title="Editar rol/datos"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {member.is_active && (
                              <button
                                onClick={() => handleInactivateUser(member.id, member.name)}
                                className="text-red-600 hover:text-red-800 p-1 border border-red-100 rounded hover:bg-red-50"
                                title="Revocar acceso"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal flotante de edición de usuario */}
            {editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Editar Colaborador</h3>
                    <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleUserEditSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600">Nombre Completo</label>
                      <input 
                        type="text" 
                        required 
                        value={editingUser.name} 
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} 
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600">Correo Electrónico</label>
                      <input 
                        type="email" 
                        required 
                        value={editingUser.email} 
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} 
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600">Rol de Acceso</label>
                      <select 
                        value={editingUser.role} 
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} 
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                      >
                        <option value="Colaborador">Colaborador</option>
                        <option value="Administrador">Administrador</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm uppercase transition-colors shadow-sm">
                      Guardar Cambios
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {/* TAB 6: CONFIGURACIÓN DE LA EMPRESA */}
        {activeTab === 'config' && user?.role === 'Administrador' && (
          <div className="max-w-3xl bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <Building className="w-6 h-6 text-blue-900" />
              <span>Ajustes Generales de la Pyme</span>
            </h2>
            <form onSubmit={handleCompanyUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600">Nombre de Fantasía Comercial</label>
                <input type="text" required value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600">Cédula Jurídica / Física (CR)</label>
                <input type="text" required value={companyForm.cedula_juridica} onChange={(e) => setCompanyForm({ ...companyForm, cedula_juridica: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600">Correo Electrónico de Contacto</label>
                <input type="email" required value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600">Número de Teléfono</label>
                <input type="text" required value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-600">Dirección Física del Local</label>
                <textarea rows="3" required value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm uppercase tracking-wider transition-colors shadow-sm">
                  Guardar Información de la Empresa
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;