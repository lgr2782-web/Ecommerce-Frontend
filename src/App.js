import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Importación de Contextos Globales
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Importación de Componentes de Seguridad y Vistas
import ProtectedRoute from './components/ProtectedRoute';
import Shop from './pages/Shop';
import AdminDashboard from './pages/AdminDashboard';
import Cart from './pages/Cart';

// Componente simple para simular el Login (puedes expandirlo luego)
import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';

const Login = () => {
  const { login, register, user, logout } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      const res = await register(name, email, password);
      if (res.success) {
        setMsg('¡Registro exitoso! Ya puedes iniciar sesión.');
        setIsRegister(false);
      } else {
        setMsg(res.error);
      }
    } else {
      const res = await login(email, password);
      if (res.success) {
        setMsg(`¡Bienvenido de nuevo, rol: ${res.role}!`);
      } else {
        setMsg(res.error);
      }
    }
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold mb-2">Sesión Activa</h2>
        <p className="text-gray-600 mb-4">Hola, {user.name} ({user.role})</p>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{isRegister ? 'Registro de Cliente' : 'Iniciar Sesión'}</h2>
      {msg && <p className="mb-4 text-center text-sm font-semibold text-blue-600">{msg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-sm font-medium">Nombre Completo</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Correo Electrónico</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Contraseña</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">
          {isRegister ? 'Registrarse' : 'Ingresar'}
        </button>
      </form>
      <button onClick={() => { setIsRegister(!isRegister); setMsg(''); }} className="w-full text-center text-sm text-blue-500 mt-4 hover:underline">
        {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
      </button>
    </div>
  );
};

// COMPONENTE APP PRINCIPAL
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            {/* Barra de Navegación Global (Header) */}
            <header className="bg-white shadow-sm no-print">
              <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="text-xl font-black text-blue-900 tracking-tight">
                  🛒 PYME<span className="text-blue-500">Express</span> CR
                </Link>
                <nav className="flex space-x-6 font-semibold text-gray-600">
                  <Link to="/" className="hover:text-blue-600 transition-colors">Tienda</Link>
                  <Link to="/cart" className="hover:text-blue-600 transition-colors">Carrito</Link>
                  <Link to="/admin" className="hover:text-blue-600 transition-colors">Panel Admin</Link>
                  <Link to="/login" className="hover:text-blue-600 transition-colors">Mi Cuenta</Link>
                </nav>
              </div>
            </header>

            {/* Vistas Dinámicas */}
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Shop />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                
                {/* Ruta Protegida: Solo Administradores y Colaboradores */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['Administrador', 'Colaborador']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm no-print">
              <p>© 2026 PYME Commerce Costa Rica. Todos los derechos reservados.</p>
            </footer>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;