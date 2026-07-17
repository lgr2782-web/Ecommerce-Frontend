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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Configuración Dinámica de la URL de la API ---
const API_URL = process.env.REACT_APP_API_URL || 'https://ecommerce-backend-qf6n.onrender.com/api/v1';

// ✅ SOLUCIÓN AL ERROR DE BABEL: Función PDF al nivel superior, aislada y segura
const generateInvoicePDF = (order, company) => {
  const doc = new jsPDF();

  // Mapeo dinámico de datos de la empresa
  const companyName = company?.name || "Mercadito PYMES";
  const companyId = company?.cedula_juridica || "999999999";
  const companyEmail = company?.email || "admin@pymes.cr";
  const companyPhone = company?.phone || "9999-9999";
  const companyAddress = company?.address || "Direccion";

  // Variables dinámicas del pedido
  const orderId = order.id || order.order_id || "N/A";
  const rawAmount = order.total_amount || order.total || order.monto || 0;
  const transactionId = order.transaction_id || order.transactionId || order.referencia || 'Verificado en Cuenta';

  // --- 1. ENCABEZADO DEL COMPROBANTE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); 
  doc.text(companyName, 14, 25);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Cédula: ${companyId}`, 14, 31);
  doc.text(`Contacto: ${companyEmail} | Tel: ${companyPhone}`, 14, 36);
  doc.text(`Dirección: ${companyAddress}`, 14, 41);

  // Línea divisoria decorativa
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 46, 196, 46);

  // --- 2. DETALLES DE LA TRANSACCIÓN ---
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DE FACTURACIÓN:", 14, 55);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Pedido #: ${orderId}`, 14, 61);
  doc.text(`Fecha de Pago: ${new Date().toLocaleDateString('es-CR')}`, 14, 67);
  doc.text(`Método de Pago: SINPE Móvil`, 14, 73);

  // --- 3. DATOS DEL CLIENTE ---
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", 120, 55);
  
  doc.setFont("helvetica", "normal");
  doc.text(`${order.customer_name || order.customer || 'Cliente Verificado'}`, 120, 61);
  if (order.customer_phone || order.phone) {
    doc.text(`Tel: ${order.customer_phone || order.phone}`, 120, 67);
  }

  // --- 4. TABLA DE ARTÍCULOS / COBRO ---
  autoTable(doc, {
    startY: 82,
    head: [['Descripción del Servicio / Mercadería', 'Referencia SINPE', 'Monto Total']],
    body: [
      [
        `Cancelación de productos correspondientes al pedido número #${orderId}`,
        transactionId,
        `₡${Number(rawAmount).toLocaleString('es-CR')}`
      ]
    ],
    headStyles: { 
      fillColor: [30, 41, 59], 
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: { 
      fontSize: 10, 
      cellPadding: 6,
      font: 'helvetica'
    },
    theme: 'grid'
  });

  // --- 5. PIE DE PÁGINA CON CAPTURA SEGURA DE ALTURA ---
  let finalY = 120;
  if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
    finalY = doc.lastAutoTable.finalY + 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 163, 74); 
  doc.text("¡Su transferencia ha sido procesada con éxito!", 14, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Este documento sirve como comprobante digital de liquidación de saldo.", 14, finalY + 6);
  doc.text(`¡Gracias por su compra y por apoyar a ${companyName}!`, 14, finalY + 11);

  // --- 6. DESCARGA AUTOMÁTICA ---
  doc.save(`Comprobante_Pago_Pedido_${orderId}.pdf`);
};

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- Estados de Notificaciones y Errores ---
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- Estados de Datos ---
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, criticalStock: [] });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]); 
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]); 
  
  // --- Estados de Formularios (Crear / Editar) ---
  const [productForm, setProductForm] = useState({
    name: '', description: '', sku: '', cabys_code: '', price: '', stock: '', category_id: '', is_published: true
  });
  const [editingProductId, setEditingProductId] = useState(null); 
  const [imageFile, setImageFile] = useState(null);
  
  // Categorías Formulario
  const [categoryForm, setCategoryForm] = useState({ name: '', descripcion: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Colaboradores Formulario Edición
  const [editingUser, setEditingUser] = useState(null); 

  // Ajustes de Empresa Formulario Unificado
  const [companyForm, setCompanyForm] = useState({
    name: '', cedula_juridica: '', email: '', phone: '', address: '', currency: 'CRC'
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
    }
  };

const fetchSinpeOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ✅ LECTURA FIEL: Sin forzar estados. 
      // Si el backend dice 'Pendiente', se muestra 'Pendiente'.
      setOrders(response.data); 
      
    } catch (error) {
      console.error('Error al cargar órdenes', error);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        const data = response.data.company || response.data;
        setCompanyForm({
          name: data.name || '',
          cedula_juridica: data.cedula_juridica || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          currency: data.currency || 'CRC'
        });
      }
    } catch (error) {
      console.error('Error al cargar perfil de empresa', error);
    }
  };

  const BACKEND_BASE_URL = API_URL.replace('/api/v1', '');

  const fetchStaffList = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Error al cargar personal', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`); 
      setCategories(response.data);
    } catch (error) {
      console.error('Error al obtener categorías', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/shop/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos', error);
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
      setMessage('❌ Error al guardar el producto. Verifique los datos o SKU único.');
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
      is_published: product.is_published ?? true
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
        await axios.put(`${API_URL}/categories/${editingCategoryId}`, categoryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Categoría actualizada con éxito.');
      } else {
        await axios.post(`${API_URL}/categories`, categoryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Categoría creada correctamente.');
      }
      cancelCategoryEdit();
      fetchCategories();
    } catch (error) {
      setMessage('❌ Error al procesar la categoría.');
    }
  };

  const handleEditCategoryClick = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      descripcion: category.descripcion || category.description || ''
    });
  };

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', descripcion: '' });
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`¿Desea eliminar la categoría "${name}"?`)) {
      try {
        await axios.delete(`${API_URL}/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`🗑️ Categoría "${name}" eliminada.`);
        fetchCategories();
      } catch (error) {
        setMessage('❌ Error al intentar eliminar la categoría.');
      }
    }
  };

  // --- ACCIONES DE COLABORADORES ---
  const handleInactivateUser = async (id, name) => {
    if (window.confirm(`¿Desea revocar el acceso del colaborador ${name}?`)) {
      try {
        await axios.delete(`${API_URL}/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`⚠️ El acceso para ${name} ha sido revocado.`);
        fetchStaffList();
      } catch (error) {
        setMessage('❌ Error al intentar inactivar al usuario.');
      }
    }
  };

  // --- CONFIGURACIÓN DE EMPRESA ---
  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    setMessage(''); 
    setError('');   
    try {
      const response = await axios.put(`${API_URL}/admin/company`, companyForm, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 200 || response.status === 201) {
        setMessage('✅ Ajustes de la empresa guardados correctamente en la base de datos.');
      }
    } catch (err) {
      setError('❌ Error al intentar guardar los ajustes de la empresa.');
    }
  };

  // --- APROBACIÓN DE PEDIDOS SINPE ---
  const handleApproveOrder = async (orderId) => {
    try {
      const response = await axios.put(`${API_URL}/admin/orders/${orderId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(o => o.id === orderId ? { ...o, status: 'Pagado' } : o)
        );
        generateInvoicePDF(response.data.order || { id: orderId, ...orders.find(o => o.id === orderId) }, companyForm); 
        setMessage("¡Pago verificado con éxito y comprobante generado!");
      }
    } catch (error) {
      console.error("Error al aprobar:", error);
      setMessage("❌ Error al procesar la aprobación del pago.");
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

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {message && (
          <div className="mb-6 p-4 bg-white border-l-4 border-blue-600 text-blue-900 rounded-r-lg shadow-sm font-medium text-sm flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-white border-l-4 border-red-500 text-red-900 rounded-r-lg shadow-sm font-medium text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && user?.role === 'Administrador' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Métricas del Negocio</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-green-500">
                <span className="text-gray-400 text-xs font-bold uppercase">Total Ingresos Brutos</span>
                <p className="text-3xl font-black text-gray-800 mt-2">₡{Number(stats.revenue).toLocaleString('es-CR')}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-blue-500">
                <span className="text-gray-400 text-xs font-bold uppercase">Órdenes Completadas</span>
                <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalOrders} pedidos</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-amber-500">
                <span className="text-gray-400 text-xs font-bold uppercase">Alertas de Inventario</span>
                <p className="text-3xl font-black text-gray-800 mt-2">{stats.criticalStock?.length || 0} Artículos Bajos</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SINPE MÓVIL */}
        {activeTab === 'sinpe' && user?.role === 'Administrador' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2 mb-4">
              <QrCode className="w-6 h-6 text-green-600" />
              <span>Verificación de Transferencias SINPE Móvil</span>
            </h1>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                    <th className="p-3">Pedido #</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Referencia</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} className="border-b hover:bg-gray-50 text-sm">
                      <td className="p-3 font-bold text-blue-900">#{ord.id}</td>
                      <td className="p-3">{ord.customer || ord.customer_name}</td>
                      <td className="p-3 font-bold">₡{Number(ord.total || ord.total_amount).toLocaleString('es-CR')}</td>
                      <td className="p-3"><span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{ord.transaction_id || ord.reference}</span></td>
                      <td className="p-3">
                        {/* Solo mostramos badge verde si el status es EXACTAMENTE 'Pagado' */}
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ord.status === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {ord.status === 'Pagado' ? '● Aprobado' : '⏳ Pendiente'}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {/* Solo mostramos el botón de Validar si NO está pagado */}
                        {ord.status !== 'Pagado' ? (
                          <button onClick={() => handleApproveOrder(ord.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center space-x-1 mx-auto">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Validar</span>
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium italic">Procesado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border max-w-4xl">
              <h1 className="text-xl font-bold text-gray-800 mb-4">{editingProductId ? '✏️ Editando Producto' : 'Registrar Nuevo Producto'}</h1>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Nombre</label>
                  <input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">SKU</label>
                  <input type="text" required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Código CABYS</label>
                  <input type="text" required value={productForm.cabys_code} onChange={(e) => setProductForm({ ...productForm, cabys_code: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Categoría</label>
                  <select required value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm bg-white">
                    <option value="">Seleccione...</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Precio (₡)</label>
                  <input type="number" required value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Inventario</label>
                  <input type="number" required value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-600">Imagen</label>
                  <input id="productImageInput" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="mt-1 w-full p-1 border rounded-md text-sm bg-white cursor-pointer" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-600">Descripción</label>
                  <textarea rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
                </div>
                <div className="md:col-span-2 flex items-center space-x-2">
                  <input type="checkbox" id="is_published" checked={productForm.is_published} onChange={(e) => setProductForm({ ...productForm, is_published: e.target.checked })} className="h-4 w-4" />
                  <label htmlFor="is_published" className="text-sm font-semibold text-gray-700">Publicar artículo en catálogo visible</label>
                </div>
                <div className="md:col-span-2 flex space-x-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm uppercase">Guardar Producto</button>
                  {editingProductId && <button type="button" onClick={cancelProductEdit} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 rounded-lg text-sm">Cancelar</button>}
                </div>
              </form>
            </div>

            {/* TABLA DE PRODUCTOS ACTUALES */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Productos en Catálogo</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                      <th className="p-3">Imagen</th>
                      <th className="p-3">Nombre / SKU</th>
                      <th className="p-3">Precio</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod.id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="p-3">
                          {prod.image_url ? (
                            <img src={prod.image_url.startsWith('http') ? prod.image_url : `${BACKEND_BASE_URL}${prod.image_url}`} alt={prod.name} className="w-12 h-12 object-cover rounded border" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-gray-400 text-xs rounded border">No Img</div>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-gray-800">{prod.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{prod.sku}</p>
                        </td>
                        <td className="p-3 font-semibold">Base: ₡{Number(prod.price).toLocaleString('es-CR')}</td>
                        <td className="p-3 font-mono">{prod.stock} u.</td>
                        <td className="p-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${prod.is_published ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {prod.is_published ? 'Activo' : 'Borrador'}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button onClick={() => handleEditProductClick(prod)} className="text-blue-600 hover:text-blue-800 inline-block"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteProduct(prod.id, prod.name)} className="text-red-600 hover:text-red-800 inline-block"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORÍAS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{editingCategoryId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Nombre</label>
                  <input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Descripción</label>
                  <textarea rows="3" value={categoryForm.descripcion} onChange={(e) => setCategoryForm({ ...categoryForm, descripcion: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm uppercase">Guardar</button>
                  {editingCategoryId && <button type="button" onClick={cancelCategoryEdit} className="bg-gray-300 text-gray-800 font-bold px-3 rounded text-sm">X</button>}
                </div>
              </form>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Estructura de Categorías</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="p-3 font-bold text-gray-800">{cat.name}</td>
                        <td className="p-3 text-gray-500">{cat.descripcion || cat.description || 'Sin descripción'}</td>
                        <td className="p-3 text-center space-x-3">
                          <button onClick={() => handleEditCategoryClick(cat)} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONTROL DE PERSONAL (STAFF) */}
        {activeTab === 'users' && user?.role === 'Administrador' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Gestión de Accesos de Colaboradores</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo Electrónico</th>
                    <th className="p-3">Rol Asignado</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Revocar</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50 text-sm">
                      <td className="p-3 font-bold text-gray-800">{member.name}</td>
                      <td className="p-3 font-mono">{member.email}</td>
                      <td className="p-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-bold uppercase">{member.role}</span></td>
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${member.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {member.is_active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {member.is_active !== false && member.id !== user.id ? (
                          <button onClick={() => handleInactivateUser(member.id, member.name)} className="text-red-600 hover:text-red-800 p-1"><UserMinus className="w-4 h-4 mx-auto" /></button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No permitido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PERFIL DE EMPRESA */}
        {activeTab === 'config' && user?.role === 'Administrador' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border max-w-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-900" />
              <span>Ajustes Generales de la Empresa</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">Esta información aparecerá automáticamente en el membrete superior de todos los PDF de facturación.</p>
            <form onSubmit={handleCompanyUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-600">Nombre Comercial o Razón Social</label>
                <input type="text" required value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-600">Cédula Jurídica / Identificación Física</label>
                <input type="text" required value={companyForm.cedula_juridica} onChange={(e) => setCompanyForm({ ...companyForm, cedula_juridica: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm font-mono" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Email de Soporte</label>
                  <input type="email" required value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-600">Teléfono Comercial / SINPE</label>
                  <input type="text" required value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-600">Dirección Física del Local</label>
                <textarea rows="2" required value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} className="mt-1 w-full p-2 border rounded-md text-sm" />
              </div>
              <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded text-sm uppercase tracking-wider">Guardar en Base de Datos</button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;