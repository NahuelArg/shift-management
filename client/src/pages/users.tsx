// src/components/Users.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Asume que tienes esto
import axios from 'axios';
import NavBar from '../components/navBar';
import { Business } from '../services/businessService';
import { Employee } from '../services/userService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Users: React.FC = () => {
  const { user, token } = useAuth();

  // Estado de negocios
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  // Estado de empleados
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Estado de errores y éxito
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Crear empleado
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    businessId: '',
  });
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Editar empleado
  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [editEmployeeLoading, setEditEmployeeLoading] = useState(false);

  // Cargar negocios del admin
  useEffect(() => {
    if (user?.id) {
      fetchBusinesses();
    }
  }, [user?.id]);

  const fetchBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const response = await axios.get(
        `${API_BASE_URL}/admin/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const biz = response.data.businesses || [];
      setBusinesses(biz);
      if (biz.length > 0) {
        setSelectedBusiness(biz[0].id);
        setNewEmployee({ name: '', email: '', password: '', businessId: biz[0].id });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar negocios');
    } finally {
      setLoadingBusinesses(false);
    }
  };

  // Cargar empleados del negocio seleccionado
  useEffect(() => {
    if (selectedBusiness) {
      fetchEmployees();
    }
  }, [selectedBusiness, search, page, limit]);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/admin/employees`,
        {
          params: { businessId: selectedBusiness, search, page, limit },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEmployees(response.data.employees);
      setTotalEmployees(response.data.total);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al cargar empleados'
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Crear empleado
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(
        `${API_BASE_URL}/admin/employee`,
        {
          name: newEmployee.name,
          email: newEmployee.email,
          password: newEmployee.password,
          businessId: selectedBusiness,
          role: 'EMPLOYEE',
          authProvider: 'LOCAL',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Empleado creado exitosamente');
      setShowEmployeeForm(false);
      setNewEmployee({ name: '', email: '', password: '', businessId: selectedBusiness });
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear empleado');
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Editar empleado
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditEmployeeLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.put(
        `${API_BASE_URL}/admin/employee/${editEmployee.id}`,
        {
          name: editEmployee.name,
          email: editEmployee.email,
          ...(editEmployee.password && { password: editEmployee.password }),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Empleado actualizado exitosamente');
      setEditEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar empleado');
    } finally {
      setEditEmployeeLoading(false);
    }
  };

  // Eliminar empleado
  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este empleado?')) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/admin/employee/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Empleado eliminado exitosamente');
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar empleado');
    }
  };

  // Iniciar edición
  const handleEditClick = (employee: any) => {
    setEditEmployee({ ...employee, password: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Gestión de Empleados
          </h1>

          {/* Mensajes de error y éxito */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
              <button
                onClick={() => setError(null)}
                className="float-right font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
              <button
                onClick={() => setSuccess(null)}
                className="float-right font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mensaje de error si no hay negocios */}
          {businesses.length === 0 && !loadingBusinesses && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 text-center">
              No tienes negocios asignados. Por favor, crea un negocio primero.
            </div>
          )}

          {/* Selector de negocio */}
          {loadingBusinesses ? (
            <div className="mb-6 p-4 bg-gray-100 rounded">Cargando negocios...</div>
          ) : businesses.length > 0 ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un negocio:
              </label>
              <select
                value={selectedBusiness}
                onChange={(e) => {
                  setSelectedBusiness(e.target.value);
                  setNewEmployee({ name: '', email: '', password: '', businessId: e.target.value });
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 w-full md:w-64"
              >
                <option value="">-- Seleccionar --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Botón crear empleado */}
          {!showEmployeeForm && !editEmployee && selectedBusiness && (
            <button
              onClick={() => setShowEmployeeForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg mb-6 transition-colors"
            >
              + Crear Nuevo Empleado
            </button>
          )}

          {/* Formulario crear empleado */}
          {showEmployeeForm && (
            <form
              onSubmit={handleCreateEmployee}
              className="mb-8 bg-gray-50 p-6 rounded-lg max-w-md"
            >
              <h2 className="text-xl font-semibold mb-4">Crear Empleado</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={newEmployee.password}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      password: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={employeeLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    {employeeLoading ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmployeeForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Buscador */}
          {selectedBusiness && (
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <input
                type="text"
                placeholder="Buscar por nombre o email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 transition w-full md:w-64"
              />
              <div className="text-sm text-gray-600">
                Página {page} de{' '}
                {Math.max(1, Math.ceil(totalEmployees / limit))}
                <button
                  className="ml-4 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Anterior
                </button>
                <button
                  className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  disabled={
                    page === Math.ceil(totalEmployees / limit) ||
                    totalEmployees === 0
                  }
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* Tabla de empleados */}
          {selectedBusiness ? (
            loadingEmployees ? (
              <div className="text-center py-8 text-gray-500">
                Cargando empleados...
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay empleados en este negocio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Creado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {employee.role || 'EMPLOYEE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(employee.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleEditClick(employee)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              Selecciona un negocio para ver empleados
            </div>
          )}

          {/* Modal editar empleado */}
          {editEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                  onClick={() => setEditEmployee(null)}
                >
                  ✕
                </button>
                <h3 className="text-xl font-bold mb-4">Editar Empleado</h3>
                <form onSubmit={handleEditEmployee} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={editEmployee.name}
                    onChange={(e) =>
                      setEditEmployee({
                        ...editEmployee,
                        name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editEmployee.email}
                    onChange={(e) =>
                      setEditEmployee({
                        ...editEmployee,
                        email: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="password"
                    placeholder="Nueva contraseña (opcional)"
                    value={editEmployee.password}
                    onChange={(e) =>
                      setEditEmployee({
                        ...editEmployee,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={editEmployeeLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    {editEmployeeLoading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;